import { ProfileForm } from "@components/settings/ProfileForm"
import { SecurityForm } from "@components/settings/SecurityForm"
import { TelegramForm } from "@components/settings/TelegramForm"
import { RouteNames } from "@constants/routeNames"
import { Paper, Stack, Tabs, Text, Title } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"

const TAB_ROUTE: Record<string, string> = {
  general: RouteNames.Settings,
  security: RouteNames.SettingsSecurity,
  telegram: RouteNames.SettingsTelegram,
}

/**
 * Страница настроек с вкладками. Активная вкладка определяется по текущему пути —
 * у «Почта и пароль» и «Telegram» свои роуты, общие настройки на /settings.
 */
export function SettingsPage() {
  const { t } = useTranslation()
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
      <Stack gap={4}>
        <Title order={2} size="h3">
          {t("settings.title")}
        </Title>
        <Text size="sm" c="dimmed">
          {t("settings.subtitle")}
        </Text>
      </Stack>

      <Tabs
        value={tab}
        onChange={(v) => navigate(TAB_ROUTE[v ?? "general"] ?? RouteNames.Settings)}
      >
        <Tabs.List mb="md">
          <Tabs.Tab value="general">{t("settings.tab_general")}</Tabs.Tab>
          <Tabs.Tab value="security">{t("settings.tab_security")}</Tabs.Tab>
          <Tabs.Tab value="telegram">Telegram</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Paper p="lg" maw={480}>
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
