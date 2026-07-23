export const notificationKeys = {
  all: ["notifications"] as const,
  preferences: ["notifications", "preferences"] as const,
}

/**
 * The bell recomputes the month summary on the server each fetch, which is expensive, so we avoid
 * polling it. Fresh data is pulled on demand by invalidating `notificationKeys.all` whenever goal
 * data changes (a contribution or a goal closing). Time-wise we let it go stale only twice a day,
 * so background refetches (mount / window focus) hit the server at most once per half-day.
 */
export const NOTIFICATIONS_STALE_TIME = 12 * 60 * 60 * 1000
