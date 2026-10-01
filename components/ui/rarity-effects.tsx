import { useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeConfig } from "@/components/ui/use-theme-config";
import { withAlpha } from "@/theme";
import { Rarity } from "@/types/interfaces";

/**
 * Per-tier sheen tuning: how often the light sweeps, how strong it is, and
 * what colour it carries — richer and quicker for higher tiers. The highlight
 * hues are new literals, not theme tokens: they describe a quality of light
 * ("warm white", "gold-white") rather than a semantic surface, so there's
 * nothing in the palette to reuse for them.
 */
const SHEEN_CONFIG: Record<Exclude<Rarity, "grey">, { cycleSeconds: number; alpha: number; highlight: string }> = {
  bronze: { cycleSeconds: 7, alpha: 0.16, highlight: "#FFEFD9" }, // warm white
  silver: { cycleSeconds: 5, alpha: 0.26, highlight: "#F3F7FF" }, // cool white
  gold: { cycleSeconds: 3.8, alpha: 0.38, highlight: "#FFF4C2" }, // warm gold-white
};

// The light band's width as a fraction of the parent's, before rotation.
// Kept constant across tiers so only pace and brightness vary with rarity.
const SHEEN_BAND_RATIO = 0.4;
// Rotated so the sweep reads as a diagonal glint rather than a straight wipe.
const SHEEN_ROTATION = "20deg" as const;

/**
 * A soft diagonal band of light that sweeps across the parent once per
 * cycle, then idles until it repeats — the "is this foil?" cue a flat tier
 * colour can't give on its own. Mount it inside a parent with
 * `overflow: "hidden"`, or the band will spill past its edges. Renders
 * nothing for the free `grey` tier, or when the system asks for reduced
 * motion — the tier's background hue still gets the point across on its own.
 */
export function RaritySheen({ rarity, delay = 0 }: { rarity: Rarity; delay?: number }) {
  const reducedMotion = useReducedMotion();
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  if (rarity === "grey" || reducedMotion) return null;

  const cfg = SHEEN_CONFIG[rarity];

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  // Band width/travel distance need real pixels (percentage transforms
  // aren't reliable in RN), so wait for a layout pass before animating.
  const bandWidth = size ? Math.max(24, size.width * SHEEN_BAND_RATIO) : 0;
  // Tilted, the band reaches much further sideways than its width (it is
  // twice the parent's height), so it has to start and end this far outside
  // the parent or its bright edge pops into a corner as each cycle restarts.
  const overshoot = size ? bandWidth * 1.1 + size.height * 0.25 + 8 : 0;

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={onLayout}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {size ? (
        <Animated.View
          style={{
            position: "absolute",
            top: -size.height * 0.5,
            left: 0,
            width: bandWidth,
            height: size.height * 2,
            // The sweep (0% -> ~33%) is the first third of the cycle; the
            // band then sits off-screen to the right for the remaining two
            // thirds, i.e. "idle", before the cycle repeats from the left.
            animationName: {
              "0%": { transform: [{ translateX: -overshoot }, { rotate: SHEEN_ROTATION }] },
              "33%": { transform: [{ translateX: size.width + overshoot - bandWidth }, { rotate: SHEEN_ROTATION }] },
              "100%": { transform: [{ translateX: size.width + overshoot - bandWidth }, { rotate: SHEEN_ROTATION }] },
            },
            animationDuration: `${cfg.cycleSeconds}s`,
            animationDelay: `${delay}s`,
            // Holds the off-screen first frame through the delay; without it
            // the band sits upright and visible at the left edge until then.
            animationFillMode: "backwards",
            animationIterationCount: "infinite",
            animationTimingFunction: "ease-in-out",
          }}
        >
          <LinearGradient
            colors={["transparent", withAlpha(cfg.highlight, cfg.alpha), "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

type SparklePoint = { top: `${number}%`; left: `${number}%`; size: number };

// Hand-placed rather than random, and kept out of the bottom ~30% so they
// never compete with the hero's fade into the page below.
const GOLD_SPARKLE_POINTS: SparklePoint[] = [
  { top: "10%", left: "18%", size: 13 },
  { top: "8%", left: "66%", size: 10 },
  { top: "30%", left: "46%", size: 16 },
  { top: "46%", left: "80%", size: 11 },
  { top: "60%", left: "14%", size: 12 },
];
const SILVER_SPARKLE_POINTS: SparklePoint[] = [
  { top: "14%", left: "24%", size: 11 },
  { top: "50%", left: "72%", size: 10 },
];

/** Per-tier twinkle pace and fill; the glow colour comes from the theme's own rarity tone. */
const SPARKLE_CONFIG: Record<"silver" | "gold", { fill: string; alpha: number; durationSeconds: number }> = {
  silver: { fill: "#FFFFFF", alpha: 0.5, durationSeconds: 3.2 }, // pale, infrequent
  gold: { fill: "#FFF6D8", alpha: 0.95, durationSeconds: 2.4 }, // warm, brighter
};

/**
 * A handful of twinkling points of light over a gold avatar (two, fainter,
 * over silver) — an accent, not confetti, so positions are hand-placed and
 * each twinkle is staggered so they never all fire together. Renders
 * nothing for `grey`/`bronze`, or when the system asks for reduced motion.
 */
export function RaritySparkles({ rarity }: { rarity: Rarity }) {
  const theme = useThemeConfig();
  const reducedMotion = useReducedMotion();

  if (reducedMotion || rarity === "grey" || rarity === "bronze") return null;

  const points = rarity === "gold" ? GOLD_SPARKLE_POINTS : SILVER_SPARKLE_POINTS;
  const cfg = SPARKLE_CONFIG[rarity];
  const glow = rarity === "gold" ? theme.rarityGold : theme.raritySilver;

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {points.map((p, i) => (
        <Animated.Text
          key={i}
          style={{
            position: "absolute",
            top: p.top,
            left: p.left,
            fontSize: p.size,
            color: withAlpha(cfg.fill, cfg.alpha),
            textShadowColor: glow,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: p.size * 0.6,
            animationName: {
              "0%": { opacity: 0, transform: [{ scale: 0.6 }, { rotate: "0deg" }] },
              "50%": { opacity: 1, transform: [{ scale: 1.15 }, { rotate: "18deg" }] },
              "100%": { opacity: 0, transform: [{ scale: 0.6 }, { rotate: "0deg" }] },
            },
            animationDuration: `${cfg.durationSeconds}s`,
            // Spreads the twinkles evenly across one cycle so they drift in
            // and out of sync rather than firing together.
            animationDelay: `${(i * cfg.durationSeconds) / points.length}s`,
            // Hidden through the delay, rather than shown static at full opacity.
            animationFillMode: "backwards",
            animationIterationCount: "infinite",
            animationTimingFunction: "ease-in-out",
          }}
        >
          ✦
        </Animated.Text>
      ))}
    </View>
  );
}
