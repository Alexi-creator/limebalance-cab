import { LangSwitcher } from "@components/LangSwitcher"
import { ThemeToggle } from "@components/ThemeToggle"
import { AppShell, Group, Text } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { Outlet } from "react-router-dom"

/**
 * Layout для публичных страниц (авторизация, регистрация).
 * Показывает минималистичный хедер с названием приложения, переключателем языка и темы.
 * Не принимает пропсов.
 */
export function PublicLayout() {
  const { t } = useTranslation()

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
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
