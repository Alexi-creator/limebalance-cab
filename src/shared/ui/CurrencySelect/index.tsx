import { CheckIcon, type ComboboxItem, Group, Select, type SelectProps, Text } from "@mantine/core"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { type CurrencyOption, useCurrencyOptions } from "@/shared/hooks/useCurrencyOptions"

type Props = Omit<SelectProps, "data" | "filter" | "renderOption">

/**
 * The currency picker used by every form and filter. The closed control stays narrow — just the code
 * and its symbol — while the dropdown spells the currency out in the interface language, so codes
 * that have no symbol of their own (AED, CHF, BGN) are still recognizable and the `$` shared by a
 * dozen currencies is never the only thing distinguishing them. Typing matches the code and the name.
 *
 * The dropdown is wider than the control on purpose: in the amount + currency rows the control is
 * only 140px, which the names would not fit. Pass `comboboxProps` to override it for a full-width field.
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
  const names = useMemo(
    () => new Map(options.map((option) => [option.value, option.description])),
    [options],
  )

  return (
    <Select
      data={options}
      searchable={searchable}
      allowDeselect={allowDeselect}
      nothingFoundMessage={nothingFoundMessage ?? t("common.nothing_found")}
      comboboxProps={{ width: 280, position: "bottom-start", ...comboboxProps }}
      filter={({ options: items, search }) => {
        const query = search.trim().toLowerCase()
        return (items as ComboboxItem[]).filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            (names.get(item.value) ?? "").toLowerCase().includes(query),
        )
      }}
      renderOption={({ option, checked }) => (
        <Group gap="sm" wrap="nowrap" justify="space-between" w="100%">
          <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
            {/* kept in the layout when unchecked so every row's code starts at the same x */}
            <CheckIcon size={12} style={{ opacity: checked ? 1 : 0, flexShrink: 0 }} />
            <span>{option.label}</span>
          </Group>
          {/* minWidth lets the name shrink and ellipsize instead of overflowing the dropdown */}
          <Text size="sm" c="dimmed" truncate style={{ minWidth: 0 }}>
            {names.get(option.value)}
          </Text>
        </Group>
      )}
      {...props}
    />
  )
}

export type { CurrencyOption }
