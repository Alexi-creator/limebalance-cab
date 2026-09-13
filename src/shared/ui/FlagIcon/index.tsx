interface Props {
  /** ISO 3166-1 alpha-2, lowercase — the filename in `public/flags`. */
  region: string
  size?: number
}

/**
 * Round country flag, served from `public/flags` (circle-flags, MIT — see the README there).
 * Vendored rather than drawn with emoji: Windows ships no glyphs for the regional-indicator pairs,
 * so 🇺🇸 renders there as the bare letters "US" in Chrome, Edge and Firefox.
 *
 * Decorative by design — every flag in the UI sits next to the language's own name, so it carries
 * no information of its own and stays out of the accessibility tree.
 */
export function FlagIcon({ region, size = 18 }: Props) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}flags/${region}.svg`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      style={{ display: "block", flexShrink: 0 }}
    />
  )
}
