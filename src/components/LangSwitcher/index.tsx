import { languages } from "@i18n/languages.ts"
import { Select } from "@mantine/core"
import { useTranslation } from "react-i18next"

const languageOptions = Object.entries(languages).map(([value, { label }]) => ({ value, label }))

/**
 * Выпадающий селект для смены языка интерфейса.
 * При изменении обновляет i18n и сохраняет выбор в `localStorage`.
 * Не принимает пропсов.
 */
export function LangSwitcher() {
  const { i18n } = useTranslation()

  const handleChange = (lang: string | null) => {
    if (!lang) return
    i18n.changeLanguage(lang)
    localStorage.setItem("lang", lang)
  }

  return (
    <Select
      size="sm"
      w={150}
      value={i18n.language}
      onChange={handleChange}
      data={languageOptions}
      allowDeselect={false}
      searchable
      checkIconPosition="right"
    />
  )
}
