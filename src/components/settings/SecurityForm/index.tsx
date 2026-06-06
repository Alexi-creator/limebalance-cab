import { setCredentials } from "@api/auth"
import { Button, Group, PasswordInput, Stack, TextInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useAuthStore } from "@store/authStore"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"

const emailSchema = z.email()
const MIN_PASSWORD = 8

/**
 * Форма почты и пароля.
 *
 * Если почта уже привязана (пришла с бэка) — поле почты заблокировано. Поля пароля
 * необязательны: заполняются только для смены/задания пароля. Если почты нет (напр.
 * вход через Telegram) — почту можно задать, и тогда пароль обязателен.
 *
 * «Текущий пароль» требуется только если пароль уже задан (`hasPassword`). У входивших
 * через Google/Telegram пароля может не быть — тогда это первичная установка без текущего.
 *
 * Когда пароль задаётся, он должен быть не короче 8 символов и совпадать с подтверждением.
 */
export function SecurityForm() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const hasEmail = !!user?.email
  // есть ли уже пароль; для старых ответов без поля считаем по наличию почты (прежнее поведение)
  const hasPassword = user?.hasPassword ?? hasEmail
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")

  const trimmedEmail = email.trim()
  const emailValid = emailSchema.safeParse(trimmedEmail).success

  // при привязке почты пароль обязателен всегда; при смене — только если начали вводить
  const passwordTouched = password !== "" || confirm !== ""
  const passwordRequired = !hasEmail || passwordTouched
  // текущий пароль нужен только при смене уже заданного пароля
  const currentPasswordRequired = hasPassword && passwordTouched

  // ошибки полей показываем только после ввода, чтобы не подсвечивать пустую форму
  const emailFieldError = !hasEmail && trimmedEmail !== "" && !emailValid
  const passwordFieldError = passwordRequired && password !== "" && password.length < MIN_PASSWORD
  const confirmFieldError = passwordRequired && confirm !== "" && confirm !== password

  const emailOk = hasEmail || emailValid
  const passwordOk = !passwordRequired || (password.length >= MIN_PASSWORD && confirm === password)
  const currentPasswordOk = !currentPasswordRequired || currentPassword !== ""
  // есть что сохранять: либо задаём почту, либо меняем пароль
  const dirty = !hasEmail || passwordTouched
  const canSave = dirty && emailOk && passwordOk && currentPasswordOk

  const mutation = useMutation({
    mutationFn: () =>
      setCredentials({
        // почту шлём только при первичной привязке; текущий пароль — только если он уже задан
        ...(hasEmail ? {} : { email: trimmedEmail }),
        ...(hasPassword ? { currentPassword } : {}),
        password,
      }),
    onSuccess: (updated) => {
      // Мержим, а не заменяем: ответ может прийти частичным и затереть имя/валюту.
      // Если задавали почту — фиксируем её принудительно (server-значение в приоритете,
      // но если ответ её не вернул, берём отправленную), чтобы hasEmail стал true
      // и поле почты заблокировалось. Пароль только что задан → hasPassword: true,
      // чтобы дальше форма требовала текущий пароль и показывала это поле.
      setUser({
        ...user,
        ...updated,
        ...(hasEmail ? {} : { email: updated?.email ?? trimmedEmail }),
        hasPassword: true,
      })
      setEmail("")
      setCurrentPassword("")
      setPassword("")
      setConfirm("")
      notifications.show({ color: "green", message: t("settings.saved") })
    },
    onError: () => {
      notifications.show({ color: "red", message: t("settings.error") })
    },
  })

  return (
    <Stack gap="lg">
      {hasEmail ? (
        <TextInput
          label={t("settings.email_label")}
          description={t("settings.email_description")}
          inputWrapperOrder={["label", "input", "description", "error"]}
          value={user?.email ?? ""}
          readOnly
          disabled
        />
      ) : (
        <TextInput
          type="email"
          label={t("settings.email_label")}
          description={t("settings.email_add_description")}
          inputWrapperOrder={["label", "input", "description", "error"]}
          placeholder={t("settings.email_placeholder")}
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          error={emailFieldError ? t("settings.email_invalid") : undefined}
        />
      )}

      {hasPassword && (
        <PasswordInput
          label={t("settings.password_current_label")}
          placeholder={t("settings.password_current_placeholder")}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.currentTarget.value)}
        />
      )}

      <PasswordInput
        label={t("settings.password_label")}
        description={hasPassword ? undefined : t("settings.password_set_hint")}
        inputWrapperOrder={["label", "input", "description", "error"]}
        placeholder={t("settings.password_placeholder")}
        value={password}
        onChange={(e) => setPassword(e.currentTarget.value)}
        error={
          passwordFieldError ? t("settings.password_too_short", { count: MIN_PASSWORD }) : undefined
        }
      />

      <PasswordInput
        label={t("settings.password_confirm_label")}
        placeholder={t("settings.password_placeholder")}
        value={confirm}
        onChange={(e) => setConfirm(e.currentTarget.value)}
        error={confirmFieldError ? t("settings.password_mismatch") : undefined}
      />

      <Group justify="flex-end">
        <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!canSave}>
          {t("settings.save")}
        </Button>
      </Group>
    </Stack>
  )
}
