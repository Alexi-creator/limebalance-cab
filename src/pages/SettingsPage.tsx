import { ProfileForm } from "@components/settings/ProfileForm"
import { SecurityForm } from "@components/settings/SecurityForm"
import { RouteNames } from "@constants/routeNames"
import { Paper, Stack, Tabs, Text, Title } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"

/**
 * Страница настроек с вкладками. Активная вкладка определяется по текущему пути —
 * у вкладки «Почта и пароль» свой роут (/settings/security), общие настройки на /settings.
 */
export function SettingsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const tab = pathname === RouteNames.SettingsSecurity ? "security" : "general"

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
        onChange={(v) =>
          navigate(v === "security" ? RouteNames.SettingsSecurity : RouteNames.Settings)
        }
      >
        <Tabs.List mb="md">
          <Tabs.Tab value="general">{t("settings.tab_general")}</Tabs.Tab>
          <Tabs.Tab value="security">{t("settings.tab_security")}</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Paper p="lg" maw={480}>
        {tab === "security" ? <SecurityForm /> : <ProfileForm />}
      </Paper>
    </Stack>
  )
}
