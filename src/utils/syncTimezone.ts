import { updateMe } from "@api/auth"
import type { User } from "@appTypes/user"
import { useAuthStore } from "@store/authStore"
import { getBrowserTimezone } from "@utils/getBrowserTimezone"

/**
 * Тихо синхронизирует таймзону пользователя с текущей зоной браузера. Если зона из /me
 * отличается от `Intl`-зоны — шлёт PATCH /auth/me { timezone } и обновляет пользователя
 * в сторе. Fire-and-forget: ошибки глушим, чтобы не мешать основному потоку.
 */
export function syncTimezone(user: User): void {
  const tz = getBrowserTimezone()
  if (!tz || tz === user.timezone) return

  updateMe({ timezone: tz })
    .then((updated) => useAuthStore.getState().setUser(updated))
    .catch(() => {})
}
