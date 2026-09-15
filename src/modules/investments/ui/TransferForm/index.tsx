import {
  Box,
  Button,
  Group,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Textarea,
} from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { notifications } from "@mantine/notifications"
import { format } from "date-fns"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/modules/auth/hooks/useAuthStore"
import { useBalance } from "@/modules/transactions/api/useBalance"
import { formatCurrency } from "@/shared/lib/formatCurrency"
import { useModalStore } from "@/shared/store/modalStore"
import { CurrencySelect } from "@/shared/ui/CurrencySelect"
import { useAssets } from "../../api/useAssets"
import { useSaveTransfer } from "../../api/useSaveTransfer"
import { useVenues } from "../../api/useVenues"
import type { Transfer, TransferPeer, Venue } from "../../model"

interface Props {
  /** Which direction the form opens on. */
  initialMode?: "deposit" | "withdraw"
  /** Venue preselected from the card the user pressed. */
  defaultVenue?: Venue
  /** Existing transfer — the form edits it instead of recording a new one. */
  transfer?: Transfer
}

/**
 * Money going to a place you invest from, or leaving it.
 *
 * The form asks two things that decide everything else: which way the money moves, and who is on
 * the other side. Only the balance side touches your free money — moving coins to your own wallet
 * changes nothing you own, and sending them to someone else is gone for good. Mixing those three
 * up is what would make trading results lie, so they are a visible choice rather than a guess.
 *
 * Editing never moves a transfer to another venue: that is a different event, not an edit.
 */
