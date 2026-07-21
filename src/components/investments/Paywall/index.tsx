import { Paper, Stack, Text, ThemeIcon, Title } from "@mantine/core"
import { IconLock } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

/**
 * Shown when the backend answers 403 on /investing/* — the plan has no investing access.
 * Normally the route guard hides the page from free users; this covers the case when
 * the client-side plan info is stale (e.g. the subscription just expired).
 */
export function InvestingPaywall() {
  const { t } = useTranslation()

  return (
    <Paper p="xl">
      <Stack align="center" gap="sm" py="xl">
        <ThemeIcon variant="light" color="lime" size={56} radius="xl">
          <IconLock size={28} />
        </ThemeIcon>
        <Title order={3} size="h4">
          {t("investments.paywall_title")}
        </Title>
        <Text size="sm" c="dimmed" ta="center" maw={420}>
          {t("investments.paywall_text")}
        </Text>
      </Stack>
    </Paper>
  )
}
