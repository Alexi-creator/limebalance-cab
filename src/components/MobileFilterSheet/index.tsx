import { ActionIcon, Badge, Box, Group, Overlay, Portal, Text, UnstyledButton } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useSidebarStore } from "@store/sidebarStore"
import { IconChevronUp, IconFilter, IconX } from "@tabler/icons-react"
import { type ReactNode, useEffect, useRef, useState } from "react"

interface Props {
  title: string
  closeLabel: string
  /** Shown as a badge on the handle; omit or 0 to hide it. */
  activeCount?: number
  /** The filter controls, laid out vertically (full width) for the sheet. */
  children: ReactNode
}

/**
 * Bottom-drawer shell for a filter panel that doesn't fit in a row below some breakpoint:
 * a handle peeking at the viewport's bottom edge slides `children` up in a sheet on tap.
 * Only mount this once already below that breakpoint — it measures/positions unconditionally,
 * same as the original this was extracted from (see TransactionsFilters).
 */
export function MobileFilterSheet({ title, closeLabel, activeCount = 0, children }: Props) {
  // While the mobile nav menu is open it covers the screen — hide the fixed handle/sheet so
  // they don't paint over the menu's content.
  const menuOpened = useSidebarStore((s) => s.opened)
  const [drawerOpened, drawer] = useDisclosure(false)

  // The handle/sheet should span the content area edge-to-edge (the `<main>` box), not
  // whatever inset card renders this — measured off a zero-height anchor and mirrored on
  // resize/sidebar toggles, since the sidebar changes `<main>`'s width too.
  const anchorRef = useRef<HTMLDivElement>(null)
  const [bounds, setBounds] = useState<{ left: number; right: number } | null>(null)
  useEffect(() => {
    const el = anchorRef.current
    if (!el) return
    const target = el.closest("main") ?? el
    const update = () => {
      const r = target.getBoundingClientRect()
      setBounds({ left: r.left, right: window.innerWidth - r.right })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(target)
    window.addEventListener("resize", update)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", update)
    }
  }, [])

  return (
    <>
      {/* zero-height marker measured to align the handle/sheet with the surrounding content */}
      <div ref={anchorRef} style={{ height: 0 }} />

      {!menuOpened && (
        <>
          {/* peeking handle pinned to the bottom edge, spanning the content width */}
          <Portal>
            <UnstyledButton
              onClick={drawer.open}
              aria-label={title}
              style={{
                position: "fixed",
                bottom: 0,
                left: bounds?.left ?? 0,
                right: bounds?.right ?? 0,
                zIndex: 190,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 16px",
                backgroundColor: "var(--mantine-color-body)",
                borderTop: "1px solid var(--mantine-color-default-border)",
                borderTopLeftRadius: "var(--mantine-radius-md)",
                borderTopRightRadius: "var(--mantine-radius-md)",
                boxShadow: "0 -2px 12px rgba(0, 0, 0, 0.25)",
              }}
            >
              <IconFilter size={16} />
              <Text size="sm" fw={500}>
                {title}
              </Text>
              {activeCount > 0 && (
                <Badge size="sm" variant="filled" circle>
                  {activeCount}
                </Badge>
              )}
              <IconChevronUp size={16} />
            </UnstyledButton>
          </Portal>

          {/* Own slide-up sheet instead of Mantine's bottom Drawer: a plain fixed box with
              left/right pinned to the content edges auto-sizes to that width (Mantine's Drawer
              forces an explicit full-viewport width on its inner, which overflowed/clipped).
              translateY drives the slide; it sits below the viewport when closed, so the
              peeking handle stays visible underneath. */}
          <Portal>
            {drawerOpened && (
              <Overlay onClick={drawer.close} zIndex={195} backgroundOpacity={0.55} />
            )}
            <Box
              style={{
                position: "fixed",
                bottom: 0,
                left: bounds?.left ?? 0,
                right: bounds?.right ?? 0,
                zIndex: 200,
                maxHeight: "80vh",
                overflowY: "auto",
                padding: "var(--mantine-spacing-md)",
                backgroundColor: "var(--mantine-color-body)",
                borderTop: "1px solid var(--mantine-color-default-border)",
                borderTopLeftRadius: "var(--mantine-radius-md)",
                borderTopRightRadius: "var(--mantine-radius-md)",
                boxShadow: "0 -2px 12px rgba(0, 0, 0, 0.25)",
                transform: drawerOpened ? "translateY(0)" : "translateY(101%)",
                transition: "transform 200ms ease",
              }}
            >
              <Group justify="space-between" mb="sm">
                <Text fw={600}>{title}</Text>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={drawer.close}
                  aria-label={closeLabel}
                >
                  <IconX size={18} />
                </ActionIcon>
              </Group>
              {children}
            </Box>
          </Portal>
        </>
      )}
    </>
  )
}
