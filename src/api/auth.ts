import { request } from "@api/request"
import type { User } from "@appTypes/user"
import { API_URLS } from "@constants/apiUrls"
import { HttpMethods } from "@constants/httpMethods"
import type { TelegramAuthData } from "@telegram-auth/react"
import { commonRequest } from "@utils/commonRequest"

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
}

export function register(payload: RegisterPayload): Promise<User> {
  return commonRequest<User>(API_URLS.auth.register, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
  })
}

export function login(payload: LoginPayload): Promise<User> {
  return commonRequest<User>(API_URLS.auth.login, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
  })
}

export function checkAuth(): Promise<User> {
  return request<User>(API_URLS.auth.me, { skipRedirect: true })
}

export function getMe(): Promise<User> {
  return request<User>(API_URLS.auth.me)
}

export async function logout(): Promise<void> {
  await request(API_URLS.auth.logout, { method: HttpMethods.POST })
}

export function loginTelegram(data: TelegramAuthData): Promise<User> {
  return commonRequest<User>(API_URLS.auth.telegram, {
    method: HttpMethods.POST,
    body: JSON.stringify(data),
  })
}

export function loginGoogle(credential: string): Promise<User> {
  return commonRequest<User>(API_URLS.auth.google, {
    method: HttpMethods.POST,
    body: JSON.stringify({ credential }),
  })
}
