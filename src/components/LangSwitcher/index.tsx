import { languages } from "@i18n/languages.ts"
import { Select } from "@mantine/core"
import { useTranslation } from "react-i18next"

const languageOptions = Object.entries(languages).map(([value, { label }]) => ({ value, label }))

/**
 * Dropdown select for changing the interface language.
 * On change it updates i18n and saves the choice in `localStorage`.
 * `w` overrides the width; defaults to a fixed 150px for the header.
 */
export function LangSwitcher({ w = 150 }: { w?: number | string }) {
  const { i18n } = useTranslation()

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
    />
  )
}
