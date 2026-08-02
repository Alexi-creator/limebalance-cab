import { useCoinIcons } from "@hooks/useCoinIcons"
import { Box, useComputedColorScheme } from "@mantine/core"
import { useState } from "react"

interface Props {
  /** Bare coin ticker (BTC, ETH…) — for a position's exchange symbol, derive it first with
   *  baseAssetFromSymbol. */
  ticker: string
  size?: number
}

/**
 * Coin icon fetched via GET /investing/coin-icons (Bybit's Convert coin list, cached long both
 * server- and client-side — see useCoinIcons). Falls back to a letter avatar when the ticker
 * isn't in the map, or the image URL itself fails to load (dead CDN link, network hiccup…).
 */
export function CoinIcon({ ticker, size = 32 }: Props) {
  const { data } = useCoinIcons()
  const scheme = useComputedColorScheme("light")
  const [broken, setBroken] = useState(false)

  const icon = data?.items[ticker.toUpperCase()]
  const src = icon ? (scheme === "dark" ? icon.iconNight : icon.icon) : null

  if (src && !broken) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        style={{ borderRadius: 999, flexShrink: 0 }}
        onError={() => setBroken(true)}
      />
    )
  }

  return (
    <Box
      w={size}
      h={size}
      style={{
        borderRadius: 999,
        background: "var(--mantine-color-default)",
        border: "1px solid var(--mantine-color-default-border)",
        display: "grid",
        placeItems: "center",
        fontFamily: "var(--mantine-font-family-monospace)",
        fontWeight: 600,
        fontSize: Math.round(size * 0.3),
        flexShrink: 0,
      }}
    >
      {ticker.slice(0, 4)}
    </Box>
  )
}
