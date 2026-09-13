import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { CURRENCY_OPTIONS } from "@/shared/config/regionToCurrency"
import { currencyName } from "@/shared/lib/currencyName"

export interface CurrencyOption {
  value: string
  /** Short form for the closed control: the code with its symbol where there is one (`USD $`, `AED`). */
  label: string
  /** The spelled-out name, shown in the dropdown and searchable — see CurrencySelect. */
  description: string
}

/**
 * The currency list for pickers, named in the current interface language. Recomputed only when the
 * language changes: the codes themselves are static.
 */
export function useCurrencyOptions(): CurrencyOption[] {
  const { i18n } = useTranslation()
  const locale = i18n.language

  return useMemo(
    () =>
      CURRENCY_OPTIONS.map((option) => ({
        ...option,
        description: currencyName(option.value, locale),
      })),
    [locale],
  )
}
