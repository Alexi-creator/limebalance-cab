import { API_URLS } from "@constants/apiUrls"
import { HttpMethods } from "@constants/httpMethods"
import { HttpStatus } from "@constants/httpStatus"
import { RouteNames } from "@constants/routeNames"
import { useAuthStore } from "@store/authStore"
import type { RequestOptions } from "@utils/commonRequest"
import { commonRequest } from "@utils/commonRequest"
import { ApiError } from "./apiError"

async function refreshTokens(): Promise<boolean> {
  try {
    await commonRequest(API_URLS.auth.refresh, { method: HttpMethods.POST })
    return true
  } catch {
    return false
  }
}

function redirectToLogin(): void {
  useAuthStore.getState().setUser(null)
  window.location.href = RouteNames.Auth
}

export async function request<T>(
  url: string,
  options: RequestOptions<T> & { skipRedirect?: boolean } = {},
): Promise<T> {
  try {
    return await commonRequest(url, options)
  } catch (err) {
    if (err instanceof ApiError && err.status === HttpStatus.UNAUTHORIZED) {
      const refreshed = await refreshTokens()

      if (refreshed) {
        return commonRequest(url, options)
      }

      if (!options.skipRedirect) {
        redirectToLogin()
      }
    }

    throw err
  }
}
