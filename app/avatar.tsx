import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import AvatarImage from "@/components/ui/avatar-image";
import { CoinAmount, CoinIcon } from "@/components/ui/coin";
import RarityBadge, { rarityColor } from "@/components/ui/rarity-badge";
import SheetHeader from "@/components/ui/sheet-header";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useCoinContext } from "@/hooks/use-coin-context";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { equipItem, getShopItems, purchaseItem } from "@/services/shop";
import { ShopItem } from "@/types/interfaces";
import { haptics } from "@/utils/haptics";

/**
 * A shop avatar at full size with its tier and story, and the only place to
 * buy or equip it: the shop cards open this rather than selling directly, so
 * you see who you're buying first. `path` is the item's image path.
 */
export default function AvatarView() {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const { width } = useWindowDimensions();
    const { coins, setCoinAmount } = useCoinContext();
    const { updateUser } = useAuthContext();
    const params = useLocalSearchParams<{ path?: string }>();

    const [item, setItem] = useState<ShopItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    // State updates are async; the ref stops a fast double tap buying twice.
    const busyRef = useRef(false);

    useEffect(() => {
        let active = true;
        // The shop list carries ownership and equipped state for the caller.
        getShopItems().then((result) => {
            if (!active) return;
            if (result.error) setLoadError(result.msg);
            else setItem(result.items.find((i) => i.imagePath === params.path) ?? null);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [params.path]);

    const run = async (action: () => Promise<void>) => {
        if (busyRef.current) return;
        busyRef.current = true;
        setBusy(true);
        try {
            await action();
        } finally {
            busyRef.current = false;
            setBusy(false);
        }
    };

    const equip = () =>
        run(async () => {
            if (!item) return;
            const result = await equipItem(item.id);
            if (result.error) {
                Alert.alert("Couldn't equip", result.msg);
                return;
            }
            setItem({ ...item, equipped: true });
            updateUser({ avatar_url: result.avatarPath });
            haptics.tap();
        });

    const buy = () => {
        if (!item || busyRef.current) return;
        Alert.alert("Confirm purchase", `Buy ${item.name} for ${item.price} coins?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Buy",
                onPress: () =>
                    run(async () => {
                        const result = await purchaseItem(item.id);
                        if (result.error) {
                            Alert.alert("Purchase failed", result.msg);
                            return;
                        }
                        setCoinAmount(result.coins);
                        // The button turns into Equip, so no follow-up prompt.
                        setItem({ ...item, owned: true });
                        haptics.success();
                    }),
            },
        ]);
    };

    const renderAction = () => {
        if (!item) return null;

        if (item.equipped) {
            return (
                <View style={[styles.action, styles.actionMuted]}>
                    <FontAwesome name="check" size={14} color={theme.cardTextSecondary} />
                    <Text style={styles.actionMutedText}>Equipped</Text>
                </View>
            );
        }

        if (item.owned) {
            return (
                <TouchableOpacity
                    style={[styles.action, styles.actionPrimary]}
                    onPress={equip}
                    disabled={busy}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Equip ${item.name}`}
                >
                    {busy ? (
                        <ActivityIndicator color={theme.onPrimary} />
                    ) : (
                        <Text style={styles.actionPrimaryText}>Equip</Text>
                    )}
                </TouchableOpacity>
            );
        }

        if (item.price > coins) {
            return (
                <View style={[styles.action, styles.actionMuted]}>
                    <CoinAmount prefix="Need" amount={item.price - coins} size={16} textStyle={styles.actionMutedText} />
                    <Text style={styles.actionMutedText}>more</Text>
                </View>
            );
        }

        return (
            <TouchableOpacity
                style={[styles.action, styles.actionPrimary]}
                onPress={buy}
                disabled={busy}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Buy ${item.name} for ${item.price} coins`}
            >
                {busy ? (
                    <ActivityIndicator color={theme.onPrimary} />
                ) : (
                    <>
                        <Text style={styles.actionPrimaryText}>Buy for</Text>
                        <CoinIcon size={18} />
                        <Text style={styles.actionPrimaryText}>{item.price.toLocaleString()}</Text>
                    </>
                )}
            </TouchableOpacity>
        );
    };

    const size = Math.min(width - 40, 420);
    const frame = item ? rarityColor(theme, item.rarity) : theme.cardBorder;

    return (
        <View style={styles.container}>
            <SheetHeader title="Avatar" />
            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.frame, { width: size, height: size, borderColor: frame }]}>
                    <AvatarImage uri={item?.imageUrl ?? ""} style={styles.image} contentFit="cover" />
                </View>

                {loading ? (
                    <ActivityIndicator color={theme.primary} style={styles.loading} />
                ) : item ? (
                    <>
                        <View style={styles.info}>
                            <View style={styles.titleRow}>
                                <Text style={styles.name}>{item.name}</Text>
                                <RarityBadge rarity={item.rarity} />
                            </View>
                            <Text style={styles.description} selectable>{item.description}</Text>
                        </View>
                        {renderAction()}
                    </>
                ) : (
                    <Text style={styles.description}>
                        {loadError ?? "This avatar is no longer in the shop."}
                    </Text>
                )}
            </ScrollView>
        </View>
    );
}

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    content: {
        alignItems: "center",
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 20,
    },
    frame: {
        borderRadius: 28,
        borderCurve: "continuous",
        borderWidth: 3,
        overflow: "hidden",
        backgroundColor: theme.card,
    },
    image: {
        width: "100%",
        height: "100%",
    },
    loading: {
        marginTop: 8,
    },
    info: {
        alignSelf: "stretch",
        gap: 10,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    name: {
        flexShrink: 1,
        color: theme.text,
        fontSize: 24,
        fontWeight: "700",
    },
    description: {
        color: theme.textSecondary,
        fontSize: 16,
        lineHeight: 23,
    },
    action: {
        alignSelf: "stretch",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 52,
        borderRadius: 14,
        borderCurve: "continuous",
    },
    actionPrimary: {
        backgroundColor: theme.primary,
    },
    actionPrimaryText: {
        color: theme.onPrimary,
        fontSize: 17,
        fontWeight: "700",
        fontVariant: ["tabular-nums"],
    },
    actionMuted: {
        borderWidth: 1,
        borderColor: theme.cardDividerStrong,
    },
    actionMutedText: {
        color: theme.cardTextSecondary,
        fontSize: 16,
        fontWeight: "600",
    },
});
