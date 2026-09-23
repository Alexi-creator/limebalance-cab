import {
  Anchor,
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
import { useVenueHoldings } from "../../api/useVenueDetails"
import { useVenues } from "../../api/useVenues"
import type { Transfer, TransferPeer, Venue, VenueCoin, VenueHolding } from "../../model"

/**
 * A transfer the form opens already filled in — recording a P2P order, where the exchange knows
 * every figure and the user only confirms. Always against the balance: that is what P2P is.
 */
export interface TransferPreset {
  mode: "deposit" | "withdraw"
  venueId: string
  amount: number
  currency: string
  date: Date
  note: string
  p2pOrderId: string
}

interface Props {
  /** Prefilled figures to confirm; ties the saved transfer to the P2P order it records. */
  preset?: TransferPreset
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
export function TransferForm({ initialMode = "deposit", defaultVenue, transfer, preset }: Props) {
  const { t, i18n } = useTranslation()
  const close = useModalStore((s) => s.close)
  const userCurrency = useAuthStore((s) => s.user?.currency)
  const balanceQuery = useBalance()
  const venues = useVenues().data?.items ?? []
  const allAssets = useAssets()

  const [venueId, setVenueId] = useState<string | null>(
    transfer?.venueId ?? preset?.venueId ?? defaultVenue?.id ?? venues[0]?.id ?? null,
  )
  const [mode, setMode] = useState<"deposit" | "withdraw">(
    transfer
      ? transfer.direction === "IN"
        ? "deposit"
        : "withdraw"
      : (preset?.mode ?? initialMode),
  )
  const [peer, setPeer] = useState<TransferPeer>(transfer?.peer ?? "LEDGER")
  const [peerVenueId, setPeerVenueId] = useState<string | null>(transfer?.peerVenueId ?? null)
  // A coin move is edited in the coin it was made in, not in the USD it was priced at — except
  // against the wallet, where the figure is always the wallet's money and the coin sits beside it.
  const [amount, setAmount] = useState<number | string>(
    (transfer?.asset && transfer.peer !== "LEDGER" ? transfer.assetAmount : transfer?.amount) ??
      preset?.amount ??
      "",
  )
  // The coin side of a wallet transfer to a venue kept by hand: sold 1 079 USDT there, got baht.
  const [coinQty, setCoinQty] = useState<number | string>(
    transfer?.asset && transfer.peer === "LEDGER" ? (transfer.assetAmount ?? "") : "",
  )
  // Its size and direction are fixed once recorded — only the date and the note can change.
  const coinLocked = !!transfer?.asset
  const [currency, setCurrency] = useState<string | null>(
    transfer?.currency ?? preset?.currency ?? userCurrency ?? "USD",
  )
  const [pickedAsset, setAsset] = useState<string | null>(transfer?.asset ?? null)
  const [note, setNote] = useState(transfer?.note ?? preset?.note ?? "")
  const [day, setDay] = useState<string | null>(
    format(transfer?.date ?? preset?.date ?? new Date(), "yyyy-MM-dd"),
  )

  const venue = venues.find((v) => v.id === venueId)
  // Against the wallet, a venue kept by hand has two sides to say: the coin that left or reached
  // it, and the money that reached or left the wallet. A live exchange reads its own coins, so
  // there only the money is asked for.
  const ledgerCoin = peer === "LEDGER" && venue?.mode === "MANUAL"
  const sourceVenue =
    mode === "withdraw"
      ? venue
      : peer === "LEDGER"
        ? undefined
        : venues.find((v) => v.id === peerVenueId)
  // A manual venue's coins live in its holdings, not in the exchange snapshot — asked for only when
  // coins are actually leaving one.
  const manualSource =
    (peer !== "LEDGER" || ledgerCoin) && sourceVenue?.mode === "MANUAL" ? sourceVenue : null
  const sourceHoldings = useVenueHoldings(manualSource?.id ?? "", !!manualSource)
  const sourceCoins = manualSource
    ? heldCoins(sourceHoldings.data?.items ?? [])
    : (sourceVenue?.coins ?? [])
  // Only coins the source actually holds are offered. A manual venue holds exactly what it says, so
  // nothing else can leave it; an exchange not read yet falls back to every priceable ticker —
  // picking from what is there beats typing a ticker blind.
  const coinsKnown = !!manualSource || sourceCoins.length > 0
  const assetOptions = coinsKnown ? sourceCoins.map((c) => c.coin) : (allAssets.data ?? [])
  // A coin picked before the source changed does not carry over to a source that has none of it.
  const asset =
    pickedAsset && (coinLocked || !coinsKnown || assetOptions.includes(pickedAsset))
      ? pickedAsset
      : null
  // Rough preview of what the quantity is worth, from the venue's own snapshot. The backend prices
  // the move properly off the live feed — this is only here so the figure is not a surprise.
  const held = sourceCoins.find((c) => c.coin === asset)
  const unitPrice = held?.usdValue != null && held.amount > 0 ? held.usdValue / held.amount : null
  // How much of the coin moves: its own field against the wallet, the amount field elsewhere.
  const qty = ledgerCoin ? coinQty : amount
  const coinValue =
    !ledgerCoin && unitPrice !== null && Number(amount) > 0 ? Number(amount) * unitPrice : null
  // What one coin fetched in the wallet's money — the figure worth checking against the exchange.
  const rate =
    ledgerCoin && asset && Number(coinQty) > 0 && Number(amount) > 0
      ? Number(amount) / Number(coinQty)
      : null
  // The most that can leave. A recorded transfer is already out of the source, so its own size is
  // not checked against what is left — it cannot change anyway.
  const maxCoin = held && !coinLocked && coinsKnown ? roundCoin(held.amount) : null
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

  const coinUsed = !!asset && (peer !== "LEDGER" || ledgerCoin)
  const coinFits = !coinUsed || maxCoin === null || Number(qty) <= maxCoin

  const valid =
    Number(amount) > 0 &&
    !!currency &&
    !!venueId &&
    (peer !== "VENUE" || !!peerVenueId) &&
    coinFits &&
    (!ledgerCoin || !asset || Number(coinQty) > 0)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    mutation.mutate({
      venueId: venueId as string,
      direction: mode === "deposit" ? "IN" : "OUT",
      peer,
      ...(peer === "VENUE" ? { peerVenueId: peerVenueId as string } : {}),
      // A coin move carries the ticker and the quantity; everything else is money. Against the
      // wallet both: the money that moved there, and the coin that moved on a venue kept by hand.
      ...(peer === "LEDGER"
        ? {
            amount: Number(amount),
            currency: currency as string,
            ...(ledgerCoin && asset && !coinLocked ? { asset, assetAmount: Number(coinQty) } : {}),
          }
        : asset
          ? { asset, assetAmount: Number(amount) }
          : { amount: Number(amount), currency: "USD" }),
      date: day ?? undefined,
      note: note.trim() || undefined,
      ...(preset ? { p2pOrderId: preset.p2pOrderId } : {}),
    })
  }

  // The same three whichever way the money goes. Arriving from outside is as real as leaving to
  // it — coins someone sent you, or a holding that predates the app — and offering it only on the
  // way out left no way to describe a venue that was never funded from this wallet: its whole
  // value would have read as profit made out of nothing.
  const peerOptions: TransferPeer[] = ["LEDGER", "VENUE", "EXTERNAL"]

  const switchMode = (v: string) => setMode(v as "deposit" | "withdraw")

  return (
    <form onSubmit={submit}>
      <Stack gap="md">
        <SegmentedControl
          fullWidth
          value={mode}
          onChange={switchMode}
          disabled={coinLocked || !!preset}
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
          disabled={!!transfer || !!preset}
          description={transfer ? t("investments.tr_venue_locked") : undefined}
          data={venues.map((v) => ({ value: v.id, label: v.name }))}
        />

        <Select
          label={t(mode === "deposit" ? "investments.tr_peer_from" : "investments.tr_peer_to")}
          required
          value={peer}
          onChange={(v) => setPeer((v ?? "LEDGER") as TransferPeer)}
          allowDeselect={false}
          disabled={!!transfer || !!preset}
          data={peerOptions.map((p) => ({
            value: p,
            // The outside world is the one peer that reads differently by direction: money goes
            // *to* a third party and arrives *from* one. Your balance and your other venues are
            // the same place whichever way it moves.
            label:
              p === "EXTERNAL" && mode === "deposit"
                ? t("investments.tr_peer_external_in")
                : t(`investments.tr_peer_${p.toLowerCase()}`),
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
            {t(
              mode === "deposit"
                ? "investments.tr_external_in_hint"
                : "investments.tr_external_hint",
            )}
          </Text>
        )}

        {/* Against the wallet the figure is money in the wallet's own currency — that is the side
            that has to match your bank to the satang. Everywhere else there is no wallet, so the
            move is denominated in the coin itself (or in USD when the venue holds no coins). */}
        {peer === "LEDGER" ? (
          <Stack gap="xs">
            {ledgerCoin && mode === "withdraw" && (
              <CoinSide
                label={t("investments.tr_coin_leaves")}
                asset={asset}
                onAsset={setAsset}
                options={assetOptions}
                qty={coinQty}
                onQty={setCoinQty}
                max={maxCoin}
                locked={coinLocked}
              />
            )}
            <Group grow align="flex-start">
              <NumberInput
                label={t(
                  mode === "deposit" ? "investments.tr_wallet_gives" : "investments.tr_wallet_gets",
                )}
                required
                autoFocus={!ledgerCoin}
                value={amount}
                onChange={setAmount}
                // Figures from a P2P order are Bybit's facts, not the user's to adjust.
                disabled={!!preset}
                min={0}
                thousandSeparator=" "
                decimalScale={2}
              />
              <CurrencySelect
                label={t("common.currency")}
                required
                value={currency}
                onChange={setCurrency}
                disabled={!!preset}
                comboboxProps={{ width: "target" }}
              />
            </Group>
            {ledgerCoin && mode === "deposit" && (
              <CoinSide
                label={t("investments.tr_coin_arrives")}
                asset={asset}
                onAsset={setAsset}
                options={assetOptions}
                qty={coinQty}
                onQty={setCoinQty}
                max={null}
                locked={coinLocked}
              />
            )}
            {rate !== null && (
              <Text size="xs" c="dimmed">
                {t("investments.tr_rate_preview", {
                  rate: formatCurrency(rate, i18n.language, currency ?? "USD"),
                  asset,
                })}
              </Text>
            )}
            {venue?.mode === "LIVE" && !preset && (
              <Text size="xs" c="dimmed">
                {t("investments.tr_live_coins_hint")}
              </Text>
            )}
          </Stack>
        ) : (
          <Group grow align="flex-start">
            <Select
              label={t("investments.venue_coin_asset")}
              searchable
              clearable
              value={asset}
              onChange={setAsset}
              disabled={!!transfer}
              data={assetOptions}
              placeholder={t("investments.tr_asset_or_usd")}
              nothingFoundMessage={t("common.nothing_found")}
            />
            <NumberInput
              label={asset ? t("investments.venue_coin_amount") : t("common.amount")}
              required
              value={amount}
              onChange={setAmount}
              disabled={coinLocked}
              min={0}
              max={maxCoin ?? undefined}
              error={
                maxCoin !== null && Number(amount) > maxCoin
                  ? t("investments.tr_asset_too_much")
                  : undefined
              }
              decimalScale={asset ? 8 : 2}
              suffix={asset ? undefined : " USD"}
              hideControls={!!asset}
            />
          </Group>
        )}

        {maxCoin !== null && (
          <Text size="xs" c="dimmed">
            {t("investments.tr_asset_available", { amount: maxCoin, asset })}{" "}
            <Anchor
              component="button"
              type="button"
              size="xs"
              onClick={() => (ledgerCoin ? setCoinQty(maxCoin) : setAmount(maxCoin))}
            >
              {t("investments.tr_asset_all")}
            </Anchor>
          </Text>
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
          disabled={!!preset}
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
          placeholder={
            peer === "EXTERNAL"
              ? t(
                  mode === "deposit"
                    ? "investments.tr_external_note_in"
                    : "investments.tr_external_note",
                )
              : undefined
          }
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

/** A manual venue's holdings folded into one row per coin, largest first — the snapshot's shape. */
function heldCoins(holdings: VenueHolding[]): VenueCoin[] {
  const byCoin = new Map<string, VenueCoin>()
  for (const h of holdings) {
    if (h.amount <= 0) continue
    const row = byCoin.get(h.asset) ?? { coin: h.asset, amount: 0, usdValue: null }
    row.amount += h.amount
    if (h.value !== null) row.usdValue = (row.usdValue ?? 0) + h.value
    byCoin.set(h.asset, row)
  }
  return [...byCoin.values()].sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0))
}

/** Summed holdings pick up float dust; eight places is as fine as a coin amount is entered. */
function roundCoin(n: number): number {
  return Math.round(n * 1e8) / 1e8
}

/**
 * The coin side of a wallet transfer to a venue kept by hand. Optional: a venue whose coins are
 * not tracked is simply worth what went in, and then only the money matters.
 */
function CoinSide({
  label,
  asset,
  onAsset,
  options,
  qty,
  onQty,
  max,
  locked,
}: {
  label: string
  asset: string | null
  onAsset: (asset: string | null) => void
  options: string[]
  qty: number | string
  onQty: (qty: number | string) => void
  max: number | null
  locked: boolean
}) {
  const { t } = useTranslation()
  return (
    <Group grow align="flex-start">
      <Select
        label={label}
        searchable
        clearable
        value={asset}
        onChange={onAsset}
        disabled={locked}
        data={options}
        placeholder={t("investments.tr_coin_optional")}
        nothingFoundMessage={t("common.nothing_found")}
      />
      <NumberInput
        label={t("investments.venue_coin_amount")}
        required={!!asset}
        value={qty}
        onChange={onQty}
        disabled={locked || !asset}
        min={0}
        max={max ?? undefined}
        error={max !== null && Number(qty) > max ? t("investments.tr_asset_too_much") : undefined}
        decimalScale={8}
        hideControls
      />
    </Group>
  )
}
