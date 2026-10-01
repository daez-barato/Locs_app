import { supabase } from "@/lib/supabase";
import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Pings the server once per app open (deduped server-side into sessions; see
 * log_app_open in locs_server). Fire-and-forget: analytics must never block
 * or crash the UI, so this never throws and callers don't need to await it.
 */
export function logAppOpen(): void {
  try {
    supabase.rpc("log_app_open", {
      _platform: Platform.OS,
      _app_version: Constants.expoConfig?.version ?? "unknown",
    }).then(({ error }) => {
      if (error) console.error("Error logging app open:", error);
    });
  } catch (err) {
    console.error("Error logging app open:", err);
  }
}
