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
}

export const AuthContext = createContext<AuthData>({
  claims: undefined,
  user: undefined,
  isLoading: true,
  isInitializing: true,
  isLoggedIn: false,
  updateUser: () => {},
})

export const useAuthContext = () => useContext(AuthContext)