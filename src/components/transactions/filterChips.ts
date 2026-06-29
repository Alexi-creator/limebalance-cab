import type { Category } from "@appTypes/category"
import type { TFunction } from "i18next"
import type { ChipGroup } from "./ActiveFilterChips"
import type { TransactionsParams } from "./config"

interface Args {
  params: TransactionsParams
  /** Union of income and expense categories — to resolve selected ids into names/emoji. */
  categories: Category[]
  t: TFunction
  setParams: (updates: Partial<TransactionsParams>) => void
}

/**
 * Build the removable-chip groups for the active multi-select filters. Shared by the table
 * (chips above the rows) and the mobile filter drawer so both stay in sync.
 */
export function buildFilterChipGroups({ params, categories, t, setParams }: Args): ChipGroup[] {
  return [
    {
      label: t("common.category"),
      items: params.categoryId
        .map((id) => categories.find((c) => c.id === id))
        .filter((c): c is Category => c != null)
        .map((c) => ({ value: c.id, label: c.emoji ? `${c.emoji} ${c.name}` : c.name })),
      onRemove: (id) =>
        setParams({ categoryId: params.categoryId.filter((v) => v !== id), page: 1 }),
    },
    {
      label: t("common.currency"),
      items: params.currency.map((c) => ({ value: c, label: c })),
      onRemove: (code) =>
        setParams({ currency: params.currency.filter((v) => v !== code), page: 1 }),
    },
  ]
}
