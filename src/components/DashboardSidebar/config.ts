import { RouteNames } from "@constants/routeNames"
import {
  IconChartHistogram,
  IconHome,
  IconListDetails,
  IconSettings,
  IconTags,
  IconTarget,
} from "@tabler/icons-react"
import type { TFunction } from "i18next"

/** Sidebar navigation groups: section title + items with a route, label, and icon. */
export const getNavGroups = (t: TFunction) => [
  {
    title: t("nav.menu"),
    items: [
      { to: RouteNames.Home, label: t("nav.home"), icon: IconHome },
      { to: RouteNames.Transactions, label: t("nav.transactions"), icon: IconListDetails },
      { to: RouteNames.Categories, label: t("nav.categories"), icon: IconTags },
      { to: RouteNames.Analytics, label: t("nav.analytics"), icon: IconChartHistogram },
      { to: RouteNames.Goals, label: t("nav.goals"), icon: IconTarget },
      // TODO(investments): temporarily hidden, page under development — restore the item (+ IconCoin in the import)
      // { to: RouteNames.Investments, label: t("nav.investments"), icon: IconCoin },
    ],
  },
  {
    title: t("nav.account"),
    items: [{ to: RouteNames.Settings, label: t("nav.settings"), icon: IconSettings }],
  },
]
