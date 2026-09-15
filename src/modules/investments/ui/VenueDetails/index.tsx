import {
  ActionIcon,
  Alert,
  Button,
  Center,
  Divider,
  Group,
  Loader,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconInfoCircle, IconTrash } from "@tabler/icons-react"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { dateFnsLocales } from "@/shared/i18n/languages.ts"
import { formatCurrency } from "@/shared/lib/formatCurrency"
import { useAssets } from "../../api/useAssets"
import { useDeleteAdjustment, useSaveAdjustment } from "../../api/useSaveAdjustment"
import { useDeleteVenueHolding, useSaveVenueHolding } from "../../api/useSaveVenueHolding"
import { useAdjustments, useVenueHoldings } from "../../api/useVenueDetails"
import type { Venue } from "../../model"

interface Props {
  venue: Venue
}

/**
 * What a manual venue is made of: the coins in it and the corrections applied to it.
 *
 * Two different jobs on purpose. Coins answer "what is in there" and are re-priced on every load,
 * so the venue follows the market. Corrections answer "what happened that we cannot see" — money
 * sent to someone, a miscount, a reward — and each one has to say why, because a bare number here
 * is unreadable a month later.
 */
export function VenueDetails({ venue }: Props) {
  const { t, i18n } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const usd = (n: number | null | undefined) =>
    n == null ? "—" : formatCurrency(n, i18n.language, "USD")

  const holdings = useVenueHoldings(venue.id)
  const assets = useAssets()
  const adjustments = useAdjustments(venue.id)

  const [asset, setAsset] = useState("")
  const [amount, setAmount] = useState<number | string>("")
  const [correction, setCorrection] = useState<number | string>("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)

  const saveCoin = useSaveVenueHolding({
    onSuccess: () => {
      setAsset("")
      setAmount("")
      notifications.show({ color: "green", message: t("investments.venue_coin_saved") })
    },
    onError: (err) => setError(err.message),
  })
  const removeCoin = useDeleteVenueHolding({ onError: (err) => setError(err.message) })

  const saveCorrection = useSaveAdjustment({
    venueId: venue.id,
    onSuccess: () => {
      setCorrection("")
      setReason("")
      notifications.show({ color: "green", message: t("investments.venue_adj_saved") })
    },
    onError: (err) => setError(err.message),
  })
  const removeCorrection = useDeleteAdjustment({ onError: (err) => setError(err.message) })

  if (venue.mode === "LIVE") {
    return (
      <Alert variant="light" color="gray" icon={<IconInfoCircle size={16} />}>
        <Text size="xs">{t("investments.venue_live_hint")}</Text>
      </Alert>
    )
  }

  const coins = holdings.data?.items ?? []
  const corrections = adjustments.data ?? []

  const addCoin = (e: React.FormEvent) => {
    e.preventDefault()
    const ticker = asset.trim().toUpperCase()
    if (!ticker || Number(amount) <= 0) return
    saveCoin.mutate({ venueId: venue.id, asset: ticker, amount: Number(amount) })
  }

  const addCorrection = (e: React.FormEvent) => {
    e.preventDefault()
    const value = Number(correction)
    if (!value || !reason.trim()) return
    saveCorrection.mutate({ amountUsd: value, note: reason.trim() })
  }

  return (
    <Stack gap="lg">
      {error && (
        <Alert color="red" variant="light" p="sm">
          <Text size="xs">{error}</Text>
        </Alert>
      )}

      <Stack gap="xs">
        <Text size="sm" fw={600}>
          {t("investments.venue_coins")}
        </Text>
        <Text size="xs" c="dimmed">
          {coins.length === 0
            ? t("investments.venue_coins_empty", { amount: usd(venue.transferredUsd) })
            : t("investments.venue_coins_total", { amount: usd(holdings.data?.totalValue) })}
        </Text>

        {holdings.isLoading ? (
          <Center py="sm">
            <Loader size="xs" />
          </Center>
        ) : (
          coins.map((coin) => (
            <Group key={coin.id} justify="space-between" wrap="nowrap" gap="sm">
              <Text size="sm">
                {coin.asset}
                <Text component="span" size="xs" c="dimmed">
                  {" "}
                  × {coin.amount}
                </Text>
              </Text>
              <Group gap={4} wrap="nowrap">
                <Text ff="monospace" size="sm" c={coin.value === null ? "dimmed" : undefined}>
                  {/* No ticker on Bybit → left out of the total rather than counted as zero. */}
                  {coin.value === null ? t("investments.venue_coin_no_price") : usd(coin.value)}
                </Text>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  aria-label={t("common.delete")}
                  onClick={() => removeCoin.mutate(coin.id)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            </Group>
          ))
        )}

        <form onSubmit={addCoin}>
          <Group gap="xs" align="flex-end" wrap="nowrap">
            {/* Picked from the tickers we can price, so "no price" cannot be typed in by hand. */}
            <Select
              size="xs"
              label={t("investments.venue_coin_asset")}
              searchable
              value={asset}
              onChange={(v) => setAsset(v ?? "")}
              data={assets.data ?? []}
              w={130}
              placeholder="BTC"
              nothingFoundMessage={t("common.nothing_found")}
            />
            <NumberInput
              size="xs"
              label={t("investments.venue_coin_amount")}
              value={amount}
              onChange={setAmount}
              min={0}
              decimalScale={8}
              // Nothing sensible to step 0.007 BTC by, and the arrows eat the field's width.
              hideControls
              style={{ flex: 1 }}
            />
            <Button size="xs" type="submit" loading={saveCoin.isPending}>
              {t("investments.venue_coin_add")}
            </Button>
          </Group>
        </form>
      </Stack>

      <Divider />

      <Stack gap="xs">
        <Text size="sm" fw={600}>
          {t("investments.venue_adjustments")}
        </Text>
        <Text size="xs" c="dimmed">
          {t("investments.venue_adj_hint")}
        </Text>

        {corrections.map((row) => (
          <Group key={row.id} justify="space-between" wrap="nowrap" gap="sm">
            <Stack gap={0} style={{ minWidth: 0 }}>
              <Text size="sm" truncate="end">
                {row.note}
              </Text>
              <Text size="xs" c="dimmed">
                {format(row.date, "d MMM yyyy", { locale })}
              </Text>
            </Stack>
            <Group gap={4} wrap="nowrap">
              <Text
                ff="monospace"
                size="sm"
                c={row.amountUsd < 0 ? "red.5" : "green.5"}
                style={{ whiteSpace: "nowrap" }}
              >
                {row.amountUsd >= 0 ? "+" : "−"}
                {usd(Math.abs(row.amountUsd))}
              </Text>
              <Tooltip label={t("common.delete")} withinPortal>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  aria-label={t("common.delete")}
                  onClick={() => removeCorrection.mutate(row.id)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        ))}

        <form onSubmit={addCorrection}>
          <Stack gap="xs">
            <Group gap="xs" align="flex-end" wrap="nowrap">
              <NumberInput
                size="xs"
                // Short label on purpose: the block above already explains the sign, and anything
                // longer wraps onto two lines and covers the field itself.
                label={t("investments.venue_adj_amount")}
                value={correction}
                onChange={setCorrection}
                decimalScale={2}
                // Stepper arrows make no sense for a figure you read off somewhere and type in.
                hideControls
                w={140}
              />
              <TextInput
                size="xs"
                label={t("investments.venue_adj_reason")}
                required
                value={reason}
                onChange={(e) => setReason(e.currentTarget.value)}
                maxLength={200}
                placeholder={t("investments.venue_adj_reason_placeholder")}
                style={{ flex: 1 }}
              />
            </Group>
            <Group justify="flex-end">
              <Button
                size="xs"
                type="submit"
                loading={saveCorrection.isPending}
                disabled={!Number(correction) || !reason.trim()}
              >
                {t("investments.venue_adj_add")}
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Stack>
  )
}
