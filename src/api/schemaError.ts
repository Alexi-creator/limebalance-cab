import type { ZodError } from "zod/v4"

/**
 * A server response did not match its expected schema — i.e. the frontend/backend contract drifted.
 * This is a bug, NOT an auth/network failure, so it is a distinct type: it must surface loudly
 * (logged in dev, reported in prod) and never be reinterpreted as "logged out".
 */
export class SchemaError extends Error {
  url: string
  cause: ZodError

  constructor(url: string, cause: ZodError) {
    super(`Invalid response for ${url}`)
    this.name = "SchemaError"
    this.url = url
    this.cause = cause
  }
}
