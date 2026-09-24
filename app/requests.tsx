import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import SheetHeader from "@/components/ui/sheet-header";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import UserCard from "@/components/userCard";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { getRequestsList } from "@/services/users";
import { SearchUser } from "@/types/interfaces";

/**
 * Pending follow requests, presented as a sheet over the profile. Loads when it
 * opens; the old modal only fetched on close, so it always opened empty.
 */
export default function Requests() {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const { user } = useAuthContext();

    const [requests, setRequests] = useState<SearchUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!user?.username) return;
        let active = true;
        getRequestsList(user.username)
            .then((list) => {
                if (active) setRequests(list);
            })
            .catch((e) => {
                console.error("Error fetching follow requests:", e);
                if (active) setError(true);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [user?.username]);

    return (
        <View style={styles.container}>
            <SheetHeader title="Follow requests" />
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <UserCard user={item} />}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <Text style={styles.emptyText}>
                                {error ? "Couldn't load requests. Check your connection." : "No pending requests"}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    list: {
        paddingBottom: 32,
    },
    centered: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 48,
        paddingHorizontal: 32,
    },
    emptyText: {
        color: theme.textSecondary,
        fontSize: 15,
        textAlign: "center",
    },
});
