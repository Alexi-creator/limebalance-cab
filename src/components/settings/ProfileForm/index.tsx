import { updateMe } from "@api/auth"
import { CURRENCY_CODES } from "@constants/regionToCurrency"
import { Button, Group, Select, Stack, TextInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useAuthStore } from "@store/authStore"
import { useMutation } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

/**
 * Форма профиля пользователя: имя и валюта. Инит-значения берём из данных пользователя,
 * опции валют — уникальные коды из regionToCurrency с локализованным названием.
 * Сохраняем через PATCH /auth/me и обновляем пользователя в сторе ответом сервера.
 */
export function ProfileForm() {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const initialName = user?.name ?? ""
  const initialCurrency = user?.currency ?? ""
  const [name, setName] = useState(initialName)
  const [currency, setCurrency] = useState(initialCurrency)

  // коды валют + локализованные названия (например «USD — доллар США»)
  const options = useMemo(() => {
    const names = new Intl.DisplayNames(i18n.language, { type: "currency" })
    return CURRENCY_CODES.map((code) => ({ value: code, label: `${code} — ${names.of(code)}` }))
  }, [i18n.language])

  const mutation = useMutation({
    mutationFn: () => updateMe({ name: name.trim(), currency }),
    onSuccess: (updated) => {
      setUser(updated)
      notifications.show({ color: "green", message: t("settings.saved") })
    },
    onError: () => {
      notifications.show({ color: "red", message: t("settings.error") })
    },
  })

  const changed = name.trim() !== initialName || currency !== initialCurrency
  const canSave = changed && !!currency

  return (
    <Stack gap="lg">
      <TextInput
        label={t("settings.name_label")}
        placeholder={t("settings.name_placeholder")}
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
      />

      <Select
        label={t("settings.currency_label")}
        description={t("settings.currency_description")}
        // лейбл в теме «плавающий» (absolute) и убран из потока — без переноса description
        // встал бы на его место и наложился; поэтому рендерим подсказку под полем
        inputWrapperOrder={["label", "input", "description", "error"]}
        placeholder={t("settings.currency_placeholder")}
        data={options}
        value={currency || null}
        onChange={(v) => setCurrency(v ?? "")}
        searchable
        allowDeselect={false}
        nothingFoundMessage={t("settings.currency_not_found")}
      />

      <Group justify="flex-end">
        <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!canSave}>
          {t("settings.save")}
        </Button>
      </Group>
    </Stack>
  )
}
