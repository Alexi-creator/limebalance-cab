import { request } from "@api/request"
import { notificationsResponseSchema, unreadCountSchema } from "@appTypes/notification"
import { API_URLS } from "@constants/apiUrls"
import { HttpMethods } from "@constants/httpMethods"

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

/** "Прочитать все" — marks every unread notification read. */
export function markAllNotificationsRead() {
  return request(API_URLS.notifications.readAll, {
    method: HttpMethods.POST,
    schema: unreadCountSchema,
  })
}
