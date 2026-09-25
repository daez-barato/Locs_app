import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from "react-native";
import { rarityColor } from "@/components/ui/rarity-badge";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { Rarity } from "@/types/interfaces";

const ICON: Record<Rarity, string> = {
    grey: "circle",
    bronze: "shield-alt",
    silver: "star",
    gold: "crown",
};

// Only the top tiers catch the light.
const SHIMMERS: Record<Rarity, boolean> = { grey: false, bronze: false, silver: true, gold: true };

/**
 * The profile's tier badge: larger than the shop's RarityBadge, with an icon
 * per tier and a light sweeping across silver and gold. The sweep is skipped
 * when the system asks for reduced motion.
 */
export default function TierBadge({ rarity }: { rarity: Rarity }) {
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const color = rarityColor(theme, rarity);
    const [width, setWidth] = useState(0);
    const [reduceMotion, setReduceMotion] = useState(false);
    const sweep = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    }, []);

    const shimmers = SHIMMERS[rarity] && !reduceMotion && width > 0;

    useEffect(() => {
        if (!shimmers) return;
        sweep.setValue(0);
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(sweep, {
                    toValue: 1,
                    duration: rarity === "gold" ? 1400 : 1800,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.delay(rarity === "gold" ? 1200 : 2200),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [shimmers, rarity, sweep]);

    return (
        <View
            style={[styles.badge, { backgroundColor: color, boxShadow: `0 0 12px ${color}99` }]}
            onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
            accessibilityLabel={`${rarity} tier`}
        >
            <FontAwesome5 name={ICON[rarity]} size={11} color={theme.onPrimary} solid />
            <Text style={styles.text}>{rarity.toUpperCase()}</Text>
            {shimmers && (
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.sweep,
                        {
                            transform: [
                                {
                                    translateX: sweep.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-40, width + 40],
                                    }),
                                },
                                { skewX: "-20deg" },
                            ],
                        },
                    ]}
                >
                    <LinearGradient
                        colors={["transparent", "rgba(255,255,255,0.75)", "transparent"]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
            )}
        </View>
    );
}

const createStyles = (theme: Theme) => StyleSheet.create({
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderCurve: "continuous",
        overflow: "hidden",
    },
    text: {
        // Every tier colour is light, so dark text reads on all four.
        color: theme.onPrimary,
        fontSize: 12,
        fontWeight: "900",
        letterSpacing: 0.8,
    },
    sweep: {
        position: "absolute",
        top: -4,
        bottom: -4,
        left: 0,
        width: 28,
    },
});
