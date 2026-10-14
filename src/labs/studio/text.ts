/** Adapted from David Blumenau's Kitforge, revision 809d559d8c54e1f44385100ab336d2e988b4a84a. See PROVENANCE.md. */
/**
 * Text fitting over `ctx.measureText`. Pure: the helpers set `ctx.font` while measuring and
 * leave it at the size they picked, so the caller draws with exactly what was measured.
 */

/** Either 2D context: the renderer never reads `ctx.canvas`, so both draw identically. */
export type RenderContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

export interface FitOptions {
  weight: number
  family: string
  /** Starting (largest) size. */
  size: number
  /** Floor the shrink loop stops at, even when the text still overflows. */
  minSize: number
  maxWidth: number
}

const ELLIPSIS = '…'

export function fontString(weight: number, size: number, family: string): string {
  return `${weight} ${size}px ${family}`
}

/**
 * Largest integer size in `[minSize, size]` whose single line fits `maxWidth`. Glyph widths
 * scale linearly with the font size, so one measurement gives the estimate and the loop only
 * walks off hinting rounding.
 */
export function fitFontSize(ctx: RenderContext, text: string, options: FitOptions): number {
  const ceiling = Math.max(options.size, options.minSize)
  if (!text) return ceiling

  ctx.font = fontString(options.weight, ceiling, options.family)
  const full = ctx.measureText(text).width
  if (full <= options.maxWidth || full <= 0) return ceiling

  let size = Math.max(options.minSize, Math.floor((ceiling * options.maxWidth) / full))
  while (size > options.minSize) {
    ctx.font = fontString(options.weight, size, options.family)
    if (ctx.measureText(text).width <= options.maxWidth) break
    size -= 1
  }
  ctx.font = fontString(options.weight, size, options.family)
  return size
}

/** Longest prefix of `text` that fits `maxWidth` once an ellipsis is appended. */
export function ellipsize(ctx: RenderContext, text: string, maxWidth: number): string {
  if (!text || ctx.measureText(text).width <= maxWidth) return text

  const fits = (length: number): boolean =>
    ctx.measureText(`${text.slice(0, length).trimEnd()}${ELLIPSIS}`).width <= maxWidth

  let low = 0
  let high = text.length
  while (low < high) {
    const mid = Math.ceil((low + high) / 2)
    if (fits(mid)) low = mid
    else high = mid - 1
  }
  return low > 0 ? `${text.slice(0, low).trimEnd()}${ELLIPSIS}` : ELLIPSIS
}

/**
 * Greedy word wrap with hard breaks on newlines. Beyond `maxLines` the overflow is folded back
 * into the last kept line and ellipsised; any single word wider than `maxWidth` is ellipsised too.
 */
export function wrapLines(
  ctx: RenderContext,
  text: string,
  maxWidth: number,
  maxLines = Number.POSITIVE_INFINITY,
): string[] {
  const lines: string[] = []

  for (const paragraph of text.split(/\r?\n/)) {
    let current = ''
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = current ? `${current} ${word}` : word
      if (!current || ctx.measureText(candidate).width <= maxWidth) {
        current = candidate
        continue
      }
      lines.push(current)
      current = word
    }
    if (current) lines.push(current)
  }

  if (lines.length > maxLines && maxLines >= 1) {
    const kept = lines.slice(0, maxLines)
    kept[maxLines - 1] = lines.slice(maxLines - 1).join(' ')
    return kept.map((line) => ellipsize(ctx, line, maxWidth))
  }

  return lines.map((line) => ellipsize(ctx, line, maxWidth))
}
