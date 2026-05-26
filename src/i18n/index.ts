import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { languages } from "./languages"

i18n.use(initReactI18next).init({
  resources: Object.fromEntries(
    Object.entries(languages).map(([key, { translation }]) => [key, { translation }]),
  ),
  lng: localStorage.getItem("lang") ?? navigator.language.split("-")[0],
  fallbackLng: "en",
  interpolation: { escapeValue: false },
})

export default i18n
