import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import AvatarImage from "@/components/ui/avatar-image";
import RarityBadge, { rarityColor } from "@/components/ui/rarity-badge";
import SheetHeader from "@/components/ui/sheet-header";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { getAvatarItem } from "@/services/shop";
import { AvatarInfo } from "@/types/interfaces";
import { resolveAvatarUrl } from "@/utils/avatar";

/**
 * A shop avatar at full size with its tier and story, opened from its shop
 * card. `path` is the item's image path.
 */
export default function AvatarView() {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const { width } = useWindowDimensions();
    const params = useLocalSearchParams<{ path?: string }>();
    const path = params.path || null;

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
            <SheetHeader title="Avatar" />
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
});
