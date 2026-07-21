import {
  createManualPosition,
  type ManualPositionPayload,
  updateManualPosition,
} from "@api/investing"
import { type ClosedPosition, positionDirection } from "@appTypes/investing"
import { investingKeys } from "@constants/queries/investing"
import { Button, Group, NumberInput, SegmentedControl, Stack, Text, TextInput } from "@mantine/core"
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
  position?: ClosedPosition
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
  const [venue, setVenue] = useState("")
  const [closedAt, setClosedAt] = useState<string | null>(
    format(position?.closedAt ?? new Date(), PICKER_FORMAT),
  )
  const [openedAt, setOpenedAt] = useState<string | null>(
    position?.openedAt ? format(position.openedAt, PICKER_FORMAT) : null,
  )
  const [pnl, setPnl] = useState<number | string>("")
  const [pnlTouched, setPnlTouched] = useState(false)

  const autoPnl =
    Number(qty) > 0 && Number(entryPrice) > 0 && Number(exitPrice) > 0
      ? computePnl(direction, Number(qty), Number(entryPrice), Number(exitPrice))
      : ""
  const pnlValue = pnlTouched ? pnl : autoPnl

  const mutation = useMutation({
    mutationFn: () => {
      if (!closedAt) return Promise.reject(new Error("closedAt is required"))
      const payload: ManualPositionPayload = {
        symbol: symbol.trim().toUpperCase(),
        direction,
        qty: Number(qty),
        entryPrice: Number(entryPrice),
        exitPrice: Number(exitPrice),
        closedAt: pickerValueToIso(closedAt),
        openedAt: openedAt ? pickerValueToIso(openedAt) : undefined,
        leverage: Number(leverage) > 0 ? Number(leverage) : undefined,
        venue: venue.trim() || undefined,
        // Untouched → let the backend compute it from the prices.
        closedPnl: pnlTouched && pnl !== "" ? Number(pnl) : undefined,
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
    Number(exitPrice) > 0 &&
    closedAt !== null

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
          <NumberInput
            label={t("investments.pos_exit")}
            required
            value={exitPrice}
            onChange={setExitPrice}
            min={0}
            decimalScale={8}
            prefix="$"
          />
        </Group>

        <Group grow align="flex-start">
          <DateTimePicker
            label={t("investments.pos_opened_at")}
            value={openedAt}
            onChange={setOpenedAt}
            clearable
            valueFormat="DD MMM YYYY HH:mm"
          />
          <DateTimePicker
            label={t("investments.pos_closed_at")}
            required
            value={closedAt}
            onChange={setClosedAt}
            valueFormat="DD MMM YYYY HH:mm"
          />
        </Group>

        <Stack gap={4}>
          <NumberInput
            label={t("investments.pos_pnl")}
            description={t("investments.pos_pnl_hint")}
            value={pnlValue}
            onChange={(v) => {
              setPnlTouched(true)
              setPnl(v)
            }}
            decimalScale={2}
            prefix="$"
          />
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
