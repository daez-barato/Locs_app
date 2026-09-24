import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import AvatarImage from "@/components/ui/avatar-image";
import RarityBadge, { rarityColor } from "@/components/ui/rarity-badge";
import SheetHeader from "@/components/ui/sheet-header";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { getAvatarItem } from "@/services/shop";
import { AvatarInfo } from "@/types/interfaces";
import { resolveAvatarUrl } from "@/utils/avatar";

/**
 * An avatar at full size with its tier and story, opened from a profile (or
 * the shop). `path` is the stored image path (empty for the default); `owner`
 * adds a way to change it.
 */
export default function AvatarView() {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const router = useRouter();
    const { width } = useWindowDimensions();
    const params = useLocalSearchParams<{ path?: string; username?: string; owner?: string }>();
    const path = params.path || null;
    const isOwner = params.owner === "1";

    const [item, setItem] = useState<AvatarInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        getAvatarItem(path).then((result) => {
            if (!active) return;
            if (!result.error) setItem(result.item);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [path]);

    const size = Math.min(width - 40, 420);
    const frame = item ? rarityColor(theme, item.rarity) : theme.cardBorder;

    return (
        <View style={styles.container}>
            <SheetHeader title={params.username ? `${params.username}'s avatar` : "Avatar"} />
            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.frame, { width: size, height: size, borderColor: frame }]}>
                    <AvatarImage uri={resolveAvatarUrl(path)} style={styles.image} contentFit="cover" />
                </View>

                {loading ? (
                    <ActivityIndicator color={theme.primary} style={styles.loading} />
                ) : item ? (
                    <View style={styles.info}>
                        <View style={styles.titleRow}>
                            <Text style={styles.name}>{item.name}</Text>
                            <RarityBadge rarity={item.rarity} />
                        </View>
                        <Text style={styles.description} selectable>{item.description}</Text>
                        {!item.active && (
                            <Text style={styles.retired}>Retired: no longer sold in the shop.</Text>
                        )}
                    </View>
                ) : null}

                {isOwner && (
                    <TouchableOpacity
                        style={styles.shopButton}
                        onPress={() => router.navigate("/shop")}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                    >
                        <FontAwesome name="shopping-bag" size={16} color={theme.onPrimary} />
                        <Text style={styles.shopButtonText}>Change avatar in the shop</Text>
                    </TouchableOpacity>
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
    retired: {
        color: theme.cardTextMuted,
        fontSize: 13,
        fontStyle: "italic",
    },
    shopButton: {
        alignSelf: "stretch",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        borderCurve: "continuous",
        backgroundColor: theme.primary,
    },
    shopButtonText: {
        color: theme.onPrimary,
        fontSize: 16,
        fontWeight: "700",
    },
});
