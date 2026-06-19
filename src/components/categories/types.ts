import type { CategoryStats } from "@appTypes/category"

/** Category stats + display-ready icon/color (emoji — from the backend or a fallback from the palette). */
export interface DisplayCategory extends CategoryStats {
  icon: string
  color: string
}
