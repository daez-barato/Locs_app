import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { fetchEventBets } from "@/api/eventFunctions";
import AvatarImage from "@/components/ui/avatar-image";
import { CoinAmount } from "@/components/ui/coin";
import SheetHeader from "@/components/ui/sheet-header";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { resolveAvatarUrl } from "@/utils/avatar";
import { Bettor, groupBettors } from "@/utils/bettors";

/** Everyone with a stake on an event and what they picked, as a sheet over the event. */
export default function Bettors() {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const router = useRouter();
    const { eventId } = useLocalSearchParams<{ eventId: string }>();
    const myId = useAuthContext().user?.id;

    const [bettors, setBettors] = useState<Bettor[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(false);

    const load = useCallback(async () => {
        if (!eventId) return;
        const bets = await fetchEventBets(eventId);
        if (Array.isArray(bets)) {
            setBettors(groupBettors(bets));
            setError(false);
        } else {
            setError(true);
        }
        setLoading(false);
        setRefreshing(false);
    }, [eventId]);

    useEffect(() => {
        load();
    }, [load]);

    const totalStaked = bettors.reduce((sum, b) => sum + b.staked, 0);
    const title = bettors.length > 0
        ? `${bettors.length} ${bettors.length === 1 ? "bettor" : "bettors"}`
        : "Bettors";

    const renderBettor = ({ item }: { item: Bettor }) => {
        const isMe = item.userId === myId;
        return (
            <TouchableOpacity
                style={[styles.row, isMe && styles.myRow]}
                // navigate (not push) closes this sheet on the way to the profile.
                onPress={() => router.navigate({ pathname: "/user/[username]", params: { username: item.username } })}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${item.username}, staked ${item.staked} coins. Open profile.`}
            >
                <AvatarImage uri={resolveAvatarUrl(item.avatarUrl)} style={styles.avatar} contentFit="cover" />
                <View style={styles.rowBody}>
                    <View style={styles.rowHeader}>
                        <Text style={styles.username} numberOfLines={1}>
                            {item.username}
                        </Text>
                        {isMe && <Text style={styles.meTag}>You</Text>}
                        <CoinAmount amount={item.staked} size={14} textStyle={styles.staked} style={styles.stakedAmount} />
                    </View>

                    {item.picks.map((pick) => (
                        <View key={pick.question} style={styles.pick}>
                            <Text style={styles.pickQuestion} numberOfLines={1}>{pick.question}</Text>
                            <Text style={styles.pickOption} numberOfLines={1}>
                                {pick.option} · {pick.amount}
                            </Text>
                        </View>
                    ))}

                    {item.won !== null && (
                        <Text style={[styles.result, item.won > 0 ? styles.won : styles.lost]}>
                            {item.won > 0 ? `Won ${item.won.toLocaleString()} coins` : "No winnings"}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <SheetHeader title={title} />
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={bettors}
                    keyExtractor={(item) => item.userId}
                    renderItem={renderBettor}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                load();
                            }}
                            colors={[theme.primary]}
                        />
                    }
                    ListHeaderComponent={
                        bettors.length > 0 ? (
                            <CoinAmount
                                prefix="Total staked"
                                amount={totalStaked}
                                size={14}
                                textStyle={styles.summary}
                                style={styles.summaryRow}
                            />
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <Text style={styles.emptyText} selectable={error}>
                                {error
                                    ? "Couldn't load the bettors. Check your connection and pull to refresh."
                                    : "No one has bet on this event yet."}
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
        paddingHorizontal: 16,
        paddingBottom: 32,
        gap: 10,
    },
    summaryRow: {
        alignSelf: "center",
        marginBottom: 6,
    },
    summary: {
        color: theme.textSecondary,
        fontSize: 14,
        fontWeight: "600",
    },
    row: {
        flexDirection: "row",
        gap: 12,
        padding: 14,
        borderRadius: 16,
        borderCurve: "continuous",
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.cardOutline,
    },
    // Your own row, so you can find yourself in a long list.
    myRow: {
        borderColor: theme.primary,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: theme.primary,
        backgroundColor: theme.cardBorder,
    },
    rowBody: {
        flex: 1,
        gap: 6,
    },
    rowHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    username: {
        flexShrink: 1,
        color: theme.cardText,
        fontSize: 16,
        fontWeight: "700",
    },
    meTag: {
        color: theme.onPrimary,
        backgroundColor: theme.primary,
        fontSize: 11,
        fontWeight: "800",
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 6,
        overflow: "hidden",
    },
    stakedAmount: {
        marginLeft: "auto",
    },
    staked: {
        fontVariant: ["tabular-nums"],
        color: theme.cardText,
        fontSize: 15,
        fontWeight: "700",
    },
    pick: {
        flexDirection: "row",
        gap: 8,
    },
    pickQuestion: {
        flex: 1,
        color: theme.cardTextSecondary,
        fontSize: 13,
    },
    pickOption: {
        maxWidth: "50%",
        color: theme.cardText,
        fontSize: 13,
        fontWeight: "600",
        fontVariant: ["tabular-nums"],
    },
    result: {
        fontSize: 13,
        fontWeight: "700",
    },
    won: {
        color: theme.successLabel,
    },
    lost: {
        color: theme.cardTextFaint,
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
