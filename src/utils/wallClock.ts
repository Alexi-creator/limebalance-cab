import { z } from "zod"

/**
 * Поле `date` приходит как UTC-таймстамп (`...Z`), но его компоненты — это «настенное»
 * локальное время пользователя: бэкенд хранит дату операции в `timestamp without time zone`
 * и сериализует как UTC. Переносим UTC-компоненты в локальную дату браузера, чтобы date-fns
 * форматировал ровно ту дату/время, что у пользователя на часах, без сдвига на таймзону.
 */
export function utcPartsToLocal(date: Date): Date {
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  )
}

/** Zod-поле для даты операции: парсит UTC-таймстамп и нормализует в «настенное» время. */
export const wallClockDate = () => z.coerce.date().transform(utcPartsToLocal)
