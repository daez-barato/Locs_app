import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import LegalAgreement from "@/components/ui/legal-agreement";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useAuthContext } from "@/hooks/use-auth-context";
import { supabase } from "@/lib/supabase";
import { friendlyOnboardingError, usernameProblem } from "@/utils/auth-errors";

/**
 * Shown instead of the tabs once someone is signed in but hasn't accepted the
 * terms yet — OAuth signups (who never saw the register form) and older
 * accounts from before this screen existed. Guarded in app/_layout.tsx by
 * `isLoggedIn && user !== undefined && needsOnboarding`.
 */
export default function Onboarding() {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const { user, completeOnboarding } = useAuthContext();

    const [username, setUsername] = useState(user?.username ?? "");
    const [accepted, setAccepted] = useState(false);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    // The RPC generates a username for OAuth signups; it can arrive a beat
    // after this screen first mounts, so keep the field in sync until edited.
    useEffect(() => {
        if (user?.username) setUsername((prev) => prev || user.username);
    }, [user?.username]);

    const handleContinue = async () => {
        setError("");
        const trimmedUsername = username.trim();

        const badUsername = usernameProblem(trimmedUsername);
        if (badUsername) {
            setError(badUsername);
            return;
        }

        if (!accepted) {
            setError("You need to be 18 or older and agree to the Terms of Service and Privacy Policy to continue.");
            return;
        }

        setSaving(true);
        try {
            await completeOnboarding(trimmedUsername);
        } catch (error: any) {
            setError(friendlyOnboardingError(error));
        } finally {
            setSaving(false);
        }
    };

    const handleLogOut = async () => {
        setLoggingOut(true);
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setLoggingOut(false);
        }
    };

    const busy = saving || loggingOut;

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    <Text style={styles.title}>Welcome to Locs</Text>
                    <Text style={styles.subtitle}>
                        Pick a username and accept the terms to finish setting up your account.
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Username"
                        placeholderTextColor={theme.cardTextFaint}
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        editable={!busy}
                    />

                    <LegalAgreement accepted={accepted} onToggle={setAccepted} />

                    {error ? (
                        <Text style={styles.error} accessibilityLiveRegion="polite" selectable>{error}</Text>
                    ) : null}

                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton, busy && styles.buttonDisabled]}
                        onPress={handleContinue}
                        activeOpacity={0.8}
                        disabled={busy}
                        accessibilityRole="button"
                    >
                        <Text style={[styles.buttonText, styles.primaryButtonText]}>
                            {saving ? "Saving…" : "Continue"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleLogOut}
                        disabled={busy}
                        accessibilityRole="button"
                        style={styles.logOut}
                    >
                        <Text style={styles.logOutText}>{loggingOut ? "Logging out…" : "Log out"}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const createStyles = (theme: Theme) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background,
    },
    flex: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: theme.primary,
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        color: theme.cardTextSecondary,
        fontSize: 14,
        textAlign: "center",
        marginBottom: 24,
    },
    input: {
        width: "100%",
        padding: 12,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        borderRadius: 8,
        backgroundColor: theme.card,
        color: theme.cardText,
    },
    error: {
        color: theme.destructiveLabel,
        marginTop: 4,
        marginBottom: 10,
        textAlign: "center",
    },
    button: {
        paddingVertical: 14,
        borderRadius: 8,
        width: "100%",
        alignItems: "center",
        marginVertical: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    primaryButton: {
        backgroundColor: theme.primary,
    },
    primaryButtonText: {
        color: theme.onPrimary,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    logOut: {
        marginTop: 12,
        padding: 8,
    },
    logOutText: {
        color: theme.destructiveLabel,
        fontSize: 14,
        fontWeight: "600",
    },
});
