import type { ButtonProps, MenuProps } from "@mantine/core"
import { Button, Menu, Text } from "@mantine/core"
import { IconChevronDown } from "@tabler/icons-react"
import type { ReactNode } from "react"

export interface SelectButtonOption {
  label: string
  description?: string
  icon: ReactNode
  shortcut?: ReactNode
  onClick: () => void
}

interface SelectButtonProps {
  label: string
  icon?: ReactNode
  size?: ButtonProps["size"]
  onClick: () => void
  options: SelectButtonOption[]
  menuWidth?: MenuProps["width"]
  menuPosition?: MenuProps["position"]
}

export function SelectButton({
  label,
  icon,
  size = "sm",
  onClick,
  options,
  menuWidth = 220,
  menuPosition = "bottom-end",
}: SelectButtonProps) {
  return (
    <Button.Group>
      <Button leftSection={icon} size={size} onClick={onClick}>
        {label}
      </Button>

      <Menu position={menuPosition} width={menuWidth} shadow="md">
        <Menu.Target>
          <Button size={size} px={8} aria-label="Выбрать действие">
            <IconChevronDown size={12} />
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          {options.map((opt) => (
            <Menu.Item
              key={opt.label}
              leftSection={opt.icon}
              rightSection={opt.shortcut}
              onClick={opt.onClick}
            >
              <Text size="sm">{opt.label}</Text>
              {opt.description && (
                <Text size="xs" c="dimmed">
                  {opt.description}
                </Text>
              )}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </Button.Group>
  )
}
