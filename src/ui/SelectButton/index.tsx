import type { ButtonProps, MenuProps } from "@mantine/core"
import { Button, Menu, Text } from "@mantine/core"
import { IconChevronDown } from "@tabler/icons-react"
import type { ReactNode } from "react"

export interface SelectButtonOption {
  /** Название пункта меню */
  label: string
  /** Краткое описание под названием */
  description?: string
  /** Иконка слева от названия */
  icon: ReactNode
  /** Горячая клавиша, отображаемая справа */
  shortcut?: ReactNode
  /** Действие при выборе пункта */
  onClick: () => void
}

interface SelectButtonProps {
  /** Текст основной кнопки */
  label: string
  /** Иконка слева от текста основной кнопки */
  icon?: ReactNode
  /** Размер кнопки (Mantine ButtonProps["size"]). По умолчанию `"sm"` */
  size?: ButtonProps["size"]
  /** Действие при клике на основную кнопку */
  onClick: () => void
  /** Список пунктов выпадающего меню */
  options: SelectButtonOption[]
  /** Ширина выпадающего меню. По умолчанию `220` */
  menuWidth?: MenuProps["width"]
  /** Позиция выпадающего меню. По умолчанию `"bottom-end"` */
  menuPosition?: MenuProps["position"]
}

/**
 * Составная кнопка: основное действие + стрелка-дропдаун с выбором варианта.
 * Используется, например, в Header для кнопки «Добавить» с выбором типа записи.
 */
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
