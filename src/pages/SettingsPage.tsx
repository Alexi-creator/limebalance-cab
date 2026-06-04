import { ProfileForm } from "@components/settings/ProfileForm"
import { Paper, Stack, Text, Title } from "@mantine/core"
import { useTranslation } from "react-i18next"

export function SettingsPage() {
  const { t } = useTranslation()

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

      <Paper p="lg" maw={480}>
        <ProfileForm />
      </Paper>
    </Stack>
  )
}
