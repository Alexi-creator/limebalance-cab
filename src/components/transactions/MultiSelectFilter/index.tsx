import {
  ActionIcon,
  CheckIcon,
  Combobox,
  Group,
  Input,
  InputBase,
  ScrollArea,
  useCombobox,
} from "@mantine/core"
import { IconX } from "@tabler/icons-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

interface Option {
  value: string
  label: string
}

interface Props {
  label: string
  /** Shown in the trigger when nothing is selected. */
  placeholder: string
  data: Option[]
  value: string[]
  onChange: (value: string[]) => void
  /** Trigger text when something is selected, e.g. `(n) => "2 categories"`. */
  summary: (count: number) => string
  /** Control width — matches the sibling filter inputs. */
  w: number | string
}

/**
 * Multi-select filter that stays a single-line control: the trigger shows a short summary
 * (the selected count) instead of a growing list of pills, and selection happens via a
 * searchable checklist in the dropdown. The selected items are surfaced as removable chips
 * above the table (see ActiveFilterChips), so the compact trigger doesn't hide what's picked.
 */
export function MultiSelectFilter({
  label,
  placeholder,
  data,
  value,
  onChange,
  summary,
  w,
}: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption()
      setSearch("")
    },
  })

  const toggle = (val: string) =>
    onChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val])

  const options = data
    .filter((o) => o.label.toLowerCase().includes(search.trim().toLowerCase()))
    .map((o) => {
      const selected = value.includes(o.value)
      return (
        <Combobox.Option value={o.value} key={o.value} active={selected}>
          <Group gap="sm" wrap="nowrap">
            <CheckIcon size={12} style={{ opacity: selected ? 1 : 0 }} />
            <span>{o.label}</span>
          </Group>
        </Combobox.Option>
      )
    })

  return (
    <Combobox store={combobox} onOptionSubmit={toggle} withinPortal>
      <Combobox.Target>
        <InputBase
          label={label}
          component="button"
          type="button"
          pointer
          onClick={() => combobox.toggleDropdown()}
          rightSectionPointerEvents={value.length ? "auto" : "none"}
          rightSection={
            value.length ? (
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                aria-label={t("common.reset")}
                onClick={(e) => {
                  e.stopPropagation()
                  onChange([])
                }}
              >
                <IconX size={14} />
              </ActionIcon>
            ) : (
              <Combobox.Chevron />
            )
          }
          w={w}
        >
          {value.length ? (
            summary(value.length)
          ) : (
            <Input.Placeholder>{placeholder}</Input.Placeholder>
          )}
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Search
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          placeholder={t("common.search")}
        />
        <Combobox.Options>
          <ScrollArea.Autosize mah={240} type="scroll">
            {options.length > 0 ? (
              options
            ) : (
              <Combobox.Empty>{t("common.nothing_found")}</Combobox.Empty>
            )}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
