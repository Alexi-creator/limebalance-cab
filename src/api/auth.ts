import { request } from "@api/request"
import type { User } from "@appTypes/user"
import { userSchema } from "@appTypes/user"
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
  currency?: string
}

// данные пользователя после этих запросов берутся из getMe(), поэтому их ответ не используем
export function register(payload: RegisterPayload): Promise<void> {
  return commonRequest<void>(API_URLS.auth.register, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
  })
}

export function login(payload: LoginPayload): Promise<void> {
  return commonRequest<void>(API_URLS.auth.login, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
  })
}

export function checkAuth(): Promise<User> {
  return request<User>(API_URLS.auth.me, { skipRedirect: true, schema: userSchema })
}

export function getMe(): Promise<User> {
  return request<User>(API_URLS.auth.me, { schema: userSchema })
}

export interface UpdateMePayload {
  name?: string
  /** ISO 4217 код валюты */
  currency?: string
  /** IANA-таймзона, напр. «Europe/Moscow» */
  timezone?: string
}

export function updateMe(payload: UpdateMePayload): Promise<User> {
  return request<User>(API_URLS.auth.me, {
    method: HttpMethods.PATCH,
    body: JSON.stringify(payload),
    schema: userSchema,
  })
}

export interface CredentialsPayload {
  /** почта; передаётся только при первичной привязке, когда её ещё нет */
  email?: string
  /** новый пароль */
  password: string
  /** текущий пароль; требуется при смене пароля, когда почта уже привязана */
  currentPassword?: string
}

// задать почту+пароль (если почты нет) или сменить пароль (если почта уже привязана)
export function setCredentials(payload: CredentialsPayload): Promise<User> {
  return request<User>(API_URLS.auth.credentials, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
    schema: userSchema,
  })
}

export async function logout(): Promise<void> {
  await request(API_URLS.auth.logout, { method: HttpMethods.POST })
}

export function loginTelegram(data: TelegramAuthData): Promise<void> {
  return commonRequest<void>(API_URLS.auth.telegram, {
    method: HttpMethods.POST,
    body: JSON.stringify(data),
  })
}

/**
 * Привязать Telegram к текущему (уже авторизованному) аккаунту — для тех, кто
 * регистрировался в ЛК. Идёт через `request` (с авторизацией/refresh). Актуального
 * пользователя после привязки берём из `getMe()`.
 */
export function linkTelegram(data: TelegramAuthData): Promise<void> {
  return request(API_URLS.auth.linkTelegram, {
    method: HttpMethods.POST,
    body: JSON.stringify(data),
  })
}

export function loginGoogle(credential: string): Promise<void> {
  return commonRequest<void>(API_URLS.auth.google, {
    method: HttpMethods.POST,
    body: JSON.stringify({ credential }),
  })
}
