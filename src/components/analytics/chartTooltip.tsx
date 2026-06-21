import { Box } from "@mantine/core"
import { type MouseEvent, type ReactNode, useRef, useState } from "react"

interface TipState {
  x: number
  y: number
  text: string
}

/**
 * Lightweight cursor-following tooltip for the raw-SVG analytics charts (native `<title>` is
 * unreliable / delayed). `wrapRef` goes on a `position: relative` container; call `show` from a
 * shape's `onMouseMove` and `hide` from `onMouseLeave`, then render `<ChartTooltip tip={tip} />`.
 */
export function useChartTooltip() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<TipState | null>(null)

  const show = (e: MouseEvent, text: string) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, text })
  }
  const hide = () => setTip(null)

  return { wrapRef, tip, show, hide }
}

export function ChartTooltip({ tip }: { tip: TipState | null }) {
  if (!tip) return null
  return (
    <Box
      style={{
        position: "absolute",
        left: tip.x + 12,
        top: tip.y + 12,
        pointerEvents: "none",
        background: "var(--mantine-color-body)",
        border: "1px solid var(--mantine-color-default-border)",
        borderRadius: 6,
        padding: "4px 8px",
        fontSize: 12,
        whiteSpace: "nowrap",
        boxShadow: "var(--mantine-shadow-sm)",
        zIndex: 10,
      }}
    >
      {tip.text as ReactNode}
    </Box>
  )
}
