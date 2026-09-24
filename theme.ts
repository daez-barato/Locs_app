import { Theme } from "./components/ui/use-theme-config";

// Locs is a single deep-purple palette rather than a light/dark pair. Both
// exports are kept so useThemeConfig keeps working and a real light variant can
// be introduced later without touching call sites — but note that today the app
// looks the same whichever appearance the device is set to.
const palette: Theme = {
  background: "#772497ff",
  // Body copy. A touch lighter than `primary` so it clears 4.5:1 on the
  // purple background (#33CCA3 measured 4.15).
  text: "#5AD6B4",
  primary: "#33CCA3",
  darker_primary: "#33cca3e5",
  button: "#A333CC",
  buttonText: "#ffffff",
  secondary: "#B45E39",
  void: "#1c131f",
  button_darker_primary: "#641e7d",
  destructive: "#ac3239",
  destructiveText: "#ffffff",
  cardBackground: "#713583ff",
  cardBorder: "#52276bff",
  card: "#641e7d",
  cardText: "#ffffff",
  border: "#33CCA3",

  success: "#10B981",
  successText: "#059669",
  warning: "#F59E0B",
  warningSurface: "#FEF3C7",
  warningText: "#92400E",
  onAccent: "#ffffff",
  onPrimary: "#1C131F",
  shadow: "#000000",
  overlay: "rgba(0, 0, 0, 0.6)",
  muted: "#D9C9E2",

  // Teal at partial alpha blended into the purple (1.3 to 1.8:1), so these are
  // light tints instead: secondary copy at 5.4:1, placeholders and faint
  // icons at the 3:1 floor for non-body content.
  textSecondary: "#D9C9E2",
  placeholder: "#FFFFFF80",
  textFaint: "#FFFFFF80",
  primarySurface: "#33CCA315",
  primaryBorder: "#33CCA330",
  warningBorder: "#F59E0B30",
  successSurface: "#F0FDF4",
  successTint: "#10B98120",
  /** green copy on the purple card (6.8:1); successText is for light surfaces */
  successLabel: "#6EE7B7",
  /** the currency mark: gold coin, darker rim, purple crown */
  coinFace: "#F4C430",
  coinRim: "#B8860B",
  coinCrown: "#5B1A7A",
  // Material's error tone for dark surfaces: 5:1 on the purple, where #FF3B30
  // managed 2.4 and `destructive` itself 1.3.
  destructiveLabel: "#FFB4AB",
  locked: "#FF6B35",
  lockedBadge: "rgba(255, 107, 53, 0.9)",
  ended: "#DC2626",
  endedBadge: "rgba(220, 38, 38, 0.9)",
  neutral: "#6B7280",
  neutralSurface: "#F3F4F6",
  neutralBorder: "#D1D5DB",
  neutralFill: "#666666",
  scrim: "rgba(0, 0, 0, 0.7)",
  insetFill: "rgba(0, 0, 0, 0.2)",
  subtleFill: "rgba(0, 0, 0, 0.05)",
  glow: "#ffffff",
  cardTextSecondary: "rgba(255, 255, 255, 0.8)",
  cardTextMuted: "rgba(255, 255, 255, 0.7)",
  cardTextFaint: "rgba(255, 255, 255, 0.5)",
  cardTextDisabled: "rgba(255, 255, 255, 0.3)",
  cardChip: "rgba(255, 255, 255, 0.1)",
  cardDivider: "rgba(255, 255, 255, 0.1)",
  cardDividerStrong: "rgba(255, 255, 255, 0.2)",
  disabledFill: "rgba(255, 255, 255, 0.3)",
  // cardBorder is 8-digit hex, so the old `cardBorder + "40"` produced an
  // invalid 10-digit colour; this is the value it was reaching for.
  cardOutline: "#52276b40",
};

export const lightTheme: Theme = palette;
export const darkTheme: Theme = palette;

/** `#RRGGBB` (or `#RRGGBBAA`, whose alpha is replaced) at the given opacity, for boxShadow strings. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
