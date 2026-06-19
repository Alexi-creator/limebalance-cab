import { create } from "zustand"

interface SidebarState {
  /** Whether the mobile menu is open (on desktop the sidebar is always visible). */
  opened: boolean
  toggle: () => void
  open: () => void
  close: () => void
}

/**
 * Dashboard mobile sidebar state.
 * Extracted from the layout so toggling the menu re-renders only the subscribers
 * (the burger, the AppShell wrapper), not the whole tree with the current page.
 */
export const useSidebarStore = create<SidebarState>((set) => ({
  opened: false,
  toggle: () => set((s) => ({ opened: !s.opened })),
  open: () => set({ opened: true }),
  close: () => set({ opened: false }),
}))
