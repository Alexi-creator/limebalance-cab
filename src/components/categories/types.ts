import type { CategoryStats } from "@appTypes/category"

/** Статистика категории + готовые к показу icon/color (emoji — с бэка либо фолбэк из палитры). */
export interface DisplayCategory extends CategoryStats {
  icon: string
  color: string
}
