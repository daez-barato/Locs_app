import { Theme } from "./components/ui/use-theme-config";

// Locs is a single deep-purple palette rather than a light/dark pair. Both
// exports are kept so useThemeConfig keeps working and a real light variant can
// be introduced later without touching call sites — but note that today the app
// looks the same whichever appearance the device is set to.
const palette: Theme = {
  background: "#772497ff",
  text: "#33CCA3",
  primary: "#33CCA3",
  darker_primary: "#33cca3e5",
  button: "#A333CC",
  buttonText: "#ffffff",
  secondary: "#C2653D",
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
  shadow: "#000000",
  overlay: "rgba(0, 0, 0, 0.6)",
  muted: "#D9C9E2",

  textSecondary: "#33CCA380",
  placeholder: "#33CCA360",
  textFaint: "#33CCA340",
  primarySurface: "#33CCA315",
  primaryBorder: "#33CCA330",
  warningBorder: "#F59E0B30",
  successSurface: "#F0FDF4",
  successTint: "#10B98120",
  destructiveLabel: "#FF3B30",
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
