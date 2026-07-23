import { useTour } from "@hooks/useTour"
import { useTranslation } from "react-i18next"

/**
 * Guided walkthrough of the home page's main blocks (KPIs, chart, goals, recent
 * transactions), on top of the shared nav + "Add" intro from `useTour`. Targets
 * elements by their `data-tour` attribute, so the step order here must stay in
 * sync with where those attributes are placed.
 */
export function useHomeTour() {
  const { t } = useTranslation()

  return useTour(
    () => [
      {
        element: "[data-tour='kpis']",
        popover: {
          title: t("home.tour_kpis_title"),
          description: t("home.tour_kpis_desc"),
          side: "bottom",
        },
      },
      {
        element: "[data-tour='chart']",
        popover: {
          title: t("home.tour_chart_title"),
          description: t("home.tour_chart_desc"),
          side: "top",
        },
      },
      {
        element: "[data-tour='goals']",
        popover: {
          title: t("home.tour_goals_title"),
          description: t("home.tour_goals_desc"),
          side: "left",
        },
      },
      {
        element: "[data-tour='transactions']",
        popover: {
          title: t("home.tour_transactions_title"),
          description: t("home.tour_transactions_desc"),
          side: "top",
        },
      },
    ],
    { includeIntro: true },
  )
}
