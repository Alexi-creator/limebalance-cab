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
  { path: RouteNames.Home, element: <HomePage /> },
  { path: RouteNames.Transactions, element: <TransactionsPage /> },
  { path: RouteNames.Categories, element: <CategoriesPage /> },
  { path: RouteNames.Analytics, element: <AnalyticsPage /> },
  { path: RouteNames.Goals, element: <GoalsPage /> },
  { path: RouteNames.Investments, element: <InvestmentsPage /> },
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
