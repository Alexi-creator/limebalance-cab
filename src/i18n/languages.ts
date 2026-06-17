import "dayjs/locale/ru"
import "dayjs/locale/de"
import "dayjs/locale/fr"
import "dayjs/locale/es"
import "dayjs/locale/it"
import "dayjs/locale/pt"
import "dayjs/locale/nl"
import "dayjs/locale/sv"
import "dayjs/locale/nb"
import "dayjs/locale/da"
import "dayjs/locale/fi"
import "dayjs/locale/et"
import "dayjs/locale/el"
import "dayjs/locale/hu"
import "dayjs/locale/tr"
import "dayjs/locale/bg"
import "dayjs/locale/pl"
import "dayjs/locale/cs"
import "dayjs/locale/sk"
import "dayjs/locale/uk"
import "dayjs/locale/ro"
import "dayjs/locale/hr"
import "dayjs/locale/lt"
import "dayjs/locale/sl"
import "dayjs/locale/lv"
import "dayjs/locale/he"
import "dayjs/locale/ar"
import "dayjs/locale/ja"
import "dayjs/locale/zh-cn"
import "dayjs/locale/ko"
import "dayjs/locale/id"
import "dayjs/locale/th"
import "dayjs/locale/vi"

import type { Locale } from "date-fns"
import {
  ar,
  bg,
  cs,
  da,
  de,
  el,
  enUS,
  es,
  et,
  fi,
  fr,
  he,
  hr,
  hu,
  id,
  it,
  ja,
  ko,
  lt,
  lv,
  nb,
  nl,
  pl,
  pt,
  ro,
  ru,
  sk,
  sl,
  sv,
  th,
  tr,
  uk,
  vi,
  zhCN,
} from "date-fns/locale"
import ar_ from "./locales/ar.json"
import bg_ from "./locales/bg.json"
import cs_ from "./locales/cs.json"
import da_ from "./locales/da.json"
import de_ from "./locales/de.json"
import el_ from "./locales/el.json"
import en from "./locales/en.json"
import es_ from "./locales/es.json"
import et_ from "./locales/et.json"
import fi_ from "./locales/fi.json"
import fr_ from "./locales/fr.json"
import he_ from "./locales/he.json"
import hr_ from "./locales/hr.json"
import hu_ from "./locales/hu.json"
import id_ from "./locales/id.json"
import it_ from "./locales/it.json"
import ja_ from "./locales/ja.json"
import ko_ from "./locales/ko.json"
import lt_ from "./locales/lt.json"
import lv_ from "./locales/lv.json"
import nb_ from "./locales/nb.json"
import nl_ from "./locales/nl.json"
import pl_ from "./locales/pl.json"
import pt_ from "./locales/pt.json"
import ro_ from "./locales/ro.json"
import ruTranslation from "./locales/ru.json"
import sk_ from "./locales/sk.json"
import sl_ from "./locales/sl.json"
import sv_ from "./locales/sv.json"
import th_ from "./locales/th.json"
import tr_ from "./locales/tr.json"
import uk_ from "./locales/uk.json"
import vi_ from "./locales/vi.json"
import zh_ from "./locales/zh.json"

interface LangConfig {
  label: string
  dateFnsLocale: Locale
  translation: Record<string, unknown>
}

export const languages: Record<string, LangConfig> = {
  en: { label: "English", dateFnsLocale: enUS, translation: en },
  ru: { label: "Русский", dateFnsLocale: ru, translation: ruTranslation },
  de: { label: "Deutsch", dateFnsLocale: de, translation: de_ },
  fr: { label: "Français", dateFnsLocale: fr, translation: fr_ },
  es: { label: "Español", dateFnsLocale: es, translation: es_ },
  it: { label: "Italiano", dateFnsLocale: it, translation: it_ },
  pt: { label: "Português", dateFnsLocale: pt, translation: pt_ },
  nl: { label: "Nederlands", dateFnsLocale: nl, translation: nl_ },
  sv: { label: "Svenska", dateFnsLocale: sv, translation: sv_ },
  nb: { label: "Norsk", dateFnsLocale: nb, translation: nb_ },
  da: { label: "Dansk", dateFnsLocale: da, translation: da_ },
  fi: { label: "Suomi", dateFnsLocale: fi, translation: fi_ },
  et: { label: "Eesti", dateFnsLocale: et, translation: et_ },
  el: { label: "Ελληνικά", dateFnsLocale: el, translation: el_ },
  hu: { label: "Magyar", dateFnsLocale: hu, translation: hu_ },
  tr: { label: "Türkçe", dateFnsLocale: tr, translation: tr_ },
  bg: { label: "Български", dateFnsLocale: bg, translation: bg_ },
  pl: { label: "Polski", dateFnsLocale: pl, translation: pl_ },
  cs: { label: "Čeština", dateFnsLocale: cs, translation: cs_ },
  sk: { label: "Slovenčina", dateFnsLocale: sk, translation: sk_ },
  uk: { label: "Українська", dateFnsLocale: uk, translation: uk_ },
  ro: { label: "Română", dateFnsLocale: ro, translation: ro_ },
  hr: { label: "Hrvatski", dateFnsLocale: hr, translation: hr_ },
  lt: { label: "Lietuvių", dateFnsLocale: lt, translation: lt_ },
  sl: { label: "Slovenščina", dateFnsLocale: sl, translation: sl_ },
  lv: { label: "Latviešu", dateFnsLocale: lv, translation: lv_ },
  he: { label: "עברית", dateFnsLocale: he, translation: he_ },
  ar: { label: "العربية", dateFnsLocale: ar, translation: ar_ },
  ja: { label: "日本語", dateFnsLocale: ja, translation: ja_ },
  zh: { label: "中文", dateFnsLocale: zhCN, translation: zh_ },
  ko: { label: "한국어", dateFnsLocale: ko, translation: ko_ },
  id: { label: "Bahasa Indonesia", dateFnsLocale: id, translation: id_ },
  th: { label: "ไทย", dateFnsLocale: th, translation: th_ },
  vi: { label: "Tiếng Việt", dateFnsLocale: vi, translation: vi_ },
}

export const dateFnsLocales: Record<string, Locale> = Object.fromEntries(
  Object.entries(languages).map(([key, { dateFnsLocale }]) => [key, dateFnsLocale]),
)
