import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import SheetHeader from "@/components/ui/sheet-header";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { supabase } from "@/lib/supabase";
import { changePrivacy, getUserProfile } from "@/services/users";
import { haptics } from "@/utils/haptics";
import { unregisterPushToken } from "@/providers/notifications-provider";

/** Account settings, presented as a sheet over the profile. */
export default function Settings() {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const router = useRouter();
    const { user } = useAuthContext();

    const [isPublic, setIsPublic] = useState<boolean | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!user?.username) return;
        let active = true;
        getUserProfile(user.username).then((profile) => {
            if (active && profile) setIsPublic(profile.public);
        });
        return () => {
            active = false;
        };
    }, [user?.username]);

    const togglePrivacy = async (next: boolean) => {
        const previous = isPublic;
        // Flip immediately so the switch tracks the finger; undo on failure.
        setIsPublic(next);
        setSaving(true);
        try {
            const response = await changePrivacy(next);
            if (response.error) throw new Error(response.msg);
            setIsPublic(response.public);
            haptics.select();
        } catch (error) {
            console.error("Privacy update error:", error);
            setIsPublic(previous);
            Alert.alert("Couldn't update privacy", "Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const logOut = () => {
        Alert.alert("Log out", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Log out",
                style: "destructive",
                onPress: async () => {
                    try {
                        await unregisterPushToken();
                        await supabase.auth.signOut();
                        router.replace("/(auth)");
                    } catch (error) {
                        console.error("Logout error:", error);
                        Alert.alert("Couldn't log out", "Please try again.");
                    }
                },
            },
        ]);
    };

    const deleteAccount = () => {
        Alert.alert(
            "Delete account",
            "This permanently deletes your account: your events, bets, coins, and owned avatars are all removed, and any coins others staked on your still-open events are refunded to them. This can't be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete account",
                    style: "destructive",
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            const { error } = await supabase.rpc("delete_my_account");
                            if (error) throw error;
                            // The account and its push tokens are already gone server
                            // side, so only the stored session needs clearing; a server
                            // sign-out for a deleted user can fail and keep it around.
                            await supabase.auth.signOut({ scope: "local" }).catch(() => {});
                            router.replace("/(auth)");
                        } catch (error) {
                            console.error("Delete account error:", error);
                            setDeleting(false);
                            Alert.alert("Couldn't delete account", "Please try again.");
                        }
                    },
                },
            ],
        );
    };

    return (
        <View style={styles.container}>
            <SheetHeader title="Settings" />

            <View style={styles.group}>
                <View style={styles.row}>
                    <FontAwesome name={isPublic ? "globe" : "lock"} size={20} color={theme.text} style={styles.icon} />
                    <View style={styles.rowText}>
                        <Text style={styles.rowTitle}>Public profile</Text>
                        <Text style={styles.rowSubtitle}>
                            {isPublic === null
                                ? "Loading…"
                                : isPublic
                                    ? "Anyone can see your events and follow you."
                                    : "People must request to follow you."}
                        </Text>
                    </View>
                    {isPublic === null ? (
                        <ActivityIndicator color={theme.primary} />
                    ) : (
                        <Switch
                            value={isPublic}
                            onValueChange={togglePrivacy}
                            disabled={saving}
                            trackColor={{ false: theme.cardDividerStrong, true: theme.primary }}
                            thumbColor={theme.cardText}
                            accessibilityLabel="Public profile"
                        />
                    )}
                </View>

                <View style={styles.divider} />

                <TouchableOpacity
                    style={styles.row}
                    onPress={() => router.push(`/legal/terms`)}
                    accessibilityRole="button"
                >
                    <FontAwesome name="file-text-o" size={20} color={theme.text} style={styles.icon} />
                    <Text style={styles.rowTitle}>Terms of Service</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                    style={styles.row}
                    onPress={() => router.push(`/legal/privacy`)}
                    accessibilityRole="button"
                >
                    <FontAwesome name="shield" size={20} color={theme.text} style={styles.icon} />
                    <Text style={styles.rowTitle}>Privacy Policy</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.row} onPress={logOut} accessibilityRole="button">
                    <FontAwesome name="sign-out" size={20} color={theme.destructiveLabel} style={styles.icon} />
                    <Text style={[styles.rowTitle, styles.destructive]}>Log out</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                    style={styles.row}
                    onPress={deleteAccount}
                    disabled={deleting}
                    accessibilityRole="button"
                >
                    {deleting ? (
                        <ActivityIndicator color={theme.destructiveLabel} style={styles.icon} />
                    ) : (
                        <FontAwesome name="trash" size={20} color={theme.destructiveLabel} style={styles.icon} />
                    )}
                    <Text style={[styles.rowTitle, styles.destructive]}>
                        {deleting ? "Deleting…" : "Delete account"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        backgroundColor: theme.background,
        paddingBottom: 32,
    },
    group: {
        marginHorizontal: 16,
        borderRadius: 16,
        borderCurve: "continuous",
        backgroundColor: theme.card,
        overflow: "hidden",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        minHeight: 56,
    },
    icon: {
        width: 22,
        textAlign: "center",
    },
    rowText: {
        flex: 1,
        gap: 2,
    },
    rowTitle: {
        color: theme.cardText,
        fontSize: 16,
        fontWeight: "600",
    },
    rowSubtitle: {
        color: theme.cardTextMuted,
        fontSize: 13,
    },
    destructive: {
        color: theme.destructiveLabel,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.cardDividerStrong,
        marginLeft: 52,
    },
});
