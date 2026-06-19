import { Box, Group, Text } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { ACCENT, NEG } from "./config"

/** Chart legend: solid line — income, dashed — expense. */
export function ChartLegend() {
  const { t } = useTranslation()

  return (
    <Group gap="lg" mt="sm">
      <Group gap={6}>
        <Box w={10} h={10} style={{ background: ACCENT, borderRadius: 2 }} />
        <Text size="xs">{t("chart.income")}</Text>
      </Group>
      <Group gap={6}>
        <Box w={10} h={0} style={{ borderTop: `2px dashed ${NEG}` }} />
        <Text size="xs">{t("chart.expense")}</Text>
      </Group>
    </Group>
  )
}
