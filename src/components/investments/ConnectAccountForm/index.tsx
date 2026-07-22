import { ApiError } from "@api/apiError"
import { connectExchangeAccount } from "@api/investing"
import { HttpStatus } from "@constants/httpStatus"
import { investingKeys } from "@constants/queries/investing"
import { RouteNames } from "@constants/routeNames"
import { Alert, Button, Group, List, Stack, Text, TextInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

interface Props {
  /** Called after a successful connect (e.g. to close the modal). */
  onDone?: () => void
  onCancel?: () => void
}

/**
 * Bybit API-key form. The backend validates the key against the exchange and
 * only accepts read-only keys; both 400 causes are surfaced with a precise message:
 * a rejected key/secret vs a valid key that has trade permissions.
 * 503 → investing is not configured on the server (no ENCRYPTION_KEY).
 */
export function ConnectAccountForm({ onDone, onCancel }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [apiKey, setApiKey] = useState("")
  const [apiSecret, setApiSecret] = useState("")
  const [label, setLabel] = useState("")
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      connectExchangeAccount({
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
        label: label.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investingKeys.accounts })
      notifications.show({ color: "green", message: t("investments.acc_connected") })
      // Always land on the journal after connecting — the sync just started, so it shows
      // its own "syncing" loader there instead of the account list.
      navigate(`${RouteNames.Investments}/journal`, { replace: true })
      onDone?.()
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === HttpStatus.BAD_REQUEST) {
        // The backend distinguishes a bad key from a valid key with trade permissions.
        setError(
          /trade permission/i.test(err.message)
            ? t("investments.acc_key_trade_permissions")
            : t("investments.acc_key_rejected"),
        )
      } else if (err instanceof ApiError && err.status === HttpStatus.SERVICE_UNAVAILABLE) {
        setError(t("investments.acc_not_configured"))
      } else {
        setError(err instanceof Error ? err.message : String(err))
      }
    },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim() || !apiSecret.trim() || !label.trim()) return
    setError(null)
    mutation.mutate()
  }

  return (
    <form onSubmit={submit}>
      <Stack gap="md">
        <List size="sm" type="ordered" spacing={4} c="dimmed">
          <List.Item>{t("investments.acc_howto_step1")}</List.Item>
          <List.Item>{t("investments.acc_howto_step2")}</List.Item>
          <List.Item>{t("investments.acc_howto_step3")}</List.Item>
        </List>
        <Text size="xs" c="dimmed">
          {t("investments.acc_howto_safety")}
        </Text>

        <TextInput
          label={t("investments.acc_api_key")}
          required
          autoFocus
          value={apiKey}
          onChange={(e) => setApiKey(e.currentTarget.value)}
          autoComplete="off"
        />
        <TextInput
          label={t("investments.acc_api_secret")}
          required
          type="password"
          value={apiSecret}
          onChange={(e) => setApiSecret(e.currentTarget.value)}
          autoComplete="off"
        />
        <TextInput
          label={t("investments.acc_label")}
          placeholder={t("investments.acc_label_placeholder")}
          required
          value={label}
          onChange={(e) => setLabel(e.currentTarget.value)}
          maxLength={50}
        />

        {error && (
          <Alert color="red" p="sm">
            {error}
          </Alert>
        )}

        <Group justify="flex-end">
          {onCancel && (
            <Button variant="default" onClick={onCancel} disabled={mutation.isPending}>
              {t("common.cancel")}
            </Button>
          )}
          <Button type="submit" loading={mutation.isPending}>
            {t("investments.acc_connect")}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
