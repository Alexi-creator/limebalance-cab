import { useTour } from "@hooks/useTour"
import { useTranslation } from "react-i18next"

/**
 * Guided walkthrough of the analytics page (period selector, KPIs, charts), on top of
 * the shared nav + "Add" intro from `useTour`.
 */
export function useAnalyticsTour() {
  const { t } = useTranslation()

  return useTour(() => [
    {
      element: "[data-tour='an-period']",
      popover: {
        title: t("analytics.tour_period_title"),
        description: t("analytics.tour_period_desc"),
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='an-kpis']",
      popover: {
        title: t("analytics.tour_kpis_title"),
        description: t("analytics.tour_kpis_desc"),
        side: "bottom",
      },
    },
    {
      element: "[data-tour='an-charts']",
      popover: {
        title: t("analytics.tour_charts_title"),
        description: t("analytics.tour_charts_desc"),
        side: "top",
      },
    },
  ])
}
