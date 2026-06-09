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

/** Группы навигации сайдбара: заголовок секции + пункты с маршрутом, подписью и иконкой. */
export const getNavGroups = (t: TFunction) => [
  {
    title: t("nav.menu"),
    items: [
      { to: RouteNames.Home, label: t("nav.home"), icon: IconHome },
      { to: RouteNames.Transactions, label: t("nav.transactions"), icon: IconListDetails },
      { to: RouteNames.Categories, label: t("nav.categories"), icon: IconTags },
      { to: RouteNames.Analytics, label: t("nav.analytics"), icon: IconChartHistogram },
      { to: RouteNames.Goals, label: t("nav.goals"), icon: IconTarget },
      // TODO(investments): временно скрыто, страница в разработке — вернуть пункт (+ IconCoin в импорт)
      // { to: RouteNames.Investments, label: t("nav.investments"), icon: IconCoin },
    ],
  },
  {
    title: t("nav.account"),
    items: [{ to: RouteNames.Settings, label: t("nav.settings"), icon: IconSettings }],
  },
]
