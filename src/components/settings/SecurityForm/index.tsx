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
 * Email and password form.
 *
 * If the email is already linked (came from the backend) — the email field is locked. Password fields
 * are optional: filled only to change/set the password. If there is no email (e.g.
 * login via Telegram) — the email can be set, and then the password is required.
 *
 * "Current password" is required only if a password is already set (`hasPassword`). Users who signed in
 * via Google/Telegram may not have one — then it is an initial setup without a current password.
 *
 * When a password is set, it must be at least 8 characters and match the confirmation.
 */
export function SecurityForm() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const hasEmail = !!user?.email
  // whether a password already exists; for old responses without the field, infer from email presence (previous behavior)
  const hasPassword = user?.hasPassword ?? hasEmail
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")

  const trimmedEmail = email.trim()
  const emailValid = emailSchema.safeParse(trimmedEmail).success

  // when linking an email the password is always required; when changing — only if input has started
  const passwordTouched = password !== "" || confirm !== ""
  const passwordRequired = !hasEmail || passwordTouched
  // the current password is needed only when changing an already set password
  const currentPasswordRequired = hasPassword && passwordTouched

  // we show field errors only after input, so an empty form is not highlighted
  const emailFieldError = !hasEmail && trimmedEmail !== "" && !emailValid
  const passwordFieldError = passwordRequired && password !== "" && password.length < MIN_PASSWORD
  const confirmFieldError = passwordRequired && confirm !== "" && confirm !== password

  const emailOk = hasEmail || emailValid
  const passwordOk = !passwordRequired || (password.length >= MIN_PASSWORD && confirm === password)
  const currentPasswordOk = !currentPasswordRequired || currentPassword !== ""
  // there is something to save: either set the email or change the password
  const dirty = !hasEmail || passwordTouched
  const canSave = dirty && emailOk && passwordOk && currentPasswordOk

  const mutation = useMutation({
    mutationFn: () =>
      setCredentials({
        // send the email only on initial linking; the current password — only if it is already set
        ...(hasEmail ? {} : { email: trimmedEmail }),
        ...(hasPassword ? { currentPassword } : {}),
        password,
      }),
    onSuccess: (updated) => {
      // Merge, do not replace: the response may be partial and wipe the name/currency.
      // If we set the email — force it (the server value takes priority,
      // but if the response did not return it, use the sent one) so hasEmail becomes true
      // and the email field gets locked. The password was just set → hasPassword: true,
      // so the form then requires the current password and shows that field.
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
