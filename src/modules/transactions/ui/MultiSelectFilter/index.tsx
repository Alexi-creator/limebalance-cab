import {
  ActionIcon,
  CheckIcon,
  Combobox,
  Group,
  Input,
  InputBase,
  ScrollArea,
  Text,
  useCombobox,
} from "@mantine/core"
import { IconX } from "@tabler/icons-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { FavoriteStar } from "@/shared/ui/FavoriteStar"

interface Option {
  value: string
  label: string
  /** Optional second line of meaning, shown dimmed next to the label and searchable too (currency names). */
  description?: string
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
  /** Adds a star to each option; starred ones are listed first under `label`, the rest under `restLabel`. */
  favorites?: {
    values: string[]
    onToggle: (value: string) => void
    label: string
    restLabel: string
  }
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
  favorites,
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

  const query = search.trim().toLowerCase()
  const matched = data.filter(
    (o) =>
      o.label.toLowerCase().includes(query) || (o.description ?? "").toLowerCase().includes(query),
  )
  const renderOptions = (list: Option[]) =>
    list.map((o) => {
      const selected = value.includes(o.value)
      return (
        <Combobox.Option value={o.value} key={o.value} active={selected}>
          <Group gap="sm" wrap="nowrap">
            <span style={{ flexShrink: 0 }}>{o.label}</span>
            {o.description ? (
              // minWidth lets the description shrink and ellipsize instead of overflowing
              <Text size="sm" c="dimmed" truncate ml="auto" style={{ minWidth: 0 }}>
                {o.description}
              </Text>
            ) : null}
            {/* on the right so labels sit flush left; kept in the layout when unchecked so the
                descriptions stay aligned */}
            <CheckIcon
              size={12}
              style={{
                opacity: selected ? 1 : 0,
                flexShrink: 0,
                marginLeft: o.description ? 0 : "auto",
              }}
            />
            {favorites ? (
              <FavoriteStar
                active={favorites.values.includes(o.value)}
                onToggle={() => favorites.onToggle(o.value)}
              />
            ) : null}
          </Group>
        </Combobox.Option>
      )
    })

  const starred = favorites ? matched.filter((o) => favorites.values.includes(o.value)) : []
  const options =
    favorites && starred.length > 0 ? (
      <>
        <Combobox.Group label={favorites.label}>{renderOptions(starred)}</Combobox.Group>
        {matched.length > starred.length ? (
          <Combobox.Group label={favorites.restLabel}>
            {renderOptions(matched.filter((o) => !favorites.values.includes(o.value)))}
          </Combobox.Group>
        ) : null}
      </>
    ) : (
      renderOptions(matched)
    )

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={toggle}
      withinPortal
      // sized to the longest option (currency names) rather than the narrow trigger, never
      // narrower than the trigger and capped so an odd long name ellipsizes instead
      width="max-content"
      position="bottom-end"
    >
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

      <Combobox.Dropdown miw={w} maw={360}>
        <Combobox.Search
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          placeholder={t("common.search")}
        />
        <Combobox.Options>
          <ScrollArea.Autosize mah={240} type="scroll" scrollbars="y">
            {matched.length > 0 ? (
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
