import type { CategoryStats } from "@appTypes/category"
import { COLOR_PALETTE, EMOJI_PALETTE } from "./config"
import type { DisplayCategory } from "./types"

/**
 * Сумма категории в базовой валюте — для сортировки, долей и шкал.
 * 0, если курсы недоступны (`approxTotal === null`): сравнивать разные валюты напрямую нельзя.
 */
export function baseAmount(cat: CategoryStats): number {
  return cat.approxTotal ?? 0
}

/** Сумма приблизительная: есть операции в валюте, отличной от базовой (была конвертация). */
export function isApprox(cat: CategoryStats): boolean {
  return cat.totals.some((t) => t.currency !== cat.baseCurrency)
}

/** Достраивает статистику: emoji с бэка (иначе фолбэк из палитры) и цвет по индексу. */
export function toDisplay(stat: CategoryStats, index: number): DisplayCategory {
  return {
    ...stat,
    icon: stat.emoji || EMOJI_PALETTE[index % EMOJI_PALETTE.length],
    color: COLOR_PALETTE[index % COLOR_PALETTE.length],
  }
}
