import { Select } from "@mantine/core"
import { useTranslation } from "react-i18next"

const languages = [
  { label: "English", value: "en" },
  { label: "Русский", value: "ru" },
]

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
      w={110}
      value={i18n.language}
      onChange={handleChange}
      data={languages}
      allowDeselect={false}
      checkIconPosition="right"
    />
  )
}
