import type { RouteConfig } from "@appTypes/route"
import { RouteNames } from "@constants/routeNames"
import { AnalyticsPage } from "@pages/AnalyticsPage"
import { AuthPage } from "@pages/AuthPage"
import { CategoriesPage } from "@pages/CategoriesPage"
import { GoalsPage } from "@pages/GoalsPage"
import { HomePage } from "@pages/HomePage"
import { InvestmentsPage } from "@pages/InvestmentsPage"
import { RegisterPage } from "@pages/RegisterPage"
import { TransactionsPage } from "@pages/TransactionsPage"

export const appRoutes: RouteConfig[] = [
  { path: RouteNames.Home, element: <HomePage />, label: "nav.home" },
  { path: RouteNames.Transactions, element: <TransactionsPage />, label: "nav.transactions" },
  { path: RouteNames.Categories, element: <CategoriesPage />, label: "nav.categories" },
  { path: RouteNames.Analytics, element: <AnalyticsPage />, label: "nav.analytics" },
  { path: RouteNames.Goals, element: <GoalsPage />, label: "nav.goals" },
  { path: RouteNames.Investments, element: <InvestmentsPage />, label: "nav.investments" },
]

export const publicRoutes: RouteConfig[] = [
  {
    path: RouteNames.Auth,
    element: <AuthPage />,
    label: "nav.auth",
  },
  {
    path: RouteNames.Register,
    element: <RegisterPage />,
    label: "nav.register",
  },
]