export function TransferForm({ initialMode = "deposit", defaultVenue, transfer }: Props) {
  const { t, i18n } = useTranslation()
  const close = useModalStore((s) => s.close)
  const userCurrency = useAuthStore((s) => s.user?.currency)
  const balanceQuery = useBalance()
  const venues = useVenues().data?.items ?? []
  const allAssets = useAssets()

  const [venueId, setVenueId] = useState<string | null>(
    transfer?.venueId ?? defaultVenue?.id ?? venues[0]?.id ?? null,
  )
  const [mode, setMode] = useState<"deposit" | "withdraw">(
    transfer ? (transfer.direction === "IN" ? "deposit" : "withdraw") : initialMode,
  )
  const [peer, setPeer] = useState<TransferPeer>(transfer?.peer ?? "LEDGER")
  const [peerVenueId, setPeerVenueId] = useState<string | null>(transfer?.peerVenueId ?? null)
  const [amount, setAmount] = useState<number | string>(transfer?.amount ?? "")
  const [currency, setCurrency] = useState<string | null>(
    transfer?.currency ?? userCurrency ?? "USD",
  )
  const [asset, setAsset] = useState<string | null>(transfer?.asset ?? null)
  const [note, setNote] = useState(transfer?.note ?? "")
  const [day, setDay] = useState<string | null>(format(transfer?.date ?? new Date(), "yyyy-MM-dd"))

  const venue = venues.find((v) => v.id === venueId)
  // Only coins the source actually holds are offered, falling back to every priceable ticker when
  // the venue's contents are unknown — picking from what is there beats typing a ticker blind.
  const sourceVenue = mode === "withdraw" ? venue : venues.find((v) => v.id === peerVenueId)
  const sourceCoins = sourceVenue?.coins ?? []
  const assetOptions =
    sourceCoins.length > 0 ? sourceCoins.map((c) => c.coin) : (allAssets.data ?? [])
  // Rough preview of what the quantity is worth, from the venue's own snapshot. The backend prices
  // the move properly off the live feed — this is only here so the figure is not a surprise.
  const held = sourceCoins.find((c) => c.coin === asset)
  const unitPrice = held?.usdValue != null && held.amount > 0 ? held.usdValue / held.amount : null
  const coinValue = unitPrice !== null && Number(amount) > 0 ? Number(amount) * unitPrice : null
  const otherVenues = venues.filter((v) => v.id !== venueId && !v.archived)
  // What the ledger says is free in the chosen currency — the figure you need to decide how much
  // to send, and the one that is painful to copy by hand.
  const freeInLedger = (balanceQuery.data?.byCurrency ?? []).find(
    (c) => c.currency === currency,
  )?.amount

  const mutation = useSaveTransfer({
    transferId: transfer?.id,
    onSuccess: () => {
      notifications.show({
        color: "green",
        message: t(mode === "withdraw" ? "investments.tr_withdrawn" : "investments.tr_deposited"),
      })
      close()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const valid = Number(amount) > 0 && !!currency && !!venueId && (peer !== "VENUE" || !!peerVenueId)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    mutation.mutate({
      venueId: venueId as string,
      direction: mode === "deposit" ? "IN" : "OUT",
      peer,
      ...(peer === "VENUE" ? { peerVenueId: peerVenueId as string } : {}),
      // A coin move carries the ticker and the quantity; everything else is money.
      ...(peer !== "LEDGER" && asset
        ? { asset, assetAmount: Number(amount) }
        : { amount: Number(amount), currency: (peer === "LEDGER" ? currency : "USD") as string }),
      date: day ?? undefined,
      note: note.trim() || undefined,
    })
  }

  // Who can be on the other side depends on the direction: money can only arrive from your balance
  // or another venue, and only leave to your balance, another venue or someone else.
  const peerOptions: TransferPeer[] =
    mode === "deposit" ? ["LEDGER", "VENUE"] : ["LEDGER", "VENUE", "EXTERNAL"]

  const switchMode = (v: string) => {
    const next = v as "deposit" | "withdraw"
    setMode(next)
    if (next === "deposit" && peer === "EXTERNAL") setPeer("LEDGER")
  }

  return (
    <form onSubmit={submit}>
      <Stack gap="md">
        <SegmentedControl
          fullWidth
          value={mode}
          onChange={switchMode}
          data={[
            { value: "deposit", label: t("investments.tr_deposit") },
            { value: "withdraw", label: t("investments.tr_withdraw") },
          ]}
        />

        <Select
          label={t(mode === "deposit" ? "investments.tr_peer_to" : "investments.tr_peer_from")}
          required
          value={venueId}
          onChange={setVenueId}
          allowDeselect={false}
          disabled={!!transfer}
          description={transfer ? t("investments.tr_venue_locked") : undefined}
          data={venues.map((v) => ({ value: v.id, label: v.name }))}
        />

        <Select
          label={t(mode === "deposit" ? "investments.tr_peer_from" : "investments.tr_peer_to")}
          required
          value={peer}
          onChange={(v) => setPeer((v ?? "LEDGER") as TransferPeer)}
          allowDeselect={false}
          disabled={!!transfer}
          data={peerOptions.map((p) => ({
            value: p,
            label: t(`investments.tr_peer_${p.toLowerCase()}`),
          }))}
        />

        {peer === "VENUE" && (
          <Select
            label={t(
              mode === "deposit" ? "investments.tr_peer_source" : "investments.tr_peer_target",
            )}
            required
            value={peerVenueId}
            onChange={setPeerVenueId}
            disabled={!!transfer}
            data={otherVenues.map((v) => ({ value: v.id, label: v.name }))}
            nothingFoundMessage={t("investments.tr_no_other_venue")}
          />
        )}

        {peer === "EXTERNAL" && (
          <Text size="xs" c="dimmed">
            {t("investments.tr_external_hint")}
          </Text>
        )}

        {/* Against the wallet the figure is money in the wallet's own currency — that is the side
            that has to match your bank to the satang. Everywhere else there is no wallet, so the
            move is denominated in the coin itself (or in USD when the venue holds no coins). */}
        {peer === "LEDGER" ? (
          <Group grow align="flex-start">
            <NumberInput
              label={t("common.amount")}
              required
              autoFocus
              value={amount}
              onChange={setAmount}
              min={0}
              thousandSeparator=" "
              decimalScale={2}
            />
            <CurrencySelect
              label={t("common.currency")}
              required
              value={currency}
              onChange={setCurrency}
              comboboxProps={{ width: "target" }}
            />
          </Group>
        ) : (
          <Group grow align="flex-start">
            <Select
              label={t("investments.venue_coin_asset")}
              searchable
              clearable
              value={asset}
              onChange={setAsset}
              data={assetOptions}
              placeholder={t("investments.tr_asset_or_usd")}
              nothingFoundMessage={t("common.nothing_found")}
            />
            <NumberInput
              label={asset ? t("investments.venue_coin_amount") : t("common.amount")}
              required
              value={amount}
              onChange={setAmount}
              min={0}
              decimalScale={asset ? 8 : 2}
              suffix={asset ? undefined : " USD"}
              hideControls={!!asset}
            />
          </Group>
        )}

        {asset && coinValue !== null && (
          <Text size="xs" c="dimmed">
            {t("investments.tr_asset_worth", {
              amount: formatCurrency(coinValue, i18n.language, "USD"),
            })}
          </Text>
        )}

        {peer === "LEDGER" && mode === "deposit" && freeInLedger != null && (
          <Box>
            <Text size="xs" c="dimmed">
              {t("investments.tr_free_in_ledger", {
                amount: formatCurrency(freeInLedger, i18n.language, currency),
              })}
            </Text>
          </Box>
        )}

        {peer === "LEDGER" && mode === "withdraw" && venue?.valueUsd != null && (
          <Text size="xs" c="dimmed">
            {t("investments.tr_venue_worth", {
              amount: formatCurrency(venue.valueUsd, i18n.language, "USD"),
            })}
          </Text>
        )}

        <DatePickerInput
          label={t("common.date")}
          value={day}
          onChange={setDay}
          maxDate={format(new Date(), "yyyy-MM-dd")}
          locale={i18n.language}
          valueFormat="DD MMM YYYY"
        />

        <Textarea
          label={t("common.note")}
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
          maxLength={200}
          autosize
          minRows={1}
          maxRows={3}
          placeholder={peer === "EXTERNAL" ? t("investments.tr_external_note") : undefined}
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={close} disabled={mutation.isPending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!valid}>
            {transfer ? t("common.save") : t("investments.tr_record")}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
