import { ApiError } from "@api/apiError"
import type { HttpMethod } from "@constants/httpMethods"
import { HttpMethods } from "@constants/httpMethods"
import type { ZodType } from "zod/v4"

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
    headers: method === HttpMethods.GET ? {} : { "Content-Type": "application/json" },
    body: options.body,
    signal: options.fetchController?.signal,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new ApiError(response.status, data?.message ?? `HTTP error ${response.status}`)
  }

  const data = await response.json()

  if (options.schema) {
    return options.schema.parse(data)
  }

  return data as T
}
