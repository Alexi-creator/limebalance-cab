import type { RouteConfig } from "@appTypes/route"
import { RouteNames } from "@constants/routeNames"
import { AuthPage } from "@pages/AuthPage"
import { HomePage } from "@pages/HomePage"
import { RegisterPage } from "@pages/RegisterPage"

export const appRoutes: RouteConfig[] = [
  {
    path: RouteNames.Home,
    element: <HomePage />,
    label: "nav.home",
  },
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
