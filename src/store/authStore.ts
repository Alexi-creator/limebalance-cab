import type { User } from "@appTypes/user"
import { create } from "zustand"

interface AuthState {
  user: User | null
  isInitialized: boolean
  setUser: (user: User | null) => void
  setInitialized: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isInitialized: false,
  setUser: (user) => set({ user }),
  setInitialized: () => set({ isInitialized: true }),
}))
