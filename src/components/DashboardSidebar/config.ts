import { RouteNames } from "@constants/routeNames"
import type { Icon } from "@tabler/icons-react"
import {
  IconChartHistogram,
  IconCoin,
  IconHome,
  IconListDetails,
  IconSettings,
  IconTags,
  IconTarget,
} from "@tabler/icons-react"
import type { TFunction } from "i18next"

interface NavItem {
  to: string
  label: string
  icon: Icon
  /** When true, the item is locked (disabled, not navigable) for users without investing access. */
  requiresPaid?: boolean
}

interface NavGroup {
  title: string
  items: NavItem[]
}

/** Sidebar navigation groups: section title + items with a route, label, and icon. */
export const getNavGroups = (t: TFunction): NavGroup[] => [
  {
    title: t("nav.menu"),
    items: [
      { to: RouteNames.Home, label: t("nav.home"), icon: IconHome },
      { to: RouteNames.Transactions, label: t("nav.transactions"), icon: IconListDetails },
      { to: RouteNames.Categories, label: t("nav.categories"), icon: IconTags },
      { to: RouteNames.Analytics, label: t("nav.analytics"), icon: IconChartHistogram },
      { to: RouteNames.Goals, label: t("nav.goals"), icon: IconTarget },
      // Visible to everyone, but locked on the free plan: shown disabled and not navigable.
      {
        to: RouteNames.Investments,
        label: t("nav.investments"),
        icon: IconCoin,
        requiresPaid: true,
      },
    ],
  },
  {
    title: t("nav.account"),
    items: [{ to: RouteNames.Settings, label: t("nav.settings"), icon: IconSettings }],
  },
]
