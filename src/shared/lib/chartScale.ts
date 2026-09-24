/** A value axis with "nice" round bounds and evenly spaced ticks (top → bottom). */
export interface ChartScale {
  min: number
  max: number
  /** Tick values from the top of the plot down to the bottom. */
  ticks: number[]
}

/** Rounds a raw step up to 1 / 2 / 2.5 / 5 × 10ⁿ — the steps a human reads at a glance. */
function niceStep(raw: number): number {
  const pow = 10 ** Math.floor(Math.log10(raw))
  const unit = raw / pow
  const nice = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 2.5 ? 2.5 : unit <= 5 ? 5 : 10
  return nice * pow
}

/**
 * Round axis bounds covering [min, max] with roughly `count` intervals, e.g. a max of 1 234 567
 * becomes 0 · 400k · 800k · 1.2M · 1.6M instead of 0 · 308642 · 617284 …
 */
export function niceScale(min: number, max: number, count = 4): ChartScale {
  const top = max > min ? max : min + 1
  // money axes: never step below 1, otherwise an empty/tiny series gets "0.3"-style ticks
  const step = Math.max(1, niceStep((top - min) / count))
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(top / step) * step
  const ticks: number[] = []
  // integer loop + multiply avoids float drift from repeated `+= step`
  for (let i = Math.round((hi - lo) / step); i >= 0; i--) ticks.push(lo + i * step)
  return { min: lo, max: hi, ticks }
}

/** Compact axis label: 950 → "950", 12 500 → "12.5k", 1 200 000 → "1.2M". */
export function formatAxisValue(value: number, locale: string): string {
  const abs = Math.abs(value)
  const [div, suffix] =
    abs >= 1e9 ? [1e9, "B"] : abs >= 1e6 ? [1e6, "M"] : abs >= 1e3 ? [1e3, "k"] : [1, ""]
  const num = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(abs / div)
  return `${value < 0 ? "−" : ""}${num}${suffix}`
}

/** Approximate width of a monospace SVG label (glyph ≈ 0.6em). */
export function monoTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.6
}

/**
 * Left padding that fits the widest Y-axis label plus a gap — keeps the scale readable on
 * narrow screens instead of clipping it at a fixed offset.
 */
export function axisPadLeft(labels: string[], fontSize: number, gap = 10): number {
  return Math.ceil(Math.max(0, ...labels.map((l) => monoTextWidth(l, fontSize))) + gap)
}

/**
 * Every how many X-axis slots to print a label so neighbours never overlap: 1 when they fit,
 * 2 / 3 / … on a narrow chart.
 */
export function xLabelStep(labels: string[], slotWidth: number, fontSize: number): number {
  const widest = Math.max(0, ...labels.map((l) => monoTextWidth(l, fontSize)))
  if (widest === 0 || slotWidth <= 0) return 1
  return Math.max(1, Math.ceil((widest + 6) / slotWidth))
}
