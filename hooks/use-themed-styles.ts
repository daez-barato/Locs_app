import { useMemo } from "react";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";

/**
 * Builds a screen's stylesheet once per theme instead of once per usage.
 *
 * The previous pattern called `styles(theme)` inline at every style reference,
 * so each one rebuilt the file's entire StyleSheet — the event screen did that
 * 141 times per render, on every keystroke in the bet input included.
 *
 *   const styles = useThemedStyles(createStyles);
 *   <View style={styles.container} />
 */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useThemeConfig();
  return useMemo(() => factory(theme), [factory, theme]);
}
