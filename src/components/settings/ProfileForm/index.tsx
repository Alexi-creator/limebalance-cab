import { updateMe } from "@api/auth"
import { expenseKeys } from "@constants/queries/expenses"
import { incomeKeys } from "@constants/queries/incomes"
import { CURRENCY_OPTIONS } from "@constants/regionToCurrency"
import { Button, Group, Select, Stack, TextInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useAuthStore } from "@store/authStore"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"

/**
 * General settings form: name and currency. Initial values come from the user's data,
 * currency options — codes from regionToCurrency.
 * We save via PATCH /auth/me and update the user in the store with the server response.
 * Email and password are moved to a separate tab (SecurityForm).
 */
export function ProfileForm() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const queryClient = useQueryClient()

  const initialName = user?.name ?? ""
  const initialCurrency = user?.currency ?? ""
  const [name, setName] = useState(initialName)
  const [currency, setCurrency] = useState(initialCurrency)

  const mutation = useMutation({
    mutationFn: () => updateMe({ name: name.trim(), currency }),
    onSuccess: (updated) => {
      setUser(updated)
      // currency affects amount recalculation in category stats — we update it on change
      if (currency !== initialCurrency) {
        queryClient.invalidateQueries({ queryKey: expenseKeys.categoriesStats })
        queryClient.invalidateQueries({ queryKey: incomeKeys.categoriesStats })
      }
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
        // the label in the theme is "floating" (absolute) and removed from flow — without moving it the description
        // would take its place and overlap; so we render the hint under the field
        inputWrapperOrder={["label", "input", "description", "error"]}
        placeholder={t("settings.currency_placeholder")}
        data={CURRENCY_OPTIONS}
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
