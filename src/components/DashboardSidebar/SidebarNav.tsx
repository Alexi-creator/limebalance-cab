import { Box, NavLink, Text, Tooltip } from "@mantine/core"
import { useAuthStore } from "@store/authStore"
import { useSidebarStore } from "@store/sidebarStore"
import { IconLock } from "@tabler/icons-react"
import { hasInvestmentsAccess } from "@utils/subscription"
import { Fragment } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import { getNavGroups } from "./config"

/**
 * Dashboard navigation groups. Locally subscribed to the current path (`useLocation`),
 * so on navigation only this block re-renders, not the whole sidebar.
 */
export function SidebarNav() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const close = useSidebarStore((s) => s.close)
  const user = useAuthStore((s) => s.user)
  const canInvest = hasInvestmentsAccess(user)

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
            // Prefix match (with a trailing "/" boundary) so sub-routes keep the parent item
            // highlighted — e.g. /investments/journal, /settings/security.
            const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`)
            const isLocked = item.requiresPaid && !canInvest

            const link = (
              <NavLink
                label={item.label}
                leftSection={
                  <Icon
                    size={18}
                    style={{ color: isActive ? "var(--mantine-color-lime-4)" : undefined }}
                  />
                }
                rightSection={isLocked ? <IconLock size={14} /> : undefined}
                active={isActive}
                color="lime"
                variant="light"
                disabled={isLocked}
                onClick={() => {
                  if (isLocked) return
                  navigate(item.to)
                  close()
                }}
              />
            )

            // A disabled NavLink has pointer-events: none, so the tooltip listens on a
            // wrapper Box that still receives hover and explains how to unlock the section.
            if (isLocked) {
              return (
                <Tooltip
                  key={item.to}
                  label={t("nav.investmentsLocked")}
                  position="right"
                  withArrow
                  multiline
                  w={220}
                >
                  <Box>{link}</Box>
                </Tooltip>
              )
            }

            return <Fragment key={item.to}>{link}</Fragment>
          })}
        </Fragment>
      ))}
    </>
  )
}
