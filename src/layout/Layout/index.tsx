import { AccountAlert } from "@components/AccountAlert"
import { AddModal } from "@components/AddModal"
import { useAddShortcut } from "@components/AddModal/useAddShortcut"
import { DashboardSidebar } from "@components/DashboardSidebar"
import { LangSwitcher } from "@components/LangSwitcher"
import { ThemeToggle } from "@components/ThemeToggle"
import { RouteNames } from "@constants/routeNames"
import {
  ActionIcon,
  AppShell,
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
import { useModalStore } from "@store/modalStore"
import {
  IconArrowsLeftRight,
  IconBell,
  IconChartLine,
  IconCreditCard,
  IconPlus,
  IconSearch,
  IconTarget,
} from "@tabler/icons-react"
import type { SelectButtonOption } from "@ui/SelectButton"
import { SelectButton } from "@ui/SelectButton"
import { Outlet, useLocation } from "react-router-dom"

const PAGE_LABELS: Record<string, string> = {
  [RouteNames.Home]: "Обзор",
  [RouteNames.Transactions]: "Операции",
  [RouteNames.Analytics]: "Аналитика",
  [RouteNames.Goals]: "Цели",
  [RouteNames.Investments]: "Инвестиции",
}

const ADD_OPTIONS: SelectButtonOption[] = [
  {
    label: "Операция",
    description: "доход / расход",
    icon: <IconCreditCard size={16} />,
    shortcut: <Kbd size="xs">⌘N</Kbd>,
    onClick: () =>
      useModalStore
        .getState()
        .open({ size: "lg", centered: true, children: <AddModal type="transaction" /> }),
  },
  {
    label: "Цель",
    description: "копилка",
    icon: <IconTarget size={16} />,
    onClick: () =>
      useModalStore
        .getState()
        .open({ size: "lg", centered: true, children: <AddModal type="goal" /> }),
  },
  {
    label: "Актив в портфель",
    description: "крипта",
    icon: <IconChartLine size={16} />,
    onClick: () =>
      useModalStore
        .getState()
        .open({ size: "lg", centered: true, children: <AddModal type="asset" /> }),
  },
  {
    label: "Перевод между счетами",
    icon: <IconArrowsLeftRight size={16} />,
    onClick: () =>
      useModalStore
        .getState()
        .open({ size: "lg", centered: true, children: <AddModal type="transfer" /> }),
  },
]

export function Layout() {
  const [opened, { toggle }] = useDisclosure()
  const { isLoading } = useLoaderStore()
  const { pathname } = useLocation()
  const pageLabel = PAGE_LABELS[pathname] ?? ""
  const { open } = useModalStore()
  useAddShortcut()

  // Routes where the page fills the container height (no outer scroll, inner components scroll themselves)
  const FILL_HEIGHT_ROUTES = new Set<string>([RouteNames.Transactions])
  const isFillHeight = FILL_HEIGHT_ROUTES.has(pathname)

  return (
    <AppShell
      layout="alt"
      header={{ height: 64 }}
      navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
      style={{ height: "100dvh" }}
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

            <SelectButton
              label="Добавить"
              icon={<IconPlus size={14} />}
              onClick={() =>
                open({ size: "lg", centered: true, children: <AddModal type="transaction" /> })
              }
              options={ADD_OPTIONS}
              menuWidth={260}
            />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <DashboardSidebar />
      </AppShell.Navbar>

      <AppShell.Main
        bg="var(--mantine-color-default)"
        className="main-fixed"
        style={{
          position: "fixed",
          top: "var(--app-shell-header-height, 64px)",
          right: 0,
          bottom: 0,
          minHeight: 0,
          overflowY: isFillHeight ? "hidden" : "auto",
          padding: "var(--mantine-spacing-md)",
        }}
      >
        <LoadingOverlay visible={isLoading} />

        <AccountAlert />

        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
