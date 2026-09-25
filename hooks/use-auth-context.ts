import { createContext, useContext } from 'react'
import { User } from '@/types/interfaces'

export type AuthData = {
  claims?: Record<string, any> | null
  user?: User | undefined
  isLoading: boolean
  /** True only until the first auth resolution completes, for gating first paint. */
  isInitializing: boolean
  isLoggedIn: boolean
  /** Patch the signed-in user in place, e.g. avatar_url after equipping an avatar. */
  updateUser: (patch: Partial<User>) => void
  /** True once signed in until the account accepts the terms — gates the onboarding screen. */
  needsOnboarding: boolean
  /** Validates/renames the username, records terms acceptance, and flips needsOnboarding false. Throws on failure (e.g. "username taken"). */
  completeOnboarding: (username: string) => Promise<string>
}

export const AuthContext = createContext<AuthData>({
  claims: undefined,
  user: undefined,
  isLoading: true,
  isInitializing: true,
  isLoggedIn: false,
  updateUser: () => {},
  needsOnboarding: false,
  completeOnboarding: async () => {
    throw new Error('completeOnboarding called outside AuthProvider')
  },
})

export const useAuthContext = () => useContext(AuthContext)