import type { RouteConfig } from "@appTypes/route"
import { RouteNames } from "@constants/routeNames"
import { lazy } from "react"

const HomePage = lazy(() => import("@pages/HomePage").then((m) => ({ default: m.HomePage })))
const TransactionsPage = lazy(() =>
  import("@pages/TransactionsPage").then((m) => ({ default: m.TransactionsPage })),
)
const CategoriesPage = lazy(() =>
  import("@pages/CategoriesPage").then((m) => ({ default: m.CategoriesPage })),
)
const AnalyticsPage = lazy(() =>
  import("@pages/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })),
)
const GoalsPage = lazy(() => import("@pages/GoalsPage").then((m) => ({ default: m.GoalsPage })))
// TODO(investments): temporarily hidden, page under development — restore the import and route below
// const InvestmentsPage = lazy(() =>
//   import("@pages/InvestmentsPage").then((m) => ({ default: m.InvestmentsPage })),
// )
const SettingsPage = lazy(() =>
  import("@pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
)
const AuthPage = lazy(() => import("@pages/AuthPage").then((m) => ({ default: m.AuthPage })))
const RegisterPage = lazy(() =>
  import("@pages/RegisterPage").then((m) => ({ default: m.RegisterPage })),
)

export const appRoutes: RouteConfig[] = [
  { path: RouteNames.Home, element: <HomePage /> },
  { path: RouteNames.Transactions, element: <TransactionsPage /> },
  { path: RouteNames.Categories, element: <CategoriesPage /> },
  { path: RouteNames.Analytics, element: <AnalyticsPage /> },
  { path: RouteNames.Goals, element: <GoalsPage /> },
  // TODO(investments): temporarily hidden, page under development — restore the route
  // { path: RouteNames.Investments, element: <InvestmentsPage /> },
  { path: RouteNames.Settings, element: <SettingsPage /> },
  { path: RouteNames.SettingsSecurity, element: <SettingsPage /> },
  { path: RouteNames.SettingsTelegram, element: <SettingsPage /> },
]

export const publicRoutes: RouteConfig[] = [
  {
    path: RouteNames.Auth,
    element: <AuthPage />,
  },
  {
    path: RouteNames.Register,
    element: <RegisterPage />,
  },
]
