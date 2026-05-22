import { ApiError } from "@api/apiError"
import { request } from "@api/request"
import type { User } from "@app-types/user"
import { API_URLS } from "@constants/apiUrls"

export interface LoginPayload {
  email: string
  password: string
}

// Публичные эндпоинты — plain fetch, 401 здесь означает неверные данные
export async function login(payload: LoginPayload): Promise<User> {
  const res = await fetch(API_URLS.auth.login, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new ApiError(res.status, data?.message ?? "Login failed")
  }

  return res.json()
}

// Защищённые эндпоинты — через request с авто-рефрешем
export function getMe(): Promise<User> {
  return request<User>(API_URLS.auth.me)
}

export async function logout(): Promise<void> {
  await request(API_URLS.auth.logout, { method: "POST" })
}
