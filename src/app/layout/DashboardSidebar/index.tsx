import { Box, ScrollArea, Stack, useMantineTheme } from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import { useCallback, useEffect, useRef, useState } from "react"
import { SidebarBrand } from "./SidebarBrand"
import { SidebarMobileExtras } from "./SidebarMobileExtras"
import { SidebarNav } from "./SidebarNav"
import { SidebarTelegram } from "./SidebarTelegram"
import { SidebarUserCard } from "./SidebarUserCard"

/**
 * Dashboard navigation sidebar — a thin composition shell.
 * Each sub-block (brand, navigation, mobile extras, user card) keeps its hooks locally, which
 * limits the re-render area; the shell itself only tracks the breakpoint and whether the
 * menu has more items below the fold.
 *
 * Brand stays pinned at the top, the user card at the bottom, and the navigation in
 * between scrolls on its own — so a short viewport (notably mobile) never clips the menu.
 * On mobile (the drawer, below `sm`) the Telegram card scrolls with the menu instead of being
 * pinned: it's a one-off promo, and pinned it eats ~70px of an already short drawer.
 */
export function DashboardSidebar() {
  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: calc(${theme.breakpoints.sm} - 0.01em))`, false, {
    getInitialValueInEffect: false,
  })
  const viewportRef = useRef<HTMLDivElement>(null)
  // The pinned bottom block sits flush against the scrolling menu in the same color — without a
  // separator you can't tell there are more items hidden under it. Shown only while there are.
  const [hasMoreBelow, setHasMoreBelow] = useState(false)

  const updateHasMoreBelow = useCallback(() => {
    const el = viewportRef.current
    if (!el) return
    setHasMoreBelow(el.scrollHeight - el.clientHeight - el.scrollTop > 1)
  }, [])

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    // Viewport resizes with the window; its content grows/shrinks with the menu (mobile extras,
    // the Telegram card moving in and out, language-dependent label wrapping).
    const ro = new ResizeObserver(updateHasMoreBelow)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    updateHasMoreBelow()
    return () => ro.disconnect()
  }, [updateHasMoreBelow])

  return (
    <Stack gap={4} h="100%">
      <SidebarBrand />
      <ScrollArea
        style={{ flex: 1 }}
        type="auto"
        offsetScrollbars
        viewportRef={viewportRef}
        onScrollPositionChange={updateHasMoreBelow}
      >
        <Stack gap={4}>
          <SidebarNav />
          <SidebarMobileExtras />
          {isMobile && (
            <Box pt="xs">
              <SidebarTelegram />
            </Box>
          )}
        </Stack>
      </ScrollArea>
      <Box
        mx="calc(-1 * var(--mantine-spacing-md))"
        px="md"
        pt={4}
        style={{
          // positioned so its shadow paints over the menu's text, not under it
          position: "relative",
          zIndex: 1,
          borderTop: `1px solid ${hasMoreBelow ? "var(--mantine-color-default-border)" : "transparent"}`,
          boxShadow: hasMoreBelow ? "0 -10px 12px -10px rgba(0, 0, 0, 0.45)" : "none",
          transition: "box-shadow 150ms ease, border-color 150ms ease",
        }}
      >
        {!isMobile && <SidebarTelegram />}
        <SidebarUserCard />
      </Box>
    </Stack>
  )
}
