import type { Icon } from "@tabler/icons-react"
import {
  IconChartHistogram,
  IconCoin,
  IconHelpCircle,
  IconHome,
  IconListDetails,
  IconRocket,
  IconScale,
  IconSettings,
  IconTags,
  IconTarget,
} from "@tabler/icons-react"
import { RouteNames } from "@/shared/config/routeNames"

export interface FaqItem {
  /** Key under `faq.items.<id>` — `q` is the question, `a` the answer. */
  id: string
  icon?: Icon
  /** When set, the answer ends with a button that opens this page. */
  to?: string
}

export interface FaqSection {
  /** Key under `faq.sections.<id>`. */
  id: string
  icon: Icon
  items: FaqItem[]
}

/** The FAQ, top to bottom: onboarding, a tour of the sections, how they add up, everything else. */
export const FAQ_SECTIONS: FaqSection[] = [
  {
    id: "start",
    icon: IconRocket,
    items: [{ id: "first_steps" }, { id: "quick_add" }, { id: "tours" }],
  },
  {
    id: "pages",
    icon: IconListDetails,
    items: [
      { id: "page_home", icon: IconHome, to: RouteNames.Home },
      { id: "page_transactions", icon: IconListDetails, to: RouteNames.Transactions },
      { id: "page_categories", icon: IconTags, to: RouteNames.Categories },
      { id: "page_analytics", icon: IconChartHistogram, to: RouteNames.Analytics },
      { id: "page_goals", icon: IconTarget, to: RouteNames.Goals },
      { id: "page_investments", icon: IconCoin, to: RouteNames.Investments },
      { id: "page_settings", icon: IconSettings, to: RouteNames.Settings },
    ],
  },
  {
    id: "balance",
    icon: IconScale,
    items: [
      { id: "balance_formula" },
      { id: "balance_currencies" },
      { id: "balance_goals" },
      { id: "balance_exchange" },
      { id: "balance_transfer" },
      { id: "balance_analytics" },
    ],
  },
  {
    id: "common",
    icon: IconHelpCircle,
    items: [
      { id: "base_currency" },
      { id: "delete_category" },
      { id: "limits" },
      { id: "telegram_bot" },
      { id: "telegram_login" },
      { id: "forgot_password" },
      { id: "filters_presets" },
      { id: "exchange_connect" },
      { id: "p2p" },
      { id: "theme_language" },
    ],
  },
]
