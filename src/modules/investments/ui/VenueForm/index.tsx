import { Alert, Button, Group, Stack, Switch, Text, TextInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useModalStore } from "@/shared/store/modalStore"
import { useDeleteVenue } from "../../api/useDeleteVenue"
import { useSaveVenue } from "../../api/useSaveVenue"
import type { Venue, VenueBlockers } from "../../model"
import { venueBlockersOf } from "../../model"
import { TransferForm } from "../TransferForm"

interface Props {
  /** Existing venue — the form renames or archives it instead of creating one. */
  venue?: Venue
  /** Opened from the card's delete icon: the form arrives already asking for confirmation. */
  intent?: "delete"
}

/**
 * Add or edit a place kept by hand: a cold wallet, an exchange with no API key.
 *
 * A connected exchange's venue is created by the sync and cannot be renamed away from the account
 * it mirrors, so for those this form only offers archiving.
 *
 * Deleting is the delicate part. It is offered for a card made by mistake and nothing else: the
 * backend refuses while anything is recorded against the venue, because dropping the card would
 * not move the money anywhere — it would only stop counting it. So a refusal is not shown as a
 * dead end here, it is shown with the two things that actually do move money out.
 */
export function VenueForm({ venue, intent }: Props) {
  const { t } = useTranslation()
  const close = useModalStore((s) => s.close)
  const open = useModalStore((s) => s.open)
  const [name, setName] = useState(venue?.name ?? "")
  const [archived, setArchived] = useState(venue?.archived ?? false)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(intent === "delete")
  const [blocked, setBlocked] = useState<VenueBlockers | null>(null)

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
    onError: (err) => {
      setConfirming(false)
      // A refusal because the venue is not empty is a different thing from a failure: it comes
      // with what is inside, so it is answered with a way out rather than with a red sentence.
      const blockers = venueBlockersOf(err)
      if (blockers) setBlocked(blockers)
      else setError(err.message)
    },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    save.mutate(venue ? { name: trimmed, archived } : { name: trimmed })
  }

  const withdraw = () =>
    open({
      centered: true,
      title: t("investments.tr_withdraw_title"),
      children: <TransferForm initialMode="withdraw" defaultVenue={venue} />,
    })

  const blockerList = blocked
    ? (
        [
          [blocked.transfers, "investments.venue_blocker_transfers"],
          [blocked.holdings, "investments.venue_blocker_coins"],
          [blocked.adjustments, "investments.venue_blocker_adjustments"],
        ] as const
      )
        .filter(([count]) => count > 0)
        // `n`, not `count`: i18next reads `count` as a plural selector and would go looking for
        // key_one / key_few variants that these labels deliberately do not have.
        .map(([count, key]) => t(key, { n: count }))
        .join(", ")
    : ""

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

        {venue && blocked && (
          <Alert color="yellow" variant="light" p="sm">
            <Text size="xs">{t("investments.venue_delete_blocked", { list: blockerList })}</Text>
            <Group gap="xs" mt="xs">
              <Button size="compact-xs" variant="light" onClick={withdraw}>
                {t("investments.tr_withdraw")}
              </Button>
              <Button
                size="compact-xs"
                variant="light"
                loading={save.isPending}
                onClick={() => save.mutate({ name: venue.name, archived: true })}
              >
                {t("investments.venue_archive_now")}
              </Button>
            </Group>
          </Alert>
        )}

        <Group justify="space-between">
          {venue && !isConnected ? (
            <Button
              variant="subtle"
              color="red"
              loading={remove.isPending}
              disabled={!!blocked}
              onClick={() => {
                // Two steps: a venue is deleted for good, and the button sits next to Save.
                if (confirming) remove.mutate(venue.id)
                else setConfirming(true)
              }}
            >
              {confirming ? t("investments.venue_delete_confirm") : t("common.delete")}
            </Button>
          ) : (
            <span />
          )}
          <Group gap="xs">
            <Button
              variant="default"
              onClick={() => (confirming ? setConfirming(false) : close())}
              disabled={save.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={save.isPending} disabled={!name.trim() || confirming}>
              {t("common.save")}
            </Button>
          </Group>
        </Group>
      </Stack>
    </form>
  )
}
