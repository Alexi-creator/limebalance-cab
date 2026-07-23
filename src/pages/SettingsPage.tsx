import { ProfileForm } from "@components/settings/ProfileForm"
import { SecurityForm } from "@components/settings/SecurityForm"
import { TelegramForm } from "@components/settings/TelegramForm"
import { RouteNames } from "@constants/routeNames"
import { useSettingsTour } from "@hooks/useSettingsTour"
import { Group, Paper, Stack, Tabs, Text, Title } from "@mantine/core"
import { TourTriggerButton } from "@ui/TourTriggerButton"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"

const TAB_ROUTE: Record<string, string> = {
  general: RouteNames.Settings,
  security: RouteNames.SettingsSecurity,
  telegram: RouteNames.SettingsTelegram,
}

/**
 * Settings page with tabs. The active tab is determined by the current path —
 * "Email & password" and "Telegram" have their own routes, general settings are at /settings.
 */
export function SettingsPage() {
  const { t } = useTranslation()
  const { startTour } = useSettingsTour()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const tab =
    pathname === RouteNames.SettingsSecurity
      ? "security"
      : pathname === RouteNames.SettingsTelegram
        ? "telegram"
        : "general"

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Title order={2} size="h3">
            {t("settings.title")}
          </Title>
          <Text size="sm" c="dimmed">
            {t("settings.subtitle")}
          </Text>
        </Stack>
        <TourTriggerButton onClick={startTour} />
      </Group>

      <Tabs
        value={tab}
        onChange={(v) => navigate(TAB_ROUTE[v ?? "general"] ?? RouteNames.Settings)}
      >
        <Tabs.List mb="md" data-tour="set-tabs">
          <Tabs.Tab value="general">{t("settings.tab_general")}</Tabs.Tab>
          <Tabs.Tab value="security">{t("settings.tab_security")}</Tabs.Tab>
          <Tabs.Tab value="telegram">Telegram</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Paper p="lg" maw={480} data-tour="set-form">
        {tab === "security" ? (
          <SecurityForm />
        ) : tab === "telegram" ? (
          <TelegramForm />
        ) : (
          <ProfileForm />
        )}
      </Paper>
    </Stack>
  )
}
