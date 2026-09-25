import { AuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/lib/supabase'
import { User } from '@/types/interfaces'
import { PropsWithChildren, useCallback, useEffect, useState } from 'react'

/**
 * Whether the signed-in account still has to accept the terms (OAuth signups
 * and accounts from before they existed). A failed check is not a reason to
 * trap anyone on the onboarding screen, so it counts as "already onboarded".
 */
async function fetchNeedsOnboarding(): Promise<boolean> {
  const { data, error } = await supabase.rpc('needs_onboarding')
  if (error) {
    console.error('Error checking onboarding status:', error)
    return false
  }
  return !!data
}

export default function AuthProvider({ children }: PropsWithChildren) {
  const [claims, setClaims] = useState<Record<string, any> | undefined | null>()
  const [user, setUser] = useState<User>()
  const [claimsLoading, setClaimsLoading] = useState<boolean>(true)
  const [profileFailed, setProfileFailed] = useState<boolean>(false)
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(false)

  // Fetch the claims once, and subscribe to auth state changes
  useEffect(() => {
    const fetchClaims = async () => {
      const { data, error } = await supabase.auth.getClaims()

      if (error) {
        console.error('Error fetching claims:', error)
      }

      setClaims(data?.claims ?? null)
      setClaimsLoading(false)
    }

    fetchClaims()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, _session) => {
      console.log('Auth state changed:', { event: _event })
      const { data } = await supabase.auth.getClaims()
      setClaims(data?.claims ?? null)
    })

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Fetch the profile when the claims change
  useEffect(() => {
    const fetchProfile = async () => {
      if (claims === undefined) return

      try {
        if (claims) {
          setProfileFailed(false)
          const { data, error } = await supabase.rpc('get_my_profile')

          if (error) {
            // A failed request (offline, server hiccup) is not a reason to sign
            // someone out — that used to drop users on any flaky connection.
            console.error('Error fetching profile:', error)
            setProfileFailed(true)
            return
          }

          if (!data || data.length === 0) {
            // Authenticated but no profile row: the session can't be used.
            console.error('No profile found for the current session, signing out')
            await supabase.auth.signOut()
            return
          }

          // Read alongside the profile and set in the same update: resolving
          // the user first let the tabs guard pass for a frame on a stale
          // "no onboarding needed" before the onboarding screen took over.
          setNeedsOnboarding(await fetchNeedsOnboarding())
          setUser(User(data[0]))
        } else {
          setNeedsOnboarding(false)
          setUser(undefined)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        setProfileFailed(true)
      }
    }

    fetchProfile()
  }, [claims])

  const completeOnboarding = useCallback(async (username: string) => {
    const { data, error } = await supabase.rpc('complete_onboarding', { _username: username })
    if (error) throw error
    setUser((prev) => (prev ? { ...prev, username: data } : prev))
    setNeedsOnboarding(false)
    return data
  }, [])

  // A restored session resolves in two steps: claims first, profile a moment
  // later. Reporting "not loading" in between rendered one frame with a valid
  // session but no user, which the route guard reads as logged out — that's the
  // login screen flashing over a stored session. Stay loading until the profile
  // has resolved, or failed outright so this can't hang on the splash screen.
  const isLoading =
    claimsLoading || (claims != null && user === undefined && !profileFailed)

  // Only the first resolution should block rendering. Later transitions (signing
  // in, a token refresh) must not blank the screen — the guards handle those.
  const [initialized, setInitialized] = useState<boolean>(false)

  useEffect(() => {
    if (!isLoading && !initialized) {
      setInitialized(true)
    }
  }, [isLoading, initialized])

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  return (
    <AuthContext.Provider
      value={{
        claims,
        isLoading,
        isInitializing: !initialized,
        user,
        isLoggedIn: claims != undefined,
        updateUser,
        needsOnboarding,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
