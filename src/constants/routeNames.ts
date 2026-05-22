export const RouteNames = {
  Home: "/",
  Auth: "/auth",
} as const

export type RouteName = (typeof RouteNames)[keyof typeof RouteNames]
