import { AddModal } from "@components/AddModal"
import { LangSwitcher } from "@components/LangSwitcher"
import { ThemeToggle } from "@components/ThemeToggle"
import { ActionIcon, AppShell, Box, Burger, Group, Indicator, Kbd, TextInput } from "@mantine/core"
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

interface Props {
  /** Открыто ли мобильное меню (управляет состоянием `<Burger />`) */
  opened: boolean
  /** Переключает состояние мобильного меню */
  onToggle: () => void
}

/**
 * Верхняя панель приложения (AppShell.Header).
 * Содержит бургер для мобильного меню, строку поиска, переключатель языка/темы,
 * колокольчик уведомлений и кнопку «Добавить» с выпадающим меню типов записей.
 */
export function Header({ opened, onToggle }: Props) {
  const { open } = useModalStore()

  return (
    <AppShell.Header>
      <Group h="100%" px="md" gap="md" wrap="nowrap">
        <Burger opened={opened} onClick={onToggle} hiddenFrom="sm" size="sm" />

        <TextInput
          placeholder="Поиск по операциям, целям, тикерам…"
          leftSection={<IconSearch size={14} />}
          rightSection={<Kbd size="xs">⌘K</Kbd>}
          rightSectionWidth={48}
          style={{ flex: 1, maxWidth: 360 }}
        />

        <Group gap="xs" ml="auto" wrap="nowrap">
          <Box visibleFrom="sm">
            <LangSwitcher />
          </Box>

          <Box visibleFrom="sm">
            <Indicator color="lime" size={8} offset={6} processing>
              <ActionIcon variant="default" size={36} aria-label="Уведомления">
                <IconBell size={18} />
              </ActionIcon>
            </Indicator>
          </Box>

          <Box visibleFrom="sm">
            <ThemeToggle />
          </Box>

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
  )
}
