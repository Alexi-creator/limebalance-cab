import { request } from "@api/request"
import type { User } from "@appTypes/user"
import { API_URLS } from "@constants/apiUrls"
import { HttpMethods } from "@constants/httpMethods"
import { commonRequest } from "@utils/commonRequest"

export interface LoginPayload {
  email: string
  password: string
}

export function login(payload: LoginPayload): Promise<User> {
  return commonRequest<User>(API_URLS.auth.login, {
    method: HttpMethods.POST,
    body: JSON.stringify(payload),
  })
}

export function getMe(): Promise<User> {
  return request<User>(API_URLS.auth.me)
}

export async function logout(): Promise<void> {
  await request(API_URLS.auth.logout, { method: HttpMethods.POST })
}
