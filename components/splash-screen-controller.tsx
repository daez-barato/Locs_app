import { useAuthContext } from '@/hooks/use-auth-context'
import { SplashScreen } from 'expo-router'
import { useEffect } from 'react'

SplashScreen.preventAutoHideAsync()

export function SplashScreenController() {
  const { isInitializing } = useAuthContext()

  // This used to be rendered only while loading, so the hide branch could never
  // run, and it hid during render rather than as an effect. It's now mounted for
  // the whole session and hides once auth has settled — keeping the native
  // splash up until then is what stops any pre-auth screen showing through.
  useEffect(() => {
    if (!isInitializing) {
      SplashScreen.hideAsync().catch(() => {
        // Already hidden, or the module isn't available — nothing to recover.
      })
    }
  }, [isInitializing])

  return null
}
