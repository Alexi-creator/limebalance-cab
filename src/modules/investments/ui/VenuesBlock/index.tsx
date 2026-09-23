import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Popover,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core"
import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconCoins,
  IconHistory,
  IconInbox,
  IconInfoCircle,
  IconPencil,
  IconPlugConnected,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"
import type { Locale } from "date-fns"
import { format, formatDistanceToNow } from "date-fns"
import { enUS } from "date-fns/locale"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { dateFnsLocales } from "@/shared/i18n/languages.ts"
import { formatCurrency } from "@/shared/lib/formatCurrency"
import { useModalStore } from "@/shared/store/modalStore"
import { useVenues } from "../../api/useVenues"
import { formatQty } from "../../lib/format"
import { DUST_USD, type Venue } from "../../model"
import { CoinIcon } from "../CoinIcon"
import { TransferForm } from "../TransferForm"
import { TransfersHistory } from "../TransfersHistory"
import { VenueDetails } from "../VenueDetails"
import { VenueForm } from "../VenueForm"

/**
 * Where a venue's money came from, said in the words that are actually true of it.
 *
 * These are two different stories and only one of them is anybody putting money in: a balance that
 * was already on the exchange when tracking began was never deposited through this app, and a
 * connected account whose whole equity is baseline would otherwise claim the user paid it in.
 * Both are shown when both happened, because the result is measured against their sum.
 */
function investedParts(
  t: TFunction,
  usd: (n: number | null) => string,
  openingUsd: number,
  transferredUsd: number,
): string {
  const parts: string[] = []
  if (openingUsd !== 0) parts.push(t("investments.tr_venue_opening", { amount: usd(openingUsd) }))
  if (transferredUsd !== 0) {
    parts.push(t("investments.tr_venue_added", { amount: usd(transferredUsd) }))
  }
  // Nothing either way is still worth saying: an empty venue reads as empty, not as unknown.
  return parts.length > 0
    ? parts.join(" · ")
    : t("investments.tr_venue_invested", { amount: usd(0) })
}

/**
 * What the invested money is worth, per place.
 *
 * A connected exchange is valued by the exchange itself on every sync — open positions marked to
 * market included — so the figure matches what you see there instead of being reconstructed from
 * deposits and trades. What was put in is shown beside it, because the gap between the two is the
 * only number that says whether any of this is working.
 */
export function VenuesBlock() {
  const { t, i18n } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const open = useModalStore((s) => s.open)
  const { data, isLoading } = useVenues()

  const venues = data?.items ?? []
  const usd = (n: number | null | undefined) =>
    n == null ? "—" : formatCurrency(n, i18n.language, "USD")
  const result = data?.resultUsd ?? 0

  const openTransfer = (mode: "deposit" | "withdraw", venue?: Venue) =>
    open({
      centered: true,
      title: t(
        mode === "withdraw" ? "investments.tr_withdraw_title" : "investments.tr_deposit_title",
      ),
      children: <TransferForm initialMode={mode} defaultVenue={venue} />,
    })

  const openHistory = (venue?: Venue, pendingOnly?: boolean) =>
    open({
      centered: true,
      title: t(pendingOnly ? "investments.rv_list_title" : "investments.tr_history_title"),
      children: <TransfersHistory venue={venue} pendingOnly={pendingOnly} />,
    })

  const pending = data?.pendingReview ?? 0

  return (
    <Stack gap="md">
      {/* Money that simply appeared on an exchange is parked as someone else's until explained —
          it never reads as profit meanwhile, but the balance does not know about it either. */}
      {pending > 0 && (
        <Alert color="orange" variant="light" icon={<IconInbox size={18} />} p="sm">
          <Group justify="space-between" wrap="wrap" gap="xs">
            <Text size="sm">{t("investments.rv_alert", { count: pending })}</Text>
            <Button
              size="xs"
              variant="light"
              color="orange"
              onClick={() => openHistory(undefined, true)}
            >
              {t("investments.rv_alert_action")}
            </Button>
          </Group>
        </Alert>
      )}

      <Paper p="lg">
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              {t("investments.tr_total_value")}
            </Text>
            <Text ff="monospace" fz={32} fw={500} style={{ letterSpacing: "-0.02em" }}>
              {data?.isPartial ? "≈ " : ""}
              {usd(data?.totalUsd)}
            </Text>
            <Text size="xs" c="dimmed">
              {investedParts(
                t,
                usd,
                data?.openingUsd ?? 0,
                (data?.investedUsd ?? 0) - (data?.openingUsd ?? 0),
              )}
            </Text>
          </Stack>

          <Box ta="right">
            {/* The figure people read first, and the one that misleads hardest: it is how much
                these venues have moved since the app first read them, which on an account that
                predates it by years is not the same thing as how the trading went. */}
            <Group gap={4} justify="flex-end" wrap="nowrap">
              <Text size="xs" c="dimmed">
                {t("investments.tr_total_result")}
              </Text>
              <Tooltip
                label={t("investments.tr_result_hint")}
                multiline
                w={280}
                withArrow
                withinPortal
                events={{ hover: true, focus: true, touch: true }}
              >
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="xs"
                  aria-label={t("investments.tr_result_hint")}
                >
                  <IconInfoCircle size={13} />
                </ActionIcon>
              </Tooltip>
            </Group>
            <Text
              ff="monospace"
              fz={24}
              fw={500}
              c={result === 0 ? "dimmed" : result > 0 ? "green.5" : "red.5"}
            >
              {result >= 0 ? "+" : "−"}
              {usd(Math.abs(result))}
            </Text>
          </Box>

          <Group gap="xs">
            <Button
              size="sm"
              leftSection={<IconArrowUpRight size={14} />}
              disabled={isLoading || venues.length === 0}
              onClick={() => openTransfer("deposit")}
            >
              {t("investments.tr_deposit")}
            </Button>
            <Button
              size="sm"
              variant="default"
              leftSection={<IconArrowDownLeft size={14} />}
              disabled={isLoading || venues.length === 0}
              onClick={() => openTransfer("withdraw")}
            >
              {t("investments.tr_withdraw")}
            </Button>
            <Tooltip label={t("investments.tr_history_title")}>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                aria-label={t("investments.tr_history_title")}
                onClick={() => openHistory()}
              >
                <IconHistory size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {venues.map((venue) => (
          <VenueCard
            key={venue.id}
            venue={venue}
            language={i18n.language}
            locale={locale}
            onDeposit={() => openTransfer("deposit", venue)}
            onWithdraw={() => openTransfer("withdraw", venue)}
            onHistory={() => openHistory(venue)}
            onReview={() => openHistory(venue, true)}
          />
        ))}

        <Paper
          p="md"
          onClick={() =>
            open({ centered: true, title: t("investments.venue_new"), children: <VenueForm /> })
          }
          style={{
            borderStyle: "dashed",
            display: "grid",
            placeItems: "center",
            minHeight: 160,
            cursor: "pointer",
          }}
        >
          <Stack align="center" gap={6}>
            <IconPlus size={20} color="var(--mantine-color-lime-4)" />
            <Text size="sm" fw={500}>
              {t("investments.venue_new")}
            </Text>
            <Text size="xs" c="dimmed" ta="center" maw={220}>
              {t("investments.venue_new_hint")}
            </Text>
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  )
}

