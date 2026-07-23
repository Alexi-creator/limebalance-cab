import { useTour } from "@hooks/useTour"
import { useTranslation } from "react-i18next"

/** Clicks the real tab button so Mantine/React Router switch tabs exactly like a user would. */
function clickTab(tab: "journal" | "portfolio" | "accounts") {
  document.querySelector<HTMLElement>(`[data-tour='inv-tab-${tab}']`)?.click()
}

// Panels are `keepMounted={false}`, so only the active tab's content exists in the DOM —
// give driver.js time to pick up the newly-mounted panel after we switch tabs underneath it.
const TAB_SWITCH_WAIT_MS = 2000

/**
 * Guided walkthrough of the investments page (tabs, then each tab's own content), on top
 * of the shared nav + "Add" intro from `useTour`. Since the journal/portfolio/accounts
 * panels are unmounted when their tab isn't active, every step past the first one switches
 * tabs itself (via the popover's onNextClick/onPrevClick) before driver.js looks for that
 * step's target — `waitForElement` on the destination step is what lets it wait out the
 * re-render instead of just falling back to a centered dummy popover.
 */
export function useInvestmentsTour() {
  const { t } = useTranslation()

  return useTour(() => [
    {
      element: "[data-tour='inv-tabs']",
      popover: {
        title: t("investments.tour_tabs_title"),
        description: t("investments.tour_tabs_desc"),
        side: "bottom",
        onNextClick: (_element, _step, opts) => {
          clickTab("journal")
          opts.driver.moveNext()
        },
      },
    },
    {
      element: "[data-tour='inv-journal-filters']",
      waitForElement: TAB_SWITCH_WAIT_MS,
      popover: {
        title: t("investments.tour_journal_filters_title"),
        description: t("investments.tour_journal_filters_desc"),
        side: "bottom",
      },
    },
    {
      element: "[data-tour='inv-journal']",
      waitForElement: TAB_SWITCH_WAIT_MS,
      popover: {
        title: t("investments.tour_journal_title"),
        description: t("investments.tour_journal_desc"),
        side: "top",
        onNextClick: (_element, _step, opts) => {
          clickTab("portfolio")
          opts.driver.moveNext()
        },
      },
    },
    {
      element: "[data-tour='inv-portfolio']",
      waitForElement: TAB_SWITCH_WAIT_MS,
      popover: {
        title: t("investments.tour_portfolio_title"),
        description: t("investments.tour_portfolio_desc"),
        side: "top",
        onNextClick: (_element, _step, opts) => {
          clickTab("accounts")
          opts.driver.moveNext()
        },
        onPrevClick: (_element, _step, opts) => {
          clickTab("journal")
          opts.driver.movePrevious()
        },
      },
    },
    {
      element: "[data-tour='inv-accounts']",
      waitForElement: TAB_SWITCH_WAIT_MS,
      popover: {
        title: t("investments.tour_accounts_title"),
        description: t("investments.tour_accounts_desc"),
        side: "top",
        onPrevClick: (_element, _step, opts) => {
          clickTab("portfolio")
          opts.driver.movePrevious()
        },
      },
    },
  ])
}
