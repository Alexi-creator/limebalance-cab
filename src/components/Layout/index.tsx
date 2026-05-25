import { AddProvider } from "@components/AddModal"
import { DashboardSidebar } from "@components/DashboardSidebar"
import { LangSwitcher } from "@components/LangSwitcher"
import { SplitAddButton } from "@components/SplitAddButton"
import { ThemeToggle } from "@components/ThemeToggle"
import { RouteNames } from "@constants/routeNames"
import {
  ActionIcon,
  AppShell,
  Box,
  Burger,
  Group,
  Indicator,
  Kbd,
  LoadingOverlay,
  Text,
  TextInput,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useLoaderStore } from "@store/loaderStore"
import { IconBell, IconSearch } from "@tabler/icons-react"
import { Outlet, useLocation } from "react-router-dom"

const PAGE_LABELS: Record<string, string> = {
  [RouteNames.Home]: "Обзор",
  [RouteNames.Transactions]: "Операции",
  [RouteNames.Analytics]: "Аналитика",
  [RouteNames.Goals]: "Цели",
  [RouteNames.Investments]: "Инвестиции",
}

export function Layout() {
  const [opened, { toggle }] = useDisclosure()
  const { isLoading } = useLoaderStore()
  const { pathname } = useLocation()
  const pageLabel = PAGE_LABELS[pathname] ?? ""

  return (
    <AddProvider>
      <AppShell
        layout="alt"
        header={{ height: 64 }}
        navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: !opened } }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md" gap="md">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />

            {pageLabel && (
              <Text fw={600} size="sm">
                {pageLabel}
              </Text>
            )}

            <TextInput
              placeholder="Поиск по операциям, целям, тикерам…"
              leftSection={<IconSearch size={14} />}
              rightSection={<Kbd size="xs">⌘K</Kbd>}
              rightSectionWidth={48}
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
              <SplitAddButton />
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
    </AddProvider>
  )
}
