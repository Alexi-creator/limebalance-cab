import { create } from "zustand"

interface SidebarState {
  /** Открыто ли мобильное меню (на десктопе сайдбар виден всегда). */
  opened: boolean
  toggle: () => void
  open: () => void
  close: () => void
}

/**
 * Состояние мобильного сайдбара дашборда.
 * Вынесено из layout, чтобы переключение меню перерисовывало только подписчиков
 * (бургер, обёртка AppShell), а не всё дерево с текущей страницей.
 */
export const useSidebarStore = create<SidebarState>((set) => ({
  opened: false,
  toggle: () => set((s) => ({ opened: !s.opened })),
  open: () => set({ opened: true }),
  close: () => set({ opened: false }),
}))
