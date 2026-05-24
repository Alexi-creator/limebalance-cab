import { DashboardSidebar } from "@components/DashboardSidebar"
import { LangSwitcher } from "@components/LangSwitcher"
import { ThemeToggle } from "@components/ThemeToggle"
import { useLoaderStore } from "@store/loaderStore"
import {
  ActionIcon,
  AppShell,
  Box,
  Burger,
  Button,
  Group,
  Indicator,
  LoadingOverlay,
  TextInput,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconBell, IconPlus, IconSearch } from "@tabler/icons-react"
import { Outlet } from "react-router-dom"

export function Layout() {
  const [opened, { toggle }] = useDisclosure()
  const { isLoading } = useLoaderStore()

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" gap="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />

          <TextInput
            placeholder="Поиск по операциям, целям, тикерам…"
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1, maxWidth: 360 }}
            visibleFrom="sm"
          />

          <Group gap="xs" ml="auto">
            <LangSwitcher />
            <Indicator color="lime" size={8} offset={6} processing>
              <ActionIcon variant="default" size={36} aria-label="Уведомления">
                <IconBell size={18} />
              </ActionIcon>
            </Indicator>
            <ThemeToggle />
            <Button leftSection={<IconPlus size={14} />} size="sm">
              Добавить
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <DashboardSidebar />
      </AppShell.Navbar>

      <AppShell.Main bg="var(--mantine-color-default)" style={{ position: "relative" }}>
        <LoadingOverlay visible={isLoading} zIndex={10} />
        <Box maw={1400} mx="auto" py="md">
          <Outlet />
        </Box>
      </AppShell.Main>
    </AppShell>
  )
}
