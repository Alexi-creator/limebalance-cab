import { Button, Group, NumberInput, Paper, Select, Stack, Text, Textarea } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { differenceInCalendarDays, format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/modules/auth/hooks/useAuthStore"
import { useCategories } from "@/modules/categories/api/useCategories"
import { dateFnsLocales } from "@/shared/i18n/languages.ts"
import { formatCurrency } from "@/shared/lib/formatCurrency"
import { useModalStore } from "@/shared/store/modalStore"
import { CurrencySelect } from "@/shared/ui/CurrencySelect"
import { useClassifyTransfer } from "../../api/useClassifyTransfer"
import { useTransfers } from "../../api/useTransfers"
import { useVenues } from "../../api/useVenues"
import { formatQty } from "../../lib/format"
import type { Transfer, TransferPeer } from "../../model"

interface Props {
  /** An imported movement — pending, or already answered and being answered again. */
  transfer: Transfer
}

/**
 * The answers: the three peers, "I already wrote this one down" (a merge, not a peer), and money
 * earned or spent right there on the venue (a real income or expense, not a peer either).
 */
type Answer = TransferPeer | "MATCH" | "EARNED"

// A hand-recorded duplicate is offered only if it is about this close in time: the day typed in
// by hand is often the day the money was sent, not the day the exchange credited it.
const MATCH_WINDOW_DAYS = 14

/**
 * Says what a deposit or withdrawal imported from the exchange really was.
 *
 * The exchange knows which coin arrived and, often, who sent it; only the user knows whose money it
 * was. Until answered it counts as someone else's — so it never shows up as trading profit — and
 * only "from my balance" moves the free balance, by the amount that actually left it.
 */
export function ReviewTransferForm({ transfer }: Props) {
  const { t, i18n } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const close = useModalStore((s) => s.close)
  const userCurrency = useAuthStore((s) => s.user?.currency)
  const venues = useVenues().data?.items ?? []
  const venueTransfers = useTransfers({ venueId: transfer.venueId }).data?.items ?? []

  const isIn = transfer.direction === "IN"
  const answered = !transfer.needsReview
  // Arrivals can be income, departures an expense — the category list follows the direction.
  const categories = useCategories(!isIn).data ?? []
  const wasEarned = answered && transfer.linkedAs !== null

  // Hand-recorded transfers of the same venue, direction and rough date — the likely duplicates.
  const candidates = venueTransfers.filter(
    (r) =>
      r.source === "MANUAL" &&
      r.venueId === transfer.venueId &&
      r.direction === transfer.direction &&
      Math.abs(differenceInCalendarDays(r.date, transfer.date)) <= MATCH_WINDOW_DAYS,
  )

  const [answer, setAnswer] = useState<Answer | null>(
    wasEarned ? "EARNED" : answered ? transfer.peer : null,
  )
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [peerVenueId, setPeerVenueId] = useState<string | null>(transfer.peerVenueId)
  const [matchId, setMatchId] = useState<string | null>(null)
  // Against the balance the figure is the wallet's own: prefilled only when that is what it was.
  const [amount, setAmount] = useState<number | string>(
    answered && transfer.peer === "LEDGER"
      ? transfer.amount
      : userCurrency === "USD" || !userCurrency
        ? (transfer.amountUsd ?? "")
        : "",
  )
  const [currency, setCurrency] = useState<string | null>(
    answered && transfer.peer === "LEDGER" ? transfer.currency : (userCurrency ?? "USD"),
  )
  // Income or expense in a stablecoin is money in dollars: the arrival's own USD figure is the
  // natural default, whatever currency the wallet is kept in.
  const [earnedAmount, setEarnedAmount] = useState<number | string>(
    wasEarned ? transfer.amount : (transfer.amountUsd ?? ""),
  )
  const [earnedCurrency, setEarnedCurrency] = useState<string | null>(
    wasEarned ? transfer.currency : "USD",
  )
  const [note, setNote] = useState(transfer.note ?? "")

  const mutation = useClassifyTransfer({
    transferId: transfer.id,
    onSuccess: () => {
      notifications.show({ color: "green", message: t("investments.rv_saved") })
      close()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const otherVenues = venues.filter((v) => v.id !== transfer.venueId && !v.archived)

  const valid =
    answer === "EXTERNAL" ||
    (answer === "LEDGER" && Number(amount) > 0 && !!currency) ||
    (answer === "VENUE" && !!peerVenueId) ||
    (answer === "MATCH" && !!matchId) ||
    (answer === "EARNED" && !!categoryId && Number(earnedAmount) > 0 && !!earnedCurrency)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || !answer) return
    const trimmed = note.trim() || undefined
    if (answer === "EARNED") {
      mutation.mutate({
        peer: "LEDGER",
        as: isIn ? "INCOME" : "EXPENSE",
        categoryId: categoryId as string,
        amount: Number(earnedAmount),
        currency: earnedCurrency as string,
        note: trimmed,
      })
      return
    }
    if (answer === "MATCH") {
      // The backend takes the peer from the merged transfer; EXTERNAL here is only a placeholder.
      mutation.mutate({ peer: "EXTERNAL", replacesId: matchId as string, note: trimmed })
      return
    }
    mutation.mutate({
      peer: answer,
      ...(answer === "VENUE" ? { peerVenueId: peerVenueId as string } : {}),
      ...(answer === "LEDGER" ? { amount: Number(amount), currency: currency as string } : {}),
      note: trimmed,
    })
  }

  const answers: { value: Answer; label: string }[] = [
    { value: "EARNED", label: t(isIn ? "investments.rv_income" : "investments.rv_expense") },
    { value: "LEDGER", label: t(isIn ? "investments.rv_ledger_in" : "investments.rv_ledger_out") },
    { value: "VENUE", label: t(isIn ? "investments.rv_venue_in" : "investments.rv_venue_out") },
    {
      value: "EXTERNAL",
      label: t(isIn ? "investments.tr_peer_external_in" : "investments.tr_peer_external"),
    },
    ...(candidates.length > 0 && !answered
      ? [{ value: "MATCH" as const, label: t("investments.rv_match") }]
      : []),
  ]

  return (
    <form onSubmit={submit}>
      <Stack gap="md">
        <Paper withBorder p="sm">
          <Group justify="space-between" wrap="nowrap" gap="sm">
            <Text fw={600} ff="monospace">
              {isIn ? "+" : "−"}
              {transfer.assetAmount != null ? formatQty(transfer.assetAmount, i18n.language) : ""}{" "}
              {transfer.asset}
            </Text>
            <Text size="sm" c="dimmed" ff="monospace">
              {transfer.amountUsd != null
                ? `≈ ${formatCurrency(transfer.amountUsd, i18n.language, "USD")}`
                : t("investments.rv_no_price")}
            </Text>
          </Group>
          <Text size="xs" c="dimmed" mt={4}>
            {transfer.venueName} · {format(transfer.date, "d MMM yyyy", { locale })}
          </Text>
          {transfer.counterparty && (
            <Text size="xs" mt={4} style={{ wordBreak: "break-all" }}>
              {t(isIn ? "investments.rv_sender" : "investments.rv_recipient")}:{" "}
              <Text component="span" size="xs" ff="monospace">
                {transfer.counterparty}
              </Text>
            </Text>
          )}
          {transfer.txId && (
            <Text size="xs" c="dimmed" mt={2} ff="monospace" truncate="end">
              tx {transfer.txId}
            </Text>
          )}
        </Paper>

        <Select
          label={t(isIn ? "investments.rv_question_in" : "investments.rv_question_out")}
          required
          value={answer}
          onChange={(v) => setAnswer(v as Answer | null)}
          allowDeselect={false}
          data={answers}
        />

        {answer === "LEDGER" && (
          <>
            <Group grow align="flex-start">
              <NumberInput
                label={t(
                  isIn ? "investments.rv_ledger_amount_in" : "investments.rv_ledger_amount_out",
                )}
                required
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
            <Text size="xs" c="dimmed">
              {t("investments.rv_ledger_hint")}
            </Text>
          </>
        )}

        {answer === "EARNED" && (
          <>
            <Select
              label={t("investments.rv_category")}
              required
              searchable
              value={categoryId}
              onChange={setCategoryId}
              data={categories.map((c) => ({
                value: c.id,
                label: c.emoji ? `${c.emoji} ${c.name}` : c.name,
              }))}
              placeholder={
                wasEarned && transfer.linkedCategory ? transfer.linkedCategory.name : undefined
              }
              nothingFoundMessage={t("common.nothing_found")}
            />
            <Group grow align="flex-start">
              <NumberInput
                label={t("common.amount")}
                required
                value={earnedAmount}
                onChange={setEarnedAmount}
                min={0}
                thousandSeparator=" "
                decimalScale={2}
              />
              <CurrencySelect
                label={t("common.currency")}
                required
                value={earnedCurrency}
                onChange={setEarnedCurrency}
                comboboxProps={{ width: "target" }}
              />
            </Group>
            <Text size="xs" c="dimmed">
              {t(isIn ? "investments.rv_income_hint" : "investments.rv_expense_hint")}
            </Text>
          </>
        )}

        {answer === "VENUE" && (
          <Select
            label={t(isIn ? "investments.tr_peer_source" : "investments.tr_peer_target")}
            required
            value={peerVenueId}
            onChange={setPeerVenueId}
            data={otherVenues.map((v) => ({ value: v.id, label: v.name }))}
            nothingFoundMessage={t("investments.tr_no_other_venue")}
          />
        )}

        {answer === "MATCH" && (
          <>
            <Select
              label={t("investments.rv_match_pick")}
              required
              value={matchId}
              onChange={setMatchId}
              data={candidates.map((r) => ({
                value: r.id,
                label: `${format(r.date, "d MMM", { locale })} · ${formatCurrency(
                  r.amount,
                  i18n.language,
                  r.currency,
                )}${r.note ? ` · ${r.note}` : ""}`,
              }))}
            />
            <Text size="xs" c="dimmed">
              {t("investments.rv_match_hint")}
            </Text>
          </>
        )}

        {answer === "EXTERNAL" && (
          <Text size="xs" c="dimmed">
            {t(isIn ? "investments.tr_external_in_hint" : "investments.tr_external_hint")}
          </Text>
        )}

        <Textarea
          label={t("common.note")}
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
          maxLength={200}
          autosize
          minRows={1}
          maxRows={3}
          placeholder={t(isIn ? "investments.tr_external_note_in" : "investments.tr_external_note")}
        />

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
