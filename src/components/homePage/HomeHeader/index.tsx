import { Stack, Text, Title } from "@mantine/core"
import { useTranslation } from "react-i18next"

/**
 * Home page header: greeting and a short description of the period.
 */
export function HomeHeader() {
  const { t } = useTranslation()
  return (
    <Stack gap={4}>
      <Title order={2} size="h3">
        {t("home.greeting")}
      </Title>
      <Text size="sm" c="dimmed">
        {t("home.subtitle")}
      </Text>
    </Stack>
  )
}
