export const RouteNames = {
  Home: "/",
  Auth: "/auth",
  Register: "/register",
  ConfirmEmail: "/confirm-email",
  ForgotPassword: "/forgot-password",
  ResetPassword: "/reset-password",
  Transactions: "/transactions",
  Analytics: "/analytics",
  Goals: "/goals",
  Investments: "/investments",
  // Optional dynamic segment (react-router) — one route match for all tabs, so switching
  // tabs updates the param instead of unmounting/remounting the page.
  InvestmentsTab: "/investments/:tab?",
  Categories: "/categories",
  Settings: "/settings",
  SettingsSecurity: "/settings/security",
  SettingsTelegram: "/settings/telegram",
} as const

export type RouteName = (typeof RouteNames)[keyof typeof RouteNames]
