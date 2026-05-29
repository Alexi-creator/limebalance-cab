import { logout } from "@api/auth"
import { LangSwitcher } from "@components/LangSwitcher"
import { ThemeToggle } from "@components/ThemeToggle"
import { RouteNames } from "@constants/routeNames"
import {
  ActionIcon,
  Avatar,
  Box,
  Divider,
  Group,
  Indicator,
  NavLink,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core"
import { useAuthStore } from "@store/authStore"
import {
  IconBell,
  IconChartHistogram,
  IconCoin,
  IconHome,
  IconListDetails,
  IconLogout,
  IconSettings,
  IconTags,
  IconTarget,
  IconX,
} from "@tabler/icons-react"
import { useLocation, useNavigate } from "react-router-dom"

const navItems = [
  { to: RouteNames.Home, label: "Обзор", icon: IconHome },
  { to: RouteNames.Transactions, label: "Операции", icon: IconListDetails },
  { to: RouteNames.Categories, label: "Категории", icon: IconTags },
  { to: RouteNames.Analytics, label: "Аналитика", icon: IconChartHistogram },
  { to: RouteNames.Goals, label: "Цели", icon: IconTarget },
  { to: RouteNames.Investments, label: "Инвестиции", icon: IconCoin },
]

interface Props {
  onClose?: () => void
}

export function DashboardSidebar({ onClose }: Props) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, setUser } = useAuthStore()

  const handleLogout = async () => {
    await logout().catch(() => {})
    setUser(null)
  }

  const initials = user?.email?.[0]?.toUpperCase() ?? "Y"
  const displayName = user?.email ?? "You"

  return (
    <Stack gap={4} h="100%">
      <Group gap="xs" px="xs" py={4} mb="sm" justify="space-between">
        <Group gap="xs">
          <Box
            w={26}
            h={26}
            bg="lime.4"
            c="#0a0d12"
            ff="monospace"
            fw={600}
            fz={14}
            style={{ borderRadius: 8, display: "grid", placeItems: "center" }}
          >
            L
          </Box>
          <Text fw={600}>LimeBalance</Text>
        </Group>

        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          hiddenFrom="sm"
          onClick={onClose}
          aria-label="Закрыть меню"
        >
          <IconX size={16} />
        </ActionIcon>
      </Group>

      <Text
        ff="monospace"
        size="xs"
        c="dimmed"
        tt="uppercase"
        px="xs"
        pb={6}
        pt="xs"
        style={{ letterSpacing: "0.06em" }}
      >
        Меню
      </Text>

      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.to
        return (
          <NavLink
            key={item.to}
            label={item.label}
            leftSection={
              <Icon
                size={18}
                style={{ color: isActive ? "var(--mantine-color-lime-4)" : undefined }}
              />
            }
            active={isActive}
            color="lime"
            variant="light"
            onClick={() => {
              navigate(item.to)
              onClose?.()
            }}
          />
        )
      })}

      <Text
        ff="monospace"
        size="xs"
        c="dimmed"
        tt="uppercase"
        px="xs"
        pb={6}
        pt="xl"
        style={{ letterSpacing: "0.06em" }}
      >
        Аккаунт
      </Text>
      <NavLink
        label="Настройки"
        leftSection={<IconSettings size={18} />}
        active={pathname === RouteNames.Settings}
        color="lime"
        variant="light"
        onClick={() => {
          navigate(RouteNames.Settings)
          onClose?.()
        }}
      />

      <Box hiddenFrom="sm">
        <Divider mb="xs" />
        <Group px="xs" mb="xs" gap="xs">
          <Indicator color="lime" size={8} offset={6} processing>
            <ActionIcon variant="default" size={36} aria-label="Уведомления">
              <IconBell size={18} />
            </ActionIcon>
          </Indicator>
          <LangSwitcher />
          <ThemeToggle />
        </Group>
      </Box>

      <Paper mt="auto" p="xs" withBorder>
        <Group gap="xs" wrap="nowrap">
          <Avatar size="sm" radius="xl" color="lime">
            {initials}
          </Avatar>
          <Box style={{ minWidth: 0, flex: 1 }}>
            <Text size="sm" truncate>
              {displayName}
            </Text>
            <Text size="xs" c="dimmed">
              Free
            </Text>
          </Box>
          <Tooltip label="Выйти" position="right">
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={handleLogout}>
              <IconLogout size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Paper>
    </Stack>
  )
}
