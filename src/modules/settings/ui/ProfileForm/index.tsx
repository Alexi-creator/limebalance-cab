import { Button, Group, Stack, TextInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/modules/auth/hooks/useAuthStore"
import { CurrencySelect } from "@/shared/ui/CurrencySelect"
import { useSaveProfile } from "../../api/useSaveProfile"

/**
 * General settings form: name and currency. Initial values come from the user's data,
 * currency options — codes from regionToCurrency, rendered by CurrencySelect.
 * We save via PATCH /auth/me and update the user in the store with the server response.
 * Email and password are moved to a separate tab (SecurityForm).
 */
export function ProfileForm() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)

  const initialName = user?.name ?? ""
  const initialCurrency = user?.currency ?? ""
  const [name, setName] = useState(initialName)
  const [currency, setCurrency] = useState(initialCurrency)

  const mutation = useSaveProfile({
    previousCurrency: initialCurrency,
    onSuccess: () => notifications.show({ color: "green", message: t("settings.saved") }),
    onError: () => notifications.show({ color: "red", message: t("settings.error") }),
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

      <CurrencySelect
        label={t("settings.currency_label")}
        description={t("settings.currency_description")}
        // the label in the theme is "floating" (absolute) and removed from flow — without moving it the description
        // would take its place and overlap; so we render the hint under the field
        inputWrapperOrder={["label", "input", "description", "error"]}
        placeholder={t("settings.currency_placeholder")}
        value={currency || null}
        onChange={(v) => setCurrency(v ?? "")}
        // the field spans the form here, so the dropdown follows it instead of the narrower default
        comboboxProps={{ width: "target" }}
        nothingFoundMessage={t("settings.currency_not_found")}
      />

      <Group justify="flex-end">
        <Button
          onClick={() => mutation.mutate({ name: name.trim(), currency })}
          loading={mutation.isPending}
          disabled={!canSave}
        >
          {t("settings.save")}
        </Button>
      </Group>
    </Stack>
  )
}
