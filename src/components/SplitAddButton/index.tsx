import { useAdd } from "@components/AddModal"
import { Button, Kbd, Menu, Text } from "@mantine/core"
import {
  IconArrowsLeftRight,
  IconChartLine,
  IconChevronDown,
  IconCreditCard,
  IconPlus,
  IconTarget,
} from "@tabler/icons-react"

export function SplitAddButton() {
  const { open } = useAdd()
  return (
    <Button.Group>
      <Button leftSection={<IconPlus size={14} />} size="sm" onClick={() => open("transaction")}>
        Добавить
      </Button>
      <Menu position="bottom-end" width={260} shadow="md">
        <Menu.Target>
          <Button size="sm" px={8} aria-label="Что добавить?">
            <IconChevronDown size={12} />
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            leftSection={<IconCreditCard size={16} />}
            rightSection={<Kbd size="xs">⌘N</Kbd>}
            onClick={() => open("transaction")}
          >
            <Text size="sm">Операция</Text>
            <Text size="xs" c="dimmed">
              доход / расход
            </Text>
          </Menu.Item>
          <Menu.Item leftSection={<IconTarget size={16} />} onClick={() => open("goal")}>
            <Text size="sm">Цель</Text>
            <Text size="xs" c="dimmed">
              копилка
            </Text>
          </Menu.Item>
          <Menu.Item leftSection={<IconChartLine size={16} />} onClick={() => open("asset")}>
            <Text size="sm">Актив в портфель</Text>
            <Text size="xs" c="dimmed">
              крипта
            </Text>
          </Menu.Item>
          <Menu.Item
            leftSection={<IconArrowsLeftRight size={16} />}
            onClick={() => open("transfer")}
          >
            <Text size="sm">Перевод между счетами</Text>
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Button.Group>
  )
}
