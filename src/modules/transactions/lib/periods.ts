import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns"

/** Monday, as everywhere else in the app — see WEEK_OPTS in analytics/lib/helpers. */
const WEEK_OPTS = { weekStartsOn: 1 as const }

/** Ready-made ranges offered in the period filter, in the order they are listed. */
export const PERIOD_PRESETS = [
  "this_week",
  "last_week",
  "this_month",
  "last_month",
  "last_30_days",
  "this_year",
] as const

export type PeriodPreset = (typeof PERIOD_PRESETS)[number]

/** `all` — no date filter at all; `custom` — the two dates come from the datepicker. */
export type PeriodValue = PeriodPreset | "all" | "custom"

export const PERIOD_VALUES = ["all", ...PERIOD_PRESETS, "custom"] as const

const iso = (date: Date) => format(date, "yyyy-MM-dd")

/**
 * The `from`/`to` a preset stands for, as the `YYYY-MM-DD` the API expects. Presets cover whole
 * calendar intervals ("this month" runs to the last day of the month, not to today) — a filter is
 * read as a span, not as a running total.
 */
export function presetRange(
  preset: PeriodPreset,
  now: Date = new Date(),
): { from: string; to: string } {
  switch (preset) {
    case "this_week":
      return { from: iso(startOfWeek(now, WEEK_OPTS)), to: iso(endOfWeek(now, WEEK_OPTS)) }
    case "last_week": {
      const prev = subWeeks(now, 1)
      return { from: iso(startOfWeek(prev, WEEK_OPTS)), to: iso(endOfWeek(prev, WEEK_OPTS)) }
    }
    case "this_month":
      return { from: iso(startOfMonth(now)), to: iso(endOfMonth(now)) }
    case "last_month": {
      const prev = subMonths(now, 1)
      return { from: iso(startOfMonth(prev)), to: iso(endOfMonth(prev)) }
    }
    case "last_30_days":
      // 30 days counting today, so the span is today minus 29
      return { from: iso(subDays(now, 29)), to: iso(now) }
    case "this_year":
      return { from: iso(startOfYear(now)), to: iso(endOfYear(now)) }
  }
}

/**
 * Which option the filter should show. `period` is what the user picked, but links made before it
 * existed (and hand-edited ones) carry only `from`/`to` — those read as a custom range.
 */
export function resolvePeriod(
  period: PeriodValue,
  from: string | undefined,
  to: string | undefined,
): PeriodValue {
  if (period === "all" && (from || to)) return "custom"
  return period
}
