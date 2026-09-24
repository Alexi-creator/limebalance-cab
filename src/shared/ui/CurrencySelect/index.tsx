import {
  CheckIcon,
  type ComboboxItem,
  type ComboboxParsedItem,
  Group,
  isOptionsGroup,
  Select,
  type SelectProps,
  Text,
} from "@mantine/core"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { type CurrencyOption, useCurrencyOptions } from "@/shared/hooks/useCurrencyOptions"
import { useFavoriteCurrencies } from "@/shared/hooks/useFavoriteCurrencies"
import { FavoriteStar } from "@/shared/ui/FavoriteStar"

type Props = Omit<SelectProps, "data" | "filter" | "renderOption">

/**
 * The currency picker used by every form and filter. The closed control stays narrow — just the code
 * and its symbol — while the dropdown spells the currency out in the interface language, so codes
 * that have no symbol of their own (AED, CHF, BGN) are still recognizable and the `$` shared by a
 * dozen currencies is never the only thing distinguishing them. Typing matches the code and the name.
 *
 * The dropdown is wider than the control on purpose: in the amount + currency rows the control is
 * only 140px, which the names would not fit. Pass `comboboxProps` to override it for a full-width field.
 *
 * Each row has a star: starred currencies (useFavoriteCurrencies) are grouped at the top of the list.
 */
export function CurrencySelect({
  searchable = true,
  allowDeselect = false,
  nothingFoundMessage,
  comboboxProps,
  ...props
}: Props) {
  const { t } = useTranslation()
  const options = useCurrencyOptions()
  const { favorites, toggleFavorite } = useFavoriteCurrencies()
  const names = useMemo(
    () => new Map(options.map((option) => [option.value, option.description])),
    [options],
  )
  const data = useMemo(() => {
    if (favorites.length === 0) return options
    const starred = options.filter((o) => favorites.includes(o.value))
    const rest = options.filter((o) => !favorites.includes(o.value))
    return [
      { group: t("common.favorites"), items: starred },
      { group: t("common.all_currencies"), items: rest },
    ]
  }, [options, favorites, t])

  const matches = (item: ComboboxItem, query: string) =>
    item.label.toLowerCase().includes(query) ||
    (names.get(item.value) ?? "").toLowerCase().includes(query)

  return (
    <Select
      data={data}
      searchable={searchable}
      allowDeselect={allowDeselect}
      nothingFoundMessage={nothingFoundMessage ?? t("common.nothing_found")}
      comboboxProps={{ width: 280, position: "bottom-start", ...comboboxProps }}
      filter={({ options: items, search }) => {
        const query = search.trim().toLowerCase()
        // groups are filtered item by item; a group left empty is dropped with its header
        return items.flatMap((item): ComboboxParsedItem[] => {
          if (!isOptionsGroup(item)) return matches(item, query) ? [item] : []
          const kept = item.items.filter((i) => matches(i, query))
          return kept.length ? [{ ...item, items: kept }] : []
        })
      }}
      renderOption={({ option, checked }) => (
        <Group gap="sm" wrap="nowrap" w="100%">
          <span style={{ flexShrink: 0 }}>{option.label}</span>
          {/* minWidth lets the name shrink and ellipsize instead of overflowing the dropdown */}
          <Text size="sm" c="dimmed" truncate ml="auto" style={{ minWidth: 0 }}>
            {names.get(option.value)}
          </Text>
          {/* on the right so codes sit flush left; kept in the layout when unchecked so the names
              stay aligned */}
          <CheckIcon size={12} style={{ opacity: checked ? 1 : 0, flexShrink: 0 }} />
          <FavoriteStar
            active={favorites.includes(option.value)}
            onToggle={() => toggleFavorite(option.value)}
          />
        </Group>
      )}
      {...props}
    />
  )
}

export type { CurrencyOption }
