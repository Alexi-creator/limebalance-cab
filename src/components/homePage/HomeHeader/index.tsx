import { Stack, Text, Title } from "@mantine/core"
import { useTranslation } from "react-i18next"

/**
 * Шапка главной страницы: приветствие и краткое описание периода.
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
