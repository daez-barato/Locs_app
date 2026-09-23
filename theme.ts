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
};

export const lightTheme: Theme = palette;
export const darkTheme: Theme = palette;
