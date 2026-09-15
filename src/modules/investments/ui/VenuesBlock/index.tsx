import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core"
import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconCoins,
  IconHistory,
  IconPlugConnected,
  IconPlus,
} from "@tabler/icons-react"
import type { Locale } from "date-fns"
import { formatDistanceToNow } from "date-fns"
import { enUS } from "date-fns/locale"
import { useTranslation } from "react-i18next"
import { dateFnsLocales } from "@/shared/i18n/languages.ts"
import { formatCurrency } from "@/shared/lib/formatCurrency"
import { useModalStore } from "@/shared/store/modalStore"
import { useVenues } from "../../api/useVenues"
import type { Venue } from "../../model"
import { TransferForm } from "../TransferForm"
import { TransfersHistory } from "../TransfersHistory"
import { VenueDetails } from "../VenueDetails"
import { VenueForm } from "../VenueForm"

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

  const openHistory = (venue?: Venue) =>
    open({
      centered: true,
      title: t("investments.tr_history_title"),
      children: <TransfersHistory venue={venue} />,
    })

  return (
    <Stack gap="md">
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
              {t("investments.tr_total_invested", { amount: usd(data?.investedUsd) })}
            </Text>
          </Stack>

          <Box ta="right">
            <Text size="xs" c="dimmed">
              {t("investments.tr_total_result")}
            </Text>
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
}: {
  venue: Venue
  language: string
  locale: Locale
  onDeposit: () => void
  onWithdraw: () => void
  onHistory: () => void
}) {
  const { t } = useTranslation()
  const open = useModalStore((s) => s.open)
  const usd = (n: number | null) => (n == null ? "—" : formatCurrency(n, language, "USD"))
  const result = venue.resultUsd

  return (
    <Paper p="md" opacity={venue.archived ? 0.6 : 1}>
      <Group justify="space-between" wrap="nowrap" mb="xs" gap="xs">
        <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
          <Text
            size="sm"
            fw={600}
            truncate="end"
            style={{ cursor: "pointer" }}
            onClick={() =>
              open({
                centered: true,
                title: t("investments.venue_edit"),
                children: <VenueForm venue={venue} />,
              })
            }
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
        </Group>
      </Group>

      <Group justify="space-between" align="baseline">
        <Text ff="monospace" fz={22} fw={500} style={{ letterSpacing: "-0.02em" }}>
          {usd(venue.valueUsd)}
        </Text>
        {result !== null && (
          <Text
            ff="monospace"
            size="sm"
            fw={500}
            c={result === 0 ? "dimmed" : result > 0 ? "green.5" : "red.5"}
          >
            {result >= 0 ? "+" : "−"}
            {usd(Math.abs(result))}
          </Text>
        )}
      </Group>

      <Text size="xs" c="dimmed" mt={2}>
        {t("investments.tr_venue_invested", {
          amount: usd((venue.openingUsd ?? 0) + venue.transferredUsd),
        })}
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

      {venue.coins.length > 0 && (
        <Text size="xs" c="dimmed" mt={6} truncate="end">
          {venue.coins
            .slice(0, 4)
            .map((c) => c.coin)
            .join(" · ")}
          {venue.coins.length > 4 ? ` +${venue.coins.length - 4}` : ""}
        </Text>
      )}

      <Group gap="xs" mt="md" grow>
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
