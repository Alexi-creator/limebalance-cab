export const subscriptionKeys = {
  usage: ["subscriptions", "usage"] as const,
}

/**
 * Usage counters change only when the user creates a category/transaction, and we invalidate
 * the key explicitly on each such success — so a short stale time is enough to avoid redundant
 * refetches on remounts/focus while the counter still reacts to creations.
 */
export const USAGE_STALE_TIME = 60 * 1000
