export class ApiError extends Error {
  status: number
  /**
   * The error body as it arrived. `message` alone is an English sentence written for a log; a
   * backend that names its refusal machine-readably (a code, counts, limits) sends it here, and
   * that is what lets the UI explain the refusal in the user's language and offer a way out of it.
   */
  body: unknown

  constructor(status: number, message: string, body: unknown = null) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}
