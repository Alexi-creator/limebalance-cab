import { Box } from "@mantine/core"
import { useEffect, useRef, useState } from "react"

interface Props {
  /** The element that actually scrolls horizontally (`overflow-x: auto`, e.g. a table wrapper).
   *  A plain node, not a ref object — the wrapper is often conditionally rendered (behind a
   *  loading state), so this must be able to arrive after mount and re-trigger the effect
   *  below; a `RefObject` doesn't change identity when `.current` changes, so an effect
   *  depending on it would never re-run once the node actually appears. */
  target: HTMLElement | null
  /** Extra space to leave at the viewport bottom — e.g. for a fixed mobile filter handle. */
  bottomOffset?: number
}

/**
 * A thin horizontal scrollbar pinned to the viewport's bottom edge, mirroring `target`'s
 * scroll position. For a wide element (a table with many columns) whose own scrollbar sits
 * below the fold on a tall page — without this, panning it means scrolling the whole page
 * down to reach that scrollbar first. Shown only while `target` actually overflows AND its
 * own bottom edge (where its native scrollbar renders) isn't currently on screen.
 */
export function StickyScrollbarX({ target, bottomOffset = 0 }: Props) {
  const proxyRef = useRef<HTMLDivElement>(null)
  const [scrollWidth, setScrollWidth] = useState(0)
  const [clientWidth, setClientWidth] = useState(0)
  const [bounds, setBounds] = useState<{ left: number; right: number } | null>(null)
  const [showSticky, setShowSticky] = useState(false)
  // Guards against the target→proxy and proxy→target scroll listeners echoing each other.
  const syncingRef = useRef<"target" | "proxy" | null>(null)

  useEffect(() => {
    if (!target) return

    const updateSize = () => {
      setScrollWidth(target.scrollWidth)
      setClientWidth(target.clientWidth)
      // Bounds must come from `target` itself, not an ancestor — the proxy's own width has to
      // match target.clientWidth exactly, otherwise dragging the proxy to its end sets
      // target.scrollLeft short of its real max (scrollWidth - clientWidth), permanently
      // hiding the last slice of content behind the pinned column (e.g. the journal table's
      // last data column, covered by the sticky actions column).
      const r = target.getBoundingClientRect()
      setBounds({ left: r.left, right: window.innerWidth - r.right })
    }

    let raf = 0
    const updateVisibility = () => {
      const rect = target.getBoundingClientRect()
      const inViewport = rect.top < window.innerHeight && rect.bottom > 0
      // The target's own scrollbar renders at its bottom edge — visible once that's on screen.
      const nativeScrollbarBelowFold = rect.bottom > window.innerHeight
      setShowSticky(
        target.scrollWidth > target.clientWidth + 1 && inViewport && nativeScrollbarBelowFold,
      )
    }
    const onScrollOrResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(updateVisibility)
    }

    updateSize()
    updateVisibility()

    const ro = new ResizeObserver(() => {
      updateSize()
      updateVisibility()
    })
    ro.observe(target)
    window.addEventListener("resize", updateSize)
    // The page's actual scrolling ancestor is an inner `<main>`, not the window, and "scroll"
    // doesn't bubble — capture:true still catches it (capture dispatch walks the ancestor
    // chain top-down regardless of the event's own bubbling).
    window.addEventListener("scroll", onScrollOrResize, { passive: true, capture: true })

    const onTargetScroll = () => {
      if (syncingRef.current === "proxy") return
      syncingRef.current = "target"
      if (proxyRef.current) proxyRef.current.scrollLeft = target.scrollLeft
      syncingRef.current = null
    }
    target.addEventListener("scroll", onTargetScroll, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener("resize", updateSize)
      window.removeEventListener("scroll", onScrollOrResize, true)
      target.removeEventListener("scroll", onTargetScroll)
    }
  }, [target])

  const onProxyScroll = () => {
    if (syncingRef.current === "target") return
    const proxy = proxyRef.current
    if (!target || !proxy) return
    syncingRef.current = "proxy"
    target.scrollLeft = proxy.scrollLeft
    syncingRef.current = null
  }

  if (!showSticky || !bounds || scrollWidth <= clientWidth) return null

  return (
    <Box
      ref={proxyRef}
      className="sticky-scroll-x"
      onScroll={onProxyScroll}
      style={{
        position: "fixed",
        bottom: bottomOffset,
        left: bounds.left,
        right: bounds.right,
        zIndex: 150,
        overflowX: "auto",
        overflowY: "hidden",
        height: 14,
        backgroundColor: "var(--mantine-color-body)",
        borderTop: "1px solid var(--mantine-color-default-border)",
      }}
    >
      <div style={{ width: scrollWidth, height: 1 }} />
    </Box>
  )
}
