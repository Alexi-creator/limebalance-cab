import { useTour } from "@hooks/useTour"
import { useTranslation } from "react-i18next"

/**
 * Guided walkthrough of the transactions page (quick add + filterable list), on top of
 * the shared nav + "Add" intro from `useTour`.
 */
export function useTransactionsTour() {
  const { t } = useTranslation()

  return useTour(() => [
    {
      element: "[data-tour='tx-add']",
      popover: {
        title: t("transactions.tour_add_title"),
        description: t("transactions.tour_add_desc"),
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='tx-list']",
      popover: {
        title: t("transactions.tour_list_title"),
        description: t("transactions.tour_list_desc"),
        side: "top",
      },
    },
  ])
}
