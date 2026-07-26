import {
  createManualPosition,
  type ManualPositionPayload,
  updateManualPosition,
} from "@api/investing"
import { type Position, positionDirection } from "@appTypes/investing"
import { investingKeys } from "@constants/queries/investing"
import {
  Button,
  Checkbox,
  Group,
  NumberInput,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core"
import { DateTimePicker } from "@mantine/dates"
import { notifications } from "@mantine/notifications"
import { useModalStore } from "@store/modalStore"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { useState } from "react"
import { useTranslation } from "react-i18next"

/** Picker values are local wall-clock strings ("2026-07-17 14:30:00"); the API wants ISO. */
function pickerValueToIso(value: string): string {
  return new Date(value.replace(" ", "T")).toISOString()
}

const PICKER_FORMAT = "yyyy-MM-dd HH:mm:ss"

interface Props {
  /** When set (must be source=manual) the form edits it, otherwise creates a new entry. */
  position?: Position
}

type Direction = "long" | "short"

/** PnL from the prices: (exit − entry) × qty for long, the opposite for short. */
function computePnl(direction: Direction, qty: number, entry: number, exit: number): number {
  const raw = direction === "long" ? (exit - entry) * qty : (entry - exit) * qty
  return Math.round(raw * 100) / 100
}

/**
 * Manual trade entry (a closed position from another venue — MEXC, an exchanger…).
 * The PnL field is prefilled from the prices but stays editable (to account for fees);
 * while untouched it follows the prices and is omitted from the payload so the
 * backend recomputes it itself.
 */
export function PositionForm({ position }: Props) {
  const { t } = useTranslation()
  const close = useModalStore((s) => s.close)
  const queryClient = useQueryClient()

  const [symbol, setSymbol] = useState(position?.symbol ?? "")
  const [direction, setDirection] = useState<Direction>(
    position ? positionDirection(position) : "long",
  )
  const [qty, setQty] = useState<number | string>(position?.qty ?? "")
  const [entryPrice, setEntryPrice] = useState<number | string>(position?.avgEntryPrice ?? "")
  const [exitPrice, setExitPrice] = useState<number | string>(position?.avgExitPrice ?? "")
  const [leverage, setLeverage] = useState<number | string>(position?.leverage ?? "")
  const [takeProfitPrice, setTakeProfitPrice] = useState<number | string>(
    position?.takeProfitPrice ?? "",
  )
  const [stopLossPrice, setStopLossPrice] = useState<number | string>(position?.stopLossPrice ?? "")
  const [venue, setVenue] = useState("")
  // Editing an OPEN position starts with no closedAt to fill in — "now" is only a sensible
  // default once the user actually decides to close it (unchecks stillOpen below).
  const [closedAt, setClosedAt] = useState<string | null>(
    position?.closedAt
      ? format(position.closedAt, PICKER_FORMAT)
      : format(new Date(), PICKER_FORMAT),
  )
  const [openedAt, setOpenedAt] = useState<string | null>(
    position?.openedAt ? format(position.openedAt, PICKER_FORMAT) : null,
  )
  const [pnl, setPnl] = useState<number | string>("")
  const [pnlTouched, setPnlTouched] = useState(false)
  // Exit price / closed at / PnL only apply once the trade is closed — checked by default for a
  // new entry (the common case: logging a completed trade) and mirrors the position's own status
  // when editing. Unchecking it on an OPEN position and filling in exit + closed at closes it —
  // the backend flips the status itself (see updateManualPosition).
  const [stillOpen, setStillOpen] = useState(position ? position.status === "OPEN" : false)
  const [note, setNote] = useState("")
  const [noteImageUrl, setNoteImageUrl] = useState("")

  const autoPnl =
    Number(qty) > 0 && Number(entryPrice) > 0 && Number(exitPrice) > 0
      ? computePnl(direction, Number(qty), Number(entryPrice), Number(exitPrice))
      : ""
  const pnlValue = pnlTouched ? pnl : autoPnl

  const mutation = useMutation({
    mutationFn: () => {
      const payload: ManualPositionPayload = {
        symbol: symbol.trim().toUpperCase(),
        direction,
        qty: Number(qty),
        entryPrice: Number(entryPrice),
        // Omitted together → the trade stays (or becomes) OPEN; the backend rejects one
        // without the other.
        exitPrice: stillOpen ? undefined : Number(exitPrice),
        closedAt: stillOpen || !closedAt ? undefined : pickerValueToIso(closedAt),
        openedAt: openedAt ? pickerValueToIso(openedAt) : undefined,
        leverage: Number(leverage) > 0 ? Number(leverage) : undefined,
        takeProfitPrice: Number(takeProfitPrice) > 0 ? Number(takeProfitPrice) : undefined,
        stopLossPrice: Number(stopLossPrice) > 0 ? Number(stopLossPrice) : undefined,
        venue: venue.trim() || undefined,
        // Untouched → let the backend compute it from the prices.
        closedPnl: !stillOpen && pnlTouched && pnl !== "" ? Number(pnl) : undefined,
        // The backend only accepts these on create — a first note for the new position.
        note: !position && note.trim() ? note.trim() : undefined,
        noteImageUrl: !position && noteImageUrl.trim() ? noteImageUrl.trim() : undefined,
      }
      return position ? updateManualPosition(position.id, payload) : createManualPosition(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investingKeys.allPositions })
      notifications.show({
        color: "green",
        message: t(position ? "investments.pos_updated" : "investments.pos_created"),
      })
      close()
    },
    onError: (err) => {
      notifications.show({ color: "red", message: err.message })
    },
  })

  const valid =
    symbol.trim().length > 0 &&
    Number(qty) > 0 &&
    Number(entryPrice) > 0 &&
    (stillOpen || (Number(exitPrice) > 0 && closedAt !== null))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    mutation.mutate()
  }

  return (
    <form onSubmit={submit}>
      <Stack gap="md">
        <SegmentedControl
          fullWidth
          value={direction}
          onChange={(v) => setDirection(v as Direction)}
          data={[
            { value: "long", label: t("investments.pos_long") },
            { value: "short", label: t("investments.pos_short") },
          ]}
        />

        <Group grow align="flex-start">
          <TextInput
            label={t("investments.pos_symbol")}
            placeholder="BTCUSDT"
            required
            autoFocus={!position}
            value={symbol}
            onChange={(e) => setSymbol(e.currentTarget.value.toUpperCase())}
            maxLength={20}
          />
          <TextInput
            label={t("investments.pos_venue")}
            placeholder={t("investments.pos_venue_placeholder")}
            value={venue}
            onChange={(e) => setVenue(e.currentTarget.value)}
            maxLength={50}
          />
        </Group>

        <Group grow align="flex-start">
          <NumberInput
            label={t("investments.pos_qty")}
            required
            value={qty}
            onChange={setQty}
            min={0}
            decimalScale={8}
          />
          <NumberInput
            label={t("investments.pos_leverage")}
            value={leverage}
            onChange={setLeverage}
            min={0}
            decimalScale={2}
            suffix="x"
          />
        </Group>

        <Group grow align="flex-start">
          <NumberInput
            label={t("investments.pos_entry")}
            required
            value={entryPrice}
            onChange={setEntryPrice}
            min={0}
            decimalScale={8}
            prefix="$"
          />
          {!stillOpen && (
            <NumberInput
              label={t("investments.pos_exit")}
              required
              value={exitPrice}
              onChange={setExitPrice}
              min={0}
              decimalScale={8}
              prefix="$"
            />
          )}
        </Group>

        <Group grow align="flex-start">
          <NumberInput
            label={t("investments.pos_take_profit")}
            value={takeProfitPrice}
            onChange={setTakeProfitPrice}
            min={0}
            decimalScale={8}
            prefix="$"
          />
          <NumberInput
            label={t("investments.pos_stop_loss")}
            value={stopLossPrice}
            onChange={setStopLossPrice}
            min={0}
            decimalScale={8}
            prefix="$"
          />
        </Group>

        <Checkbox
          label={t("investments.pos_still_open")}
          checked={stillOpen}
          onChange={(e) => setStillOpen(e.currentTarget.checked)}
        />

        <Group grow align="flex-start">
          <DateTimePicker
            label={t("investments.pos_opened_at")}
            value={openedAt}
            onChange={setOpenedAt}
            clearable
            valueFormat="DD MMM YYYY HH:mm"
          />
          {!stillOpen && (
            <DateTimePicker
              label={t("investments.pos_closed_at")}
              required
              value={closedAt}
              onChange={setClosedAt}
              valueFormat="DD MMM YYYY HH:mm"
            />
          )}
        </Group>

        {!stillOpen && (
          <Stack gap={4}>
            <NumberInput
              label={t("investments.pos_pnl")}
              value={pnlValue}
              onChange={(v) => {
                setPnlTouched(true)
                setPnl(v)
              }}
              decimalScale={2}
              prefix="$"
            />
            <Text size="xs" c="dimmed">
              {t("investments.pos_pnl_hint")}
            </Text>
            {pnlTouched && (
              <Button
                variant="light"
                size="compact-xs"
                w="fit-content"
                onClick={() => {
                  setPnlTouched(false)
                  setPnl("")
                }}
              >
                {t("investments.pos_pnl_reset")}
              </Button>
            )}
          </Stack>
        )}

        {!position && (
          <Stack gap="xs">
            <Textarea
              label={t("investments.pos_note")}
              placeholder={t("investments.pos_note_placeholder")}
              value={note}
              onChange={(e) => setNote(e.currentTarget.value)}
              autosize
              minRows={2}
              maxLength={2000}
            />
            <TextInput
              label={t("investments.pos_note_image")}
              placeholder="https://…"
              value={noteImageUrl}
              onChange={(e) => setNoteImageUrl(e.currentTarget.value)}
            />
          </Stack>
        )}

        {position && (
          <Text size="xs" c="dimmed">
            {t("investments.pos_edit_hint")}
          </Text>
        )}

        <Group justify="flex-end">
          <Button variant="default" onClick={close} disabled={mutation.isPending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={!valid}>
            {t("common.save")}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
