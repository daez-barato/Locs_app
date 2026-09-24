import * as Haptics from "expo-haptics";

// Fire-and-forget: haptics are a nicety, so a device without a motor (or web)
// must never surface an error to the caller.
const quiet = (p: Promise<void>) => p.catch(() => {});

export const haptics = {
  /** a committed action succeeded: bet placed, item bought, event locked */
  success: () => quiet(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** a light acknowledgement: follow, equip, a primary button */
  tap: () => quiet(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** a selection changed: tab switch, toggle */
  select: () => quiet(Haptics.selectionAsync()),
};
