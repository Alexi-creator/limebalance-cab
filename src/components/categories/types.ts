import type { CategoryStats } from "@appTypes/category"

/** Category stats + display-ready icon/color (icon — the backend emoji, empty when not set; no palette fallback). */
export interface DisplayCategory extends CategoryStats {
  icon: string
  color: string
}
