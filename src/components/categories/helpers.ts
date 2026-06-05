import type { CategoryStats } from "@appTypes/category"
import { COLOR_PALETTE, EMOJI_PALETTE } from "./config"
import type { DisplayCategory } from "./types"

/** Русская форма множественного числа по числу: `forms = [одна, две, пять]`. */
export function pluralRu(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}

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
