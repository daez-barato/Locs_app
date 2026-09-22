import { createContext, useContext } from 'react'
import { User } from '@/types/interfaces'

export type AuthData = {
  claims?: Record<string, any> | null
  user?: User | undefined
  isLoading: boolean
  isLoggedIn: boolean
}

export const AuthContext = createContext<AuthData>({
  claims: undefined,
  user: undefined,
  isLoading: true,
  isLoggedIn: false,
})

export const useAuthContext = () => useContext(AuthContext)