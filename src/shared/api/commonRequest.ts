import type { ZodType } from "zod/v4"
import { z } from "zod/v4"
import { ApiError } from "@/shared/api/apiError"
import { SchemaError } from "@/shared/api/schemaError"
import type { HttpMethod } from "./httpMethods"
import { HttpMethods } from "./httpMethods"

export interface RequestOptions<T = unknown> {
  method?: HttpMethod
  body?: string
  credentials?: RequestCredentials
  fetchController?: AbortController
  schema?: ZodType<T>
}

export async function commonRequest<T>(url: string, options: RequestOptions<T> = {}): Promise<T> {
  const method = options.method ?? HttpMethods.GET

  const response = await fetch(url, {
    method,
    credentials: options.credentials ?? "include",
    headers: options.body ? { "Content-Type": "application/json" } : {},
    body: options.body,
    signal: options.fetchController?.signal,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new ApiError(response.status, data?.message ?? `HTTP error ${response.status}`, data)
  }

  // Some endpoints answer 200 with an empty body (e.g. PATCH /notifications/preferences/:type) —
  // response.json() throws on an empty string, so read as text first and only parse if non-empty.
  const text = await response.text()
  const data = text ? JSON.parse(text) : undefined

  if (options.schema) {
    const result = options.schema.safeParse(data)
    if (!result.success) {
      // Contract drift between frontend and backend — a bug, not an auth/network failure.
      // Surface it loudly instead of letting it masquerade as "logged out".
      console.error(`Invalid response for ${url}:\n${z.prettifyError(result.error)}`)
      throw new SchemaError(url, result.error)
    }
    return result.data
  }

  return data as T
}
