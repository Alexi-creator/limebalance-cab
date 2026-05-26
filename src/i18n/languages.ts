import "dayjs/locale/ru"

import type { Locale } from "date-fns"
import { enUS, ru } from "date-fns/locale"
import en from "./locales/en.json"
import ruTranslation from "./locales/ru.json"

interface LangConfig {
  label: string
  dateFnsLocale: Locale
  translation: Record<string, unknown>
}

export const languages: Record<string, LangConfig> = {
  en: { label: "English", dateFnsLocale: enUS, translation: en },
  ru: { label: "Русский", dateFnsLocale: ru, translation: ruTranslation },
}

export const dateFnsLocales: Record<string, Locale> = Object.fromEntries(
  Object.entries(languages).map(([key, { dateFnsLocale }]) => [key, dateFnsLocale]),
)
