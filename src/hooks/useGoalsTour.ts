import { useTour } from "@hooks/useTour"
import { useTranslation } from "react-i18next"

/**
 * Guided walkthrough of the goals page (new goal, savings summary, goal cards), on top
 * of the shared nav + "Add" intro from `useTour`.
 */
export function useGoalsTour() {
  const { t } = useTranslation()

  return useTour(() => [
    {
      element: "[data-tour='g-add']",
      popover: {
        title: t("goals.tour_add_title"),
        description: t("goals.tour_add_desc"),
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='g-summary']",
      popover: {
        title: t("goals.tour_summary_title"),
        description: t("goals.tour_summary_desc"),
        side: "bottom",
      },
    },
    {
      element: "[data-tour='g-cards']",
      popover: {
        title: t("goals.tour_cards_title"),
        description: t("goals.tour_cards_desc"),
        side: "top",
      },
    },
  ])
}
