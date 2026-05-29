import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from "@mantine/core"
import { IconMoon, IconSun } from "@tabler/icons-react"

/**
 * Кнопка переключения цветовой схемы приложения (светлая / тёмная).
 * Не принимает пропсов.
 */
export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme()
  const computed = useComputedColorScheme("light")

  return (
    <ActionIcon
      variant="default"
      size={36}
      onClick={() => setColorScheme(computed === "light" ? "dark" : "light")}
      aria-label="Toggle color scheme"
    >
      {computed === "light" ? <IconMoon size={16} /> : <IconSun size={16} />}
    </ActionIcon>
  )
}
