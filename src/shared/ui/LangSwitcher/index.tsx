import { CheckIcon, Group, Select } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { languages } from "@/shared/i18n/languages.ts"
import { FlagIcon } from "@/shared/ui/FlagIcon"

const languageOptions = Object.entries(languages).map(([value, { label }]) => ({ value, label }))

/**
 * Dropdown select for changing the interface language.
 * On change it updates i18n and saves the choice in `localStorage`.
 * `w` overrides the width; defaults to a fixed 150px for the header.
 *
 * Each row is prefixed with the flag of the language's `region` — a visual anchor next to names
 * written in their own script, where a reader who doesn't know the script has nothing else to go on.
 */
export function LangSwitcher({ w = 150 }: { w?: number | string }) {
  const { i18n } = useTranslation()

  // i18next may hand back a regional tag ("en-US") while the options are plain codes
  const current = languages[i18n.language] ?? languages[i18n.language.split("-")[0]]

  const handleChange = (lang: string | null) => {
    if (!lang) return
    i18n.changeLanguage(lang)
    localStorage.setItem("lang", lang)
  }

  return (
    <Select
      size="sm"
      w={w}
      value={i18n.language}
      onChange={handleChange}
      data={languageOptions}
      allowDeselect={false}
      searchable
      checkIconPosition="right"
      // the header control is narrow; the list needs a little more room for the longer names
      comboboxProps={{ width: 200, position: "bottom-end" }}
      leftSection={current ? <FlagIcon region={current.region} /> : null}
      leftSectionPointerEvents="none"
      renderOption={({ option, checked }) => (
        <Group gap="xs" wrap="nowrap" justify="space-between" w="100%">
          <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
            <FlagIcon region={languages[option.value]?.region ?? "us"} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {option.label}
            </span>
          </Group>
          {/* renderOption replaces Mantine's own check mark, so the selected row draws its own */}
          {checked ? <CheckIcon size={12} style={{ flexShrink: 0 }} /> : null}
        </Group>
      )}
    />
  )
}
