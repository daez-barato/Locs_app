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
  /** legible on destructive/success fills */
  onAccent: string;
  /** legible on `primary` (teal) fills, where white measured 2:1 */
  onPrimary: string;
  /** shadows and scrims */
  shadow: string;
  overlay: string;
  /** de-emphasised body copy */
  muted: string;

  // Second token pass: the remaining literals and `theme.x + 'NN'` alpha
  // suffixes, each kept at the exact value it rendered before.

  /** `text` at reduced alpha: secondary copy, input placeholders, faint icons */
  textSecondary: string;
  placeholder: string;
  textFaint: string;
  /** tinted fill and outline for primary-coloured chips and badges */
  primarySurface: string;
  primaryBorder: string;
  warningBorder: string;
  /** background of a card the user has a stake in */
  successSurface: string;
  successTint: string;
  successLabel: string;
  coinFace: string;
  coinRim: string;
  coinCrown: string;
  rarityGrey: string;
  rarityBronze: string;
  raritySilver: string;
  rarityGold: string;
  /** destructive copy drawn straight on `background`, where `destructive` is too dark */
  destructiveLabel: string;
  /** event lifecycle: the Lock action / LOCKED badge, the End action / ENDED badge */
  locked: string;
  lockedBadge: string;
  ended: string;
  endedBadge: string;
  /** greys for a locked bet and secondary buttons */
  neutral: string;
  neutralSurface: string;
  neutralBorder: string;
  neutralFill: string;
  /** dark scrims behind text over images, and faint dark fills */
  scrim: string;
  insetFill: string;
  subtleFill: string;
  /** light halo around the profile avatar */
  glow: string;
  /** `cardText` at reduced alpha, for copy and chrome on card-coloured surfaces */
  cardTextSecondary: string;
  cardTextMuted: string;
  cardTextFaint: string;
  cardTextDisabled: string;
  cardChip: string;
  cardDivider: string;
  cardDividerStrong: string;
  disabledFill: string;
  /** hairline around list cards */
  cardOutline: string;
}

export function useThemeConfig(): Theme {
  const colorScheme = useColorScheme();

  if (colorScheme === "dark") return darkTheme;

  return lightTheme;
}
