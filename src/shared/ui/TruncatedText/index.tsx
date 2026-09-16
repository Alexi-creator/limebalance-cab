import { Text, type TextProps, Tooltip } from "@mantine/core"
import { useEffect, useRef, useState } from "react"

interface Props extends Omit<TextProps, "truncate"> {
  children: string
}

/**
 * One line of text cut with an ellipsis, with the full text in a tooltip — but only once it is
 * actually cut. Keeps cards in a row the same height no matter how long what the user typed is.
 */
export function TruncatedText({ children, ...props }: Props) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [cut, setCut] = useState(false)

  // Watched rather than checked on hover: the width changes with the grid breakpoint.
  // biome-ignore lint/correctness/useExhaustiveDependencies: new text can overflow a box that did not resize
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => setCut(el.scrollWidth > el.clientWidth)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [children])

  return (
    <Tooltip label={children} disabled={!cut} multiline maw={320} withArrow>
      <Text ref={ref} truncate="end" {...props}>
        {children}
      </Text>
    </Tooltip>
  )
}
