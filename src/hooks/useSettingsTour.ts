import { useTour } from "@hooks/useTour"
import { useTranslation } from "react-i18next"

/**
 * Guided walkthrough of the settings page (tabs + form), on top of the shared nav +
 * "Add" intro from `useTour`.
 */
export function useSettingsTour() {
  const { t } = useTranslation()

  return useTour(() => [
    {
      element: "[data-tour='set-tabs']",
      popover: {
        title: t("settings.tour_tabs_title"),
        description: t("settings.tour_tabs_desc"),
        side: "bottom",
      },
    },
    {
      element: "[data-tour='set-form']",
      popover: {
        title: t("settings.tour_form_title"),
        description: t("settings.tour_form_desc"),
        side: "right",
      },
    },
  ])
}
