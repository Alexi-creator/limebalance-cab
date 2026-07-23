import { useTour } from "@hooks/useTour"
import { useTranslation } from "react-i18next"

/**
 * Guided walkthrough of the categories page (income/expense toggle, new category,
 * category cards), on top of the shared nav + "Add" intro from `useTour`.
 */
export function useCategoriesTour() {
  const { t } = useTranslation()

  return useTour(() => [
    {
      element: "[data-tour='cat-toggle']",
      popover: {
        title: t("categories.tour_toggle_title"),
        description: t("categories.tour_toggle_desc"),
        side: "bottom",
      },
    },
    {
      element: "[data-tour='cat-add']",
      popover: {
        title: t("categories.tour_add_title"),
        description: t("categories.tour_add_desc"),
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='cat-grid']",
      popover: {
        title: t("categories.tour_grid_title"),
        description: t("categories.tour_grid_desc"),
        side: "top",
      },
    },
  ])
}
