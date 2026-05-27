import { logout } from "@api/auth"
import { RouteNames } from "@constants/routeNames"
import { ActionIcon, Avatar, Box, Group, NavLink, Paper, Stack, Text, Tooltip } from "@mantine/core"
import { useAuthStore } from "@store/authStore"
import {
  IconChartHistogram,
  IconCoin,
  IconHome,
  IconListDetails,
  IconLogout,
  IconSettings,
  IconTags,
  IconTarget,
} from "@tabler/icons-react"
import { useLocation, useNavigate } from "react-router-dom"

const navItems = [
  { to: RouteNames.Home, label: "Обзор", icon: IconHome },
  { to: RouteNames.Transactions, label: "Операции", icon: IconListDetails, badge: "324" },
  { to: RouteNames.Categories, label: "Категории", icon: IconTags },
  { to: RouteNames.Analytics, label: "Аналитика", icon: IconChartHistogram },
  { to: RouteNames.Goals, label: "Цели", icon: IconTarget, badge: "4" },
  { to: RouteNames.Investments, label: "Инвестиции", icon: IconCoin },
]

export function DashboardSidebar() {
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
      <Group gap="xs" px="xs" py={4} mb="sm">
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
          C
        </Box>
        <Text fw={600}>Cashflowy</Text>
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
            rightSection={
              item.badge ? (
                <Text ff="monospace" size="xs" c="dimmed">
                  {item.badge}
                </Text>
              ) : undefined
            }
            active={isActive}
            color="lime"
            variant="light"
            onClick={() => navigate(item.to)}
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
        onClick={() => navigate(RouteNames.Settings)}
      />

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
