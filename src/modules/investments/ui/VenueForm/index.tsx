import { Alert, Button, Group, Stack, Switch, Text, TextInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useModalStore } from "@/shared/store/modalStore"
import { useDeleteVenue } from "../../api/useDeleteVenue"
import { useSaveVenue } from "../../api/useSaveVenue"
import type { Venue } from "../../model"

interface Props {
  /** Existing venue — the form renames or archives it instead of creating one. */
  venue?: Venue
}

/**
 * Add or edit a place kept by hand: a cold wallet, an exchange with no API key.
 *
 * A connected exchange's venue is created by the sync and cannot be renamed away from the account
 * it mirrors, so for those this form only offers archiving.
 */
export function VenueForm({ venue }: Props) {
  const { t } = useTranslation()
  const close = useModalStore((s) => s.close)
  const [name, setName] = useState(venue?.name ?? "")
  const [archived, setArchived] = useState(venue?.archived ?? false)
  const [error, setError] = useState<string | null>(null)

  const isConnected = !!venue?.accountId

  const save = useSaveVenue({
    venueId: venue?.id,
    onSuccess: () => {
      notifications.show({ color: "green", message: t("investments.venue_saved") })
      close()
    },
    onError: (err) => setError(err.message),
  })

  const remove = useDeleteVenue({
    onSuccess: () => {
      notifications.show({ color: "green", message: t("investments.venue_deleted") })
      close()
    },
    // 400 here means the venue still has transfers — show the backend's own explanation.
    onError: (err) => setError(err.message),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    save.mutate(venue ? { name: trimmed, archived } : { name: trimmed })
  }

  return (
    <form onSubmit={submit}>
      <Stack gap="md">
        <TextInput
          label={t("investments.venue_name")}
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          maxLength={60}
          disabled={isConnected}
          description={isConnected ? t("investments.venue_name_locked") : undefined}
          placeholder={t("investments.venue_name_placeholder")}
        />

        {venue && (
          <Switch
            label={t("investments.venue_archived")}
            description={t("investments.venue_archived_hint")}
            checked={archived}
            onChange={(e) => setArchived(e.currentTarget.checked)}
          />
        )}

        {error && (
          <Alert color="red" variant="light" p="sm">
            <Text size="xs">{error}</Text>
          </Alert>
        )}

        <Group justify="space-between">
          {venue && !isConnected ? (
            <Button
              variant="subtle"
              color="red"
              loading={remove.isPending}
              onClick={() => remove.mutate(venue.id)}
            >
              {t("common.delete")}
            </Button>
          ) : (
            <span />
          )}
          <Group gap="xs">
            <Button variant="default" onClick={close} disabled={save.isPending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={save.isPending} disabled={!name.trim()}>
              {t("common.save")}
            </Button>
          </Group>
        </Group>
      </Stack>
    </form>
  )
}
