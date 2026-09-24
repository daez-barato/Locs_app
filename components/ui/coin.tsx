import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { useThemedStyles } from "@/hooks/use-themed-styles";

/**
 * The app's currency mark: a gold coin stamped with a purple crown. Gold keeps
 * it legible on every surface the app uses (purple, teal, card), where a bare
 * purple crown would vanish into the background.
 */
export function CoinIcon({ size = 16, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
    const theme = useThemeConfig();
    const rim = Math.max(1, Math.round(size / 12));

    return (
        <View
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderWidth: rim,
                    borderColor: theme.coinRim,
                    backgroundColor: theme.coinFace,
                    alignItems: "center",
                    justifyContent: "center",
                },
                style,
            ]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <FontAwesome5 name="crown" solid size={size * 0.5} color={theme.coinCrown} />
        </View>
    );
}

/**
 * A coin amount: the coin followed by the number. Screen readers hear
 * "N coins", since the icon itself is hidden from them.
 */
export function CoinAmount({
    amount,
    size = 16,
    textStyle,
    style,
    prefix,
}: {
    amount: number;
    size?: number;
    textStyle?: StyleProp<TextStyle>;
    style?: StyleProp<ViewStyle>;
    /** words before the coin, e.g. "Your bet:" */
    prefix?: string;
}) {
    const styles = useThemedStyles(createStyles);
    const label = `${prefix ? prefix + " " : ""}${amount.toLocaleString()} ${amount === 1 ? "coin" : "coins"}`;

    return (
        <View style={[styles.row, style]} accessible accessibilityLabel={label}>
            {prefix ? <Text style={[styles.text, textStyle]}>{prefix}</Text> : null}
            <CoinIcon size={size} />
            <Text style={[styles.text, textStyle]}>{amount.toLocaleString()}</Text>
        </View>
    );
}

const createStyles = (theme: Theme) => StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    text: {
        color: theme.text,
        fontVariant: ["tabular-nums"],
    },
});