function VenueCard({
  venue,
  language,
  locale,
  onDeposit,
  onWithdraw,
  onHistory,
  onReview,
}: {
  venue: Venue
  language: string
  locale: Locale
  onDeposit: () => void
  onWithdraw: () => void
  onHistory: () => void
  onReview: () => void
}) {
  const { t } = useTranslation()
  const open = useModalStore((s) => s.open)
  const usd = (n: number | null) => (n == null ? "—" : formatCurrency(n, language, "USD"))
  const result = venue.resultUsd

  // Deleting opens the same form as editing, already asking for confirmation: the refusal when the
  // venue is not empty, and the two ways out of it, are written once and live there.
  const openEdit = (intent?: "delete") =>
    open({
      centered: true,
      title: intent === "delete" ? t("common.delete") : t("investments.venue_edit"),
      children: <VenueForm venue={venue} intent={intent} />,
    })

  return (
    <Paper
      p="md"
      opacity={venue.archived ? 0.6 : 1}
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <Group justify="space-between" wrap="nowrap" mb="xs" gap="xs">
        <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
          <Text
            size="sm"
            fw={600}
            truncate="end"
            style={{ cursor: "pointer" }}
            onClick={() => openEdit()}
          >
            {venue.name}
          </Text>
          {venue.mode === "LIVE" && (
            <Tooltip label={t("investments.tr_connected_hint")} withinPortal>
              <Badge
                size="xs"
                color="lime"
                variant="light"
                leftSection={<IconPlugConnected size={10} />}
              >
                API
              </Badge>
            </Tooltip>
          )}
          {venue.pendingReview > 0 && (
            <Tooltip label={t("investments.rv_badge_hint")} withinPortal>
              <Badge
                size="xs"
                color="orange"
                variant="light"
                style={{ cursor: "pointer" }}
                onClick={onReview}
              >
                {venue.pendingReview}
              </Badge>
            </Tooltip>
          )}
        </Group>
        <Group gap={2} wrap="nowrap">
          {venue.mode === "MANUAL" && (
            <Tooltip label={t("investments.venue_details")} withinPortal>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                aria-label={t("investments.venue_details")}
                onClick={() =>
                  open({
                    centered: true,
                    title: `${venue.name} — ${t("investments.venue_details")}`,
                    children: <VenueDetails venue={venue} />,
                  })
                }
              >
                <IconCoins size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          <Tooltip label={t("investments.tr_history_title")} withinPortal>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              aria-label={t("investments.tr_history_title")}
              onClick={onHistory}
            >
              <IconHistory size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t("investments.venue_edit")} withinPortal>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              aria-label={t("investments.venue_edit")}
              onClick={() => openEdit()}
            >
              <IconPencil size={14} />
            </ActionIcon>
          </Tooltip>
          {/* Only a card of our own: a connected exchange's venue goes away with its API key. */}
          {!venue.accountId && (
            <Tooltip label={t("common.delete")} withinPortal>
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                aria-label={t("common.delete")}
                onClick={() => openEdit("delete")}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      <Group justify="space-between" align="baseline">
        <Text ff="monospace" fz={22} fw={500} style={{ letterSpacing: "-0.02em" }}>
          {usd(venue.valueUsd)}
        </Text>
        {result !== null && (
          <Box ta="right">
            <Text
              ff="monospace"
              size="sm"
              fw={500}
              c={result === 0 ? "dimmed" : result > 0 ? "green.5" : "red.5"}
            >
              {result >= 0 ? "+" : "−"}
              {usd(Math.abs(result))}
            </Text>
            {/* An undated result reads as a lifetime verdict. On an account that existed long
                before this app, three dollars over two days is noise, and saying since when is
                what turns it back into information. No baseline, no line: a venue made by hand
                has no moment its measuring started from. fz and not size, because `size` takes a
                Mantine token and an unknown one resolves to a 100px line-height. */}
            {venue.openingAt && (
              <Text fz={10} lh={1.3} c="dimmed" mt={2}>
                {t("investments.tr_result_since", {
                  date: format(venue.openingAt, "d MMM yyyy", { locale }),
                })}
              </Text>
            )}
          </Box>
        )}
      </Group>

      <Text size="xs" c="dimmed" mt={2}>
        {investedParts(t, usd, venue.openingUsd ?? 0, venue.transferredUsd)}
      </Text>

      {venue.adjustmentsUsd !== 0 && (
        <Text size="xs" c="dimmed">
          {t("investments.venue_adj_applied", { amount: usd(venue.adjustmentsUsd) })}
        </Text>
      )}

      {/* A live figure is only as good as its age — say when it was read rather than implying now. */}
      {venue.mode === "LIVE" && venue.valueAt && (
        <Text size="xs" c="dimmed">
          {t("investments.tr_value_age", {
            ago: formatDistanceToNow(venue.valueAt, { addSuffix: true, locale }),
          })}
        </Text>
      )}

      {venue.coins.length > 0 && <CoinsLine venue={venue} language={language} usd={usd} />}

      {/* Cards in a row differ in height; the actions line up only if they hang off the bottom. */}
      <Group gap="xs" pt="md" grow style={{ marginTop: "auto" }}>
        <Button size="xs" variant="light" onClick={onDeposit}>
          {t("investments.tr_deposit")}
        </Button>
        <Button size="xs" variant="default" onClick={onWithdraw}>
          {t("investments.tr_withdraw")}
        </Button>
      </Group>
    </Paper>
  )
}

/**
 * The first few tickers on the card, opening into the full wallet on click.
 *
 * The journal only knows trades; the wallet also holds what never was one — idle USDT, an airdrop,
 * an Earn payout — so this list is the one place those show up. The exchange already sends coins
 * sorted by value, so the card's first four are the ones that matter. Dust is folded into one
 * line: seventeen rows where thirteen are cents bury the four that are money.
 */
function CoinsLine({
  venue,
  language,
  usd,
}: {
  venue: Venue
  language: string
  usd: (n: number | null) => string
}) {
  const { t } = useTranslation()
  const coins = venue.coins
  // An unpriced coin is unknown, not worthless — it stays visible.
  const shown = coins.filter((c) => c.usdValue == null || c.usdValue >= DUST_USD)
  const dust = coins.length - shown.length

  return (
    <Popover position="bottom-start" shadow="md" withinPortal>
      <Popover.Target>
        <UnstyledButton mt={6} aria-label={t("investments.tr_coins_all")} style={{ minWidth: 0 }}>
          <Text size="xs" c="dimmed" truncate="end" td="underline dotted">
            {coins
              .slice(0, 4)
              .map((c) => c.coin)
              .join(" · ")}
            {coins.length > 4 ? ` +${coins.length - 4}` : ""}
          </Text>
        </UnstyledButton>
      </Popover.Target>
      <Popover.Dropdown p="xs" miw={240} mah={320} style={{ overflowY: "auto" }}>
        <Stack gap={6}>
          {shown.map((c) => (
            <Group key={c.coin} gap="xs" wrap="nowrap" justify="space-between">
              <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                <CoinIcon ticker={c.coin} size={16} />
                <Text size="xs" fw={500}>
                  {c.coin}
                </Text>
                <Text size="xs" c="dimmed" ff="monospace" truncate="end">
                  {formatQty(c.amount, language)}
                </Text>
              </Group>
              <Text size="xs" ff="monospace">
                {usd(c.usdValue)}
              </Text>
            </Group>
          ))}
          {dust > 0 && (
            <Text size="xs" c="dimmed">
              {t("investments.tr_coins_dust", { count: dust, amount: usd(DUST_USD) })}
            </Text>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}
