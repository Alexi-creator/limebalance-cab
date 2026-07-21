import { getHoldings } from "@api/investing"
import type { Holding } from "@appTypes/investing"
import { DeleteHoldingConfirm } from "@components/investments/DeleteHoldingConfirm"
import { formatPnl, formatQty, formatUsd, pnlColor } from "@components/investments/format"
import { HoldingForm } from "@components/investments/HoldingForm"
import { HOLDINGS_STALE_TIME, investingKeys } from "@constants/queries/investing"
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core"
import { useModalStore } from "@store/modalStore"
import { IconEdit, IconInfoCircle, IconPlus, IconTrash } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

/**
 * Portfolio (holdings) valued with live Bybit spot prices (cached a minute on the
 * backend). Rows without a price stay visible but are excluded from totalValue;
 * rows without a buy price have a value but no PnL.
 */
export function HoldingsSection() {
  const { t, i18n } = useTranslation()
  const open = useModalStore((s) => s.open)

  const { data, isLoading, error } = useQuery({
    queryKey: investingKeys.holdings,
    queryFn: getHoldings,
    staleTime: HOLDINGS_STALE_TIME,
  })

  const items = data?.items ?? []

  const openCreate = () =>
    open({
      size: "lg",
      centered: true,
      title: t("investments.hold_add_title"),
      children: <HoldingForm />,
    })

  const openEdit = (holding: Holding) =>
    open({
      size: "lg",
      centered: true,
      title: t("investments.hold_edit_title"),
      children: <HoldingForm holding={holding} />,
    })

  const openDelete = (holding: Holding) =>
    open({
      centered: true,
      title: t("investments.hold_delete_title"),
      children: <DeleteHoldingConfirm holding={holding} />,
    })

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader size="sm" />
      </Center>
    )
  }

  if (error) {
    return <Alert color="red">{error.message}</Alert>
  }

  return (
    <Stack gap="md">
      <Alert color="blue" variant="light" icon={<IconInfoCircle size={16} />}>
        {t("investments.hold_intro")}
      </Alert>

      <Paper p="lg">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              {t("investments.hold_total")}
            </Text>
            <Text ff="monospace" fz={32} fw={500} style={{ letterSpacing: "-0.02em" }}>
              {formatUsd(data?.totalValue ?? 0, i18n.language)}
            </Text>
          </Stack>
          <Button size="sm" leftSection={<IconPlus size={14} />} onClick={openCreate}>
            {t("investments.hold_add")}
          </Button>
        </Group>
      </Paper>

      <Paper>
        {items.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            {t("investments.hold_empty")}
          </Text>
        ) : (
          <Box style={{ overflowX: "auto" }}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t("investments.col_asset")}</Table.Th>
                  <Table.Th ta="right">{t("common.amount")}</Table.Th>
                  <Table.Th ta="right">{t("investments.col_price")}</Table.Th>
                  <Table.Th ta="right">{t("investments.col_value")}</Table.Th>
                  <Table.Th ta="right">PnL</Table.Th>
                  <Table.Th>{t("investments.hold_location")}</Table.Th>
                  <Table.Th w={90} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((h) => (
                  <Table.Tr key={h.id}>
                    <Table.Td>
                      <Group gap="sm" wrap="nowrap">
                        <Box
                          w={32}
                          h={32}
                          style={{
                            borderRadius: 999,
                            background: "var(--mantine-color-default)",
                            border: "1px solid var(--mantine-color-default-border)",
                            display: "grid",
                            placeItems: "center",
                            fontFamily: "var(--mantine-font-family-monospace)",
                            fontWeight: 600,
                            fontSize: 10,
                            flexShrink: 0,
                          }}
                        >
                          {h.asset.slice(0, 4)}
                        </Box>
                        <Stack gap={0}>
                          <Text size="sm" fw={500}>
                            {h.asset}
                          </Text>
                          {h.note && (
                            <Text size="xs" c="dimmed" truncate="end" maw={200}>
                              {h.note}
                            </Text>
                          )}
                        </Stack>
                      </Group>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text ff="monospace" size="sm">
                        {formatQty(h.amount, i18n.language)}
                      </Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      {h.price == null ? (
                        <Tooltip label={t("investments.hold_no_price_hint")} multiline maw={260}>
                          <Text size="xs" c="dimmed" style={{ cursor: "help" }}>
                            {t("investments.hold_no_price")}
                          </Text>
                        </Tooltip>
                      ) : (
                        <Text ff="monospace" size="sm" c="dimmed">
                          {formatUsd(h.price, i18n.language)}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text ff="monospace" size="sm" fw={500}>
                        {h.value == null ? "—" : formatUsd(h.value, i18n.language)}
                      </Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      {h.pnlUsd == null ? (
                        <Tooltip label={t("investments.hold_no_pnl_hint")} multiline maw={260}>
                          <Text size="sm" c="dimmed" style={{ cursor: "help" }}>
                            —
                          </Text>
                        </Tooltip>
                      ) : (
                        <Text ff="monospace" size="sm" c={pnlColor(h.pnlUsd)}>
                          {formatPnl(h.pnlUsd, i18n.language)}
                          {h.pnlPct != null && (
                            <Text component="span" size="xs" c="dimmed">
                              {" "}
                              ({h.pnlPct > 0 ? "+" : ""}
                              {h.pnlPct.toFixed(2)}%)
                            </Text>
                          )}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {h.location}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end" wrap="nowrap">
                        <Tooltip label={t("common.change")}>
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            color="gray"
                            aria-label={t("common.change")}
                            onClick={() => openEdit(h)}
                          >
                            <IconEdit size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label={t("common.delete")}>
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            color="gray"
                            aria-label={t("common.delete")}
                            onClick={() => openDelete(h)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        )}
      </Paper>
    </Stack>
  )
}
