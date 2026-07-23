import { request } from "@api/request"
import { botNotificationPreferenceSchema } from "@appTypes/botNotificationPreference"
import { notificationsResponseSchema, unreadCountSchema } from "@appTypes/notification"
import { API_URLS } from "@constants/apiUrls"
import { HttpMethods } from "@constants/httpMethods"
import { z } from "zod"

/**
 * Notifications for the bell dropdown. The backend recomputes the current-month summary from the
 * latest income/expenses on each call, so this also pulls in recent changes.
 */
export function getNotifications() {
  return request(API_URLS.notifications.notifications, { schema: notificationsResponseSchema })
}

/** Persists the read state of one notification and returns the updated unread count. */
export function markNotificationRead(id: string) {
  return request(`${API_URLS.notifications.notifications}/${id}/read`, {
    method: HttpMethods.POST,
    schema: unreadCountSchema,
  })
}

/** "Mark all as read" — marks every unread notification read. */
export function markAllNotificationsRead() {
  return request(API_URLS.notifications.readAll, {
    method: HttpMethods.POST,
    schema: unreadCountSchema,
  })
}

/** Per-type opt-in/out for proactive Telegram bot pushes. Types not in the response default to enabled. */
export function getBotNotificationPreferences() {
  return request(API_URLS.notifications.preferences, {
    schema: z.array(botNotificationPreferenceSchema),
  })
}

export function setBotNotificationPreference(type: string, enabled: boolean) {
  return request(`${API_URLS.notifications.preferences}/${type}`, {
    method: HttpMethods.PATCH,
    body: JSON.stringify({ enabled }),
  })
}
