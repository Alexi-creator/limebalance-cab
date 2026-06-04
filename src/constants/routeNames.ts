export const RouteNames = {
  Home: "/",
  Auth: "/auth",
  Register: "/register",
  Transactions: "/transactions",
  Analytics: "/analytics",
  Goals: "/goals",
  Investments: "/investments",
  Categories: "/categories",
  Settings: "/settings",
  SettingsSecurity: "/settings/security",
} as const

export type RouteName = (typeof RouteNames)[keyof typeof RouteNames]
