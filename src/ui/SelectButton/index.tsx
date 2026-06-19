import type { ButtonProps, MenuProps } from "@mantine/core"
import { Button, Menu, Text } from "@mantine/core"
import { IconChevronDown } from "@tabler/icons-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

export interface SelectButtonOption {
  /** Menu item label */
  label: string
  /** Short description under the label */
  description?: string
  /** Icon to the left of the label */
  icon: ReactNode
  /** Keyboard shortcut shown on the right */
  shortcut?: ReactNode
  /** Action when the item is selected */
  onClick: () => void
}

interface SelectButtonProps {
  /** Main button text */
  label: string
  /** Icon to the left of the main button text */
  icon?: ReactNode
  /** Button size (Mantine ButtonProps["size"]). Defaults to `"sm"` */
  size?: ButtonProps["size"]
  /** Action when the main button is clicked */
  onClick: () => void
  /** List of dropdown menu items */
  options: SelectButtonOption[]
  /** Dropdown menu width. Defaults to `220` */
  menuWidth?: MenuProps["width"]
  /** Dropdown menu position. Defaults to `"bottom-end"` */
  menuPosition?: MenuProps["position"]
}

/**
 * Composite button: main action + dropdown arrow for choosing a variant.
 * Used, for example, in the Header for the "Add" button with a record-type choice.
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
  const { t } = useTranslation()
  return (
    <Button.Group>
      <Button leftSection={icon} size={size} onClick={onClick}>
        {label}
      </Button>

      <Menu position={menuPosition} width={menuWidth} shadow="md">
        <Menu.Target>
          <Button size={size} px={8} aria-label={t("common.select_action")}>
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
