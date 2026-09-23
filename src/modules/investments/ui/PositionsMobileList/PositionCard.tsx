import { Badge, Group, Stack, Text, UnstyledButton } from "@mantine/core"
import { IconBolt, IconNotes } from "@tabler/icons-react"
import { format, type Locale } from "date-fns"
import { useTranslation } from "react-i18next"
import { formatPct, formatPnl, formatUsd, pnlColor } from "../../lib/format"
import {
  baseAssetFromSymbol,
  type Position,
  positionDirection,
  positionPnl,
  positionRoi,
} from "../../model"
import { CoinIcon } from "../CoinIcon"

interface Props {
  position: Position
  locale: Locale
  onPress: () => void
}

/**
 * One trade as a two-line row: pair and direction on the left, PnL and ROI on the right.
 *
 * Replaces the 17-column table below `sm` — that table asks for well over 1500px and a phone has
 * ~375. Only what a journal is actually scanned for stays on screen (which pair, which way, how
 * much it made); everything else moves into the details sheet behind a tap.
 */
export function PositionCard({ position, locale, onPress }: Props) {
  const { t, i18n } = useTranslation()

  const long = positionDirection(position) === "long"
  const pnl = positionPnl(position)
  const roi = positionRoi(position)
  const isOpen = position.status === "OPEN"

  // one date, not two: while open the entry date is what matters, once closed — the exit
  const date = isOpen ? position.openedAt : (position.closedAt ?? position.openedAt)

  return (
    <UnstyledButton
      onClick={onPress}
      style={{
        display: "block",
        width: "100%",
        // 10px vertical on a two-line row keeps the tap target above the 44px minimum
        padding: "10px var(--mantine-spacing-md)",
        borderBottom: "1px solid var(--mantine-color-default-border)",
      }}
    >
      <Group wrap="nowrap" gap={10} align="flex-start">
        <CoinIcon ticker={baseAssetFromSymbol(position.symbol)} size={30} />

        <Stack gap={3} style={{ flex: 1, minWidth: 0 }}>
          <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
            <Text ff="monospace" size="sm" fw={500} truncate>
              {position.symbol}
            </Text>
            <Badge
              variant="light"
              color={long ? "green" : "red"}
              size="xs"
              style={{ flexShrink: 0 }}
            >
              {t(long ? "investments.pos_long" : "investments.pos_short")}
            </Badge>
            {isOpen && (
              <Badge variant="light" color="green" size="xs" style={{ flexShrink: 0 }}>
                {t("investments.pos_status_open")}
              </Badge>
            )}
            {position.notes.length > 0 && (
              <IconNotes
                size={14}
                color="var(--mantine-color-yellow-6)"
                aria-label={t("common.note")}
                style={{ flexShrink: 0 }}
              />
            )}
          </Group>

          <Text size="xs" c="dimmed" truncate style={{ textAlign: "left" }}>
            {date ? format(date, "d MMM yyyy", { locale }) : "—"} ·{" "}
            {formatUsd(position.entryVolumeUsd, i18n.language)}
          </Text>
        </Stack>

        <Stack gap={2} align="flex-end" style={{ flexShrink: 0 }}>
          <Group gap={4} wrap="nowrap">
            {isOpen && pnl != null && (
              <IconBolt size={12} className="pulse-live" color="var(--mantine-color-yellow-6)" />
            )}
            <Text
              ff="monospace"
              size="sm"
              fw={600}
              c={pnl == null ? "dimmed" : pnlColor(pnl)}
              style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}
            >
              {pnl == null ? "—" : formatPnl(pnl, i18n.language)}
            </Text>
          </Group>
          <Text
            ff="monospace"
            size="xs"
            c={roi == null ? "dimmed" : pnlColor(roi)}
            style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}
          >
            {roi == null ? "—" : formatPct(roi, i18n.language)}
          </Text>
        </Stack>
      </Group>
    </UnstyledButton>
  )
}
