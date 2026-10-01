import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { logAppOpen } from "@/services/analytics";

/**
 * Logs an app-open ping once the signed-in app is ready, and again whenever
 * it returns to the foreground - never while signed out, onboarding, or
 * still loading, so a logged-out splash screen isn't counted as a session.
 * The server dedupes pings from the same user within 30 minutes, so a quick
 * background/foreground flicker doesn't inflate session counts.
 */
export function useAppOpenLogging(ready: boolean) {
  // Mirrors ready inside the AppState listener, which is created once and
  // would otherwise close over a stale value.
  const readyRef = useRef(ready);

  useEffect(() => {
    readyRef.current = ready;
    if (ready) logAppOpen();
  }, [ready]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && readyRef.current) logAppOpen();
    });
    return () => sub.remove();
  }, []);
}
