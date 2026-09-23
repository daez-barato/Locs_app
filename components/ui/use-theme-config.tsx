import { useColorScheme } from "react-native";
import { darkTheme, lightTheme } from "../../theme";

export interface Theme {
  background: string;
  text: string;
  primary: string;
  darker_primary: string;
  button: string;
  buttonText: string;
  secondary: string;
  void: string;
  button_darker_primary: string;
  destructive: string;
  destructiveText: string;
  cardBackground: string;
  cardBorder: string;
  card: string;
  border: string;
  cardText: string;

  // Semantic tokens. These existed only as literals scattered through the
  // screens (#10B981 for a win, #F59E0B for a pending state, #ffffff on a
  // coloured button), which is why the same idea rendered in slightly different
  // shades depending on the file.
  success: string;
  successText: string;
  warning: string;
  warningSurface: string;
  warningText: string;
  /** legible on primary/destructive/success fills */
  onAccent: string;
  /** shadows and scrims */
  shadow: string;
  overlay: string;
  /** de-emphasised body copy */
  muted: string;
}

export function useThemeConfig(): Theme {
  const colorScheme = useColorScheme();

  if (colorScheme === "dark") return darkTheme;

  return lightTheme;
}
