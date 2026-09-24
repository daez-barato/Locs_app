import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import SheetHeader from "@/components/ui/sheet-header";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import UserCard from "@/components/userCard";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { getFollowersList, getFollowingList } from "@/services/users";
import { SearchUser } from "@/types/interfaces";

type Kind = "followers" | "following";

/** A user's followers or following, presented as a sheet over the profile. */
export default function Connections() {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const params = useLocalSearchParams<{ username: string; kind: Kind }>();
    const kind: Kind = params.kind === "following" ? "following" : "followers";
    const title = kind === "followers" ? "Followers" : "Following";

    const [users, setUsers] = useState<SearchUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(false);
    const offset = useRef(0);
    const hasMore = useRef(true);

    const load = useCallback(async () => {
        if (!params.username || !hasMore.current) return;
        try {
            const page = kind === "followers"
                ? await getFollowersList(params.username, offset.current)
                : await getFollowingList(params.username, offset.current);
            offset.current += page.length;
            hasMore.current = page.length > 0;
            setUsers((prev) => Array.from(new Map([...prev, ...page].map((u) => [u.id, u])).values()));
            setError(false);
        } catch (e) {
            console.error(`Error fetching ${kind}:`, e);
            setError(true);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [kind, params.username]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <View style={styles.container}>
            <SheetHeader title={title} />
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <UserCard user={item} />}
                    contentContainerStyle={styles.list}
                    onEndReached={() => {
                        if (!loadingMore && hasMore.current) {
                            setLoadingMore(true);
                            load();
                        }
                    }}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={loadingMore ? <ActivityIndicator color={theme.primary} /> : null}
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <Text style={styles.emptyText} selectable={error}>
                                {error
                                    ? `Couldn't load ${title.toLowerCase()}. Check your connection.`
                                    : kind === "followers" ? "No followers yet" : "Not following anyone yet"}
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
