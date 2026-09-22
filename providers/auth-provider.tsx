import { AuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/lib/supabase'
import { User } from '@/types/interfaces'
import { PropsWithChildren, useEffect, useState } from 'react'

export default function AuthProvider({ children }: PropsWithChildren) {
  const [claims, setClaims] = useState<Record<string, any> | undefined | null>()
  const [user, setUser] = useState<User>()
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Fetch the claims once, and subscribe to auth state changes
  useEffect(() => {
    const fetchClaims = async () => {
      setIsLoading(true)

      const { data, error } = await supabase.auth.getClaims()

      if (error) {
        console.error('Error fetching claims:', error)
      }

      setClaims(data?.claims ?? null)
      setIsLoading(false)
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
      setIsLoading(true)
      try {
        if (claims) {
          const { data, error } = await supabase.rpc('get_my_profile')
          if (error || data.length === 0) {
            throw error
          }

          const userProfile = User(data[0])

          setUser(userProfile)

        } else {
          setUser(undefined)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        supabase.auth.signOut()
      }
      
      setIsLoading(false)
    }

    fetchProfile()
  }, [claims])

  return (
    <AuthContext.Provider
      value={{
        claims,
        isLoading,
        user,
        isLoggedIn: claims != undefined,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}