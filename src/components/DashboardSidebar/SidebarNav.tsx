import { NavLink, Text } from "@mantine/core"
import { useSidebarStore } from "@store/sidebarStore"
import { Fragment } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import { getNavGroups } from "./config"

/**
 * Группы навигации дашборда. Локально подписан на текущий путь (`useLocation`),
 * поэтому при навигации перерисовывается только этот блок, а не весь сайдбар.
 */
export function SidebarNav() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const close = useSidebarStore((s) => s.close)

  const navGroups = getNavGroups(t)

  return (
    <>
      {navGroups.map((group, groupIndex) => (
        <Fragment key={group.title}>
          <Text
            ff="monospace"
            size="xs"
            c="dimmed"
            tt="uppercase"
            px="xs"
            pb={6}
            pt={groupIndex === 0 ? "xs" : "xl"}
            style={{ letterSpacing: "0.06em" }}
          >
            {group.title}
          </Text>

          {group.items.map((item) => {
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
                  close()
                }}
              />
            )
          })}
        </Fragment>
      ))}
    </>
  )
}
