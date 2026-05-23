export const RouteNames = {
  Home: "/",
  Auth: "/auth",
  Register: "/register",
} as const

export type RouteName = (typeof RouteNames)[keyof typeof RouteNames]
