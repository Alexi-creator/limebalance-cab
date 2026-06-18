import { API_URLS } from "@constants/apiUrls"
import { HttpMethods } from "@constants/httpMethods"
import { HttpStatus } from "@constants/httpStatus"
import { useAuthStore } from "@store/authStore"
import type { RequestOptions } from "@utils/commonRequest"
import { commonRequest } from "@utils/commonRequest"
import { ApiError } from "./apiError"
import { queryClient } from "./queryClient"
import { getStub, STUBS_ENABLED } from "./stubs"

let pendingRefresh: Promise<boolean> | null = null

async function refreshTokens(): Promise<boolean> {
  if (!pendingRefresh) {
    pendingRefresh = commonRequest(API_URLS.auth.refresh, { method: HttpMethods.POST })
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        pendingRefresh = null
      })
  }
  return pendingRefresh
}

function redirectToLogin(): void {
  useAuthStore.getState().setUser(null)
  // сессия протухла — выкидываем кеш, чтобы вход под другим аккаунтом не показал чужие данные
  queryClient.clear()
}

export async function request<T>(
  url: string,
  options: RequestOptions<T> & { skipRedirect?: boolean } = {},
): Promise<T> {
  if (STUBS_ENABLED) {
    const stub = getStub(url, options.method ?? "GET")
    if (stub !== undefined) {
      return options.schema ? options.schema.parse(stub) : (stub as T)
    }
  }

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
