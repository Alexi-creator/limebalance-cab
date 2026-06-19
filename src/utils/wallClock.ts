import { z } from "zod"

/**
 * The `date` field comes as a UTC timestamp (`...Z`), but its components are the "wall-clock"
 * local time of the user: the backend stores the transaction date in `timestamp without time zone`
 * and serializes it as UTC. We move the UTC components into the browser's local date so date-fns
 * formats exactly the date/time on the user's clock, without a timezone shift.
 */
export function utcPartsToLocal(date: Date): Date {
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  )
}

/** Zod field for the transaction date: parses a UTC timestamp and normalizes it to "wall-clock" time. */
export const wallClockDate = () => z.coerce.date().transform(utcPartsToLocal)
