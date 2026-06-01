import { format } from "date-fns"

/**
 * Собирает ISO-таймстамп для бэкенда из выбранного дня (`"YYYY-MM-DD"`) и текущего
 * локального времени пользователя.
 *
 * Возвращается **локальное** время без таймзоны (без суффикса `Z`), то есть ровно те
 * дата и время, что у пользователя на часах — без перевода в UTC и без подгонки.
 */
export function localDayToApiDate(day: string): string {
  const now = new Date()
  const [year, month, date] = day.split("-").map(Number)
  const local = new Date(year, month - 1, date, now.getHours(), now.getMinutes(), now.getSeconds())
  return format(local, "yyyy-MM-dd'T'HH:mm:ss")
}
