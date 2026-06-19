/**
 * Categories rarely change — we load them once per session and do not refetch.
 * Refresh manually by invalidating the categories key when they change.
 */
export const CATEGORY_STALE_TIME = Number.POSITIVE_INFINITY
