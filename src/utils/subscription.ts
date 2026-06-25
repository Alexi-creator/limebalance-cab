import type { LimitUsage } from "@appTypes/usage"
import type { User } from "@appTypes/user"

/**
 * Whether the user may open the Investments section.
 * Driven by the plan's `investingAccess` flag — the free plan has it off,
 * any plan that unlocks the investing / crypto section has it on.
 */
export function hasInvestmentsAccess(user: User | null): boolean {
  return user?.subscription?.plan.investingAccess ?? false
}

/** At or below this many remaining we nudge the user toward upgrading (soft warning). */
const SOFT_WARNING_THRESHOLD = 2

/**
 * How close the user is to a plan limit:
 * - `unlimited` — paid plan, no cap (`remaining`/`limit` are null) → never warn or block;
 * - `ok` — comfortably under the limit;
 * - `soft` — 1–2 left → gentle "almost out" hint;
 * - `blocked` — nothing left (`remaining <= 0`) → block creation.
 */
export type LimitLevel = "unlimited" | "ok" | "soft" | "blocked"

export function limitLevel(usage: LimitUsage | undefined): LimitLevel {
  if (!usage || usage.remaining === null) return "unlimited"
  if (usage.remaining <= 0) return "blocked"
  if (usage.remaining <= SOFT_WARNING_THRESHOLD) return "soft"
  return "ok"
}

/** Creation must be prevented — the limit is reached (never true on unlimited plans). */
export function isLimitBlocked(usage: LimitUsage | undefined): boolean {
  return limitLevel(usage) === "blocked"
}

/**
 * Progress toward the limit as a 0–100 percentage, clamped to 100.
 * After a downgrade `used` can exceed `limit` (e.g. 7/5) — clamping keeps the bar full, not overflowing.
 * Returns 0 on unlimited plans (`limit === null`), where a progress bar is meaningless.
 */
export function usagePercent(usage: LimitUsage | undefined): number {
  if (!usage || usage.limit === null || usage.limit <= 0) return 0
  return Math.min(100, Math.round((usage.used / usage.limit) * 100))
}
