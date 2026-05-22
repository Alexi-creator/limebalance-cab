import type { RouteConfig } from "@app-types/route"
import { AuthPage } from "@pages/AuthPage"
import { HomePage } from "@pages/HomePage"

export const appRoutes: RouteConfig[] = [
  {
    path: "/",
    element: <HomePage />,
    label: "nav.home",
  },
]

export const publicRoutes: RouteConfig[] = [
  {
    path: "/auth",
    element: <AuthPage />,
    label: "nav.auth",
  },
]
