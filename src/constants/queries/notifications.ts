export const notificationKeys = {
  all: ["notifications"] as const,
}

/** The bell recomputes the month summary on the server each fetch, so keep it briefly fresh. */
export const NOTIFICATIONS_STALE_TIME = 60 * 1000
