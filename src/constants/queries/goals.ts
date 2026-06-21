export const goalKeys = {
  all: ["goals"] as const,
  contributions: (goalId: string) => ["goals", "contributions", goalId] as const,
}

export const GOALS_STALE_TIME = 60 * 1000
