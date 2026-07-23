import { useHomeTour } from "@hooks/useHomeTour"
import { Group, Stack, Text, Title } from "@mantine/core"
import { useAuthStore } from "@store/authStore"
import { TourTriggerButton } from "@ui/TourTriggerButton"
import { useTranslation } from "react-i18next"

/**
 * Home page header: greeting, a short description of the period, and a button
 * to (re)start the guided tour of the home page's main blocks.
 */
export function HomeHeader() {
  const { t } = useTranslation()
  const { startTour } = useHomeTour()
  const name = useAuthStore((s) => s.user?.name)

  return (
    <Group justify="space-between" align="flex-start">
      <Stack gap={4}>
        <Title order={2} size="h3">
          {name ? t("home.greeting_name", { name }) : t("home.greeting")}
        </Title>
        <Text size="sm" c="dimmed">
          {t("home.subtitle")}
        </Text>
      </Stack>

      <TourTriggerButton onClick={startTour} />
    </Group>
  )
}
