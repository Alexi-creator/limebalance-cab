import { LangSwitcher } from "@components/LangSwitcher"
import { ThemeToggle } from "@components/ThemeToggle"
import { usePageTracking } from "@hooks/usePageTracking"
import { AppShell, Group, LoadingOverlay, Text } from "@mantine/core"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"
import { Outlet } from "react-router-dom"

/**
 * Layout for public pages (login, registration).
 * Shows a minimalist header with the app name and the language and theme toggles.
 * Takes no props.
 */
export function PublicLayout() {
  const { t } = useTranslation()
  usePageTracking()

  return (
    <AppShell header={{ height: 60 }} padding={0}>
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Text fw={700} size="lg">
            {t("app.name")}
          </Text>
          <Group>
            <LangSwitcher />
            <ThemeToggle />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Suspense fallback={<LoadingOverlay visible />}>
          <Outlet />
        </Suspense>
      </AppShell.Main>
    </AppShell>
  )
}
