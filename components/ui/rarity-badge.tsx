import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { Rarity } from "@/types/interfaces";

export function rarityColor(theme: Theme, rarity: Rarity): string {
    switch (rarity) {
        case "gold": return theme.rarityGold;
        case "silver": return theme.raritySilver;
        case "bronze": return theme.rarityBronze;
        default: return theme.rarityGrey;
    }
}

/** A small pill naming an avatar's tier, in the tier's colour. */
export default function RarityBadge({ rarity, style }: { rarity: Rarity; style?: StyleProp<ViewStyle> }) {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);

    return (
        <View
            style={[styles.badge, { backgroundColor: rarityColor(theme, rarity) }, style]}
            accessibilityLabel={`${rarity} rarity`}
        >
            <Text style={styles.text}>{rarity.toUpperCase()}</Text>
        </View>
    );
}

const createStyles = (theme: Theme) => StyleSheet.create({
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderCurve: "continuous",
        alignSelf: "flex-start",
    },
    text: {
        // Every tier colour is light, so dark text reads on all four.
        color: theme.onPrimary,
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 0.6,
    },
});
