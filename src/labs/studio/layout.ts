/** Adapted from David Blumenau's Kitforge, revision 809d559d8c54e1f44385100ab336d2e988b4a84a. See PROVENANCE.md. */
import type { AspectId } from './types'

/**
 * Every coordinate is in template space, so the preview's CSS size never affects output.
 * Text `y` values are baselines; `photo` and logo `y` values are box tops.
 */
export interface TextRow {
  x: number
  y: number
  maxWidth: number
  size: number
  minSize: number
  lineHeight: number
  maxLines: number
}

export interface Layout {
  width: number
  height: number
  padding: number
  /** Contain-fit box for the company logo, left- and top-aligned inside it. */
  companyLogo: { x: number; y: number; w: number; h: number }
  /** Contain-fit box for the event logo, right- and top-aligned inside it. */
  eventLogo: { x: number; y: number; w: number; h: number }
  /** The band the two logo boxes sit in: every text baseline below is offset by this much. */
  logoBandHeight: number
  prefix: { x: number; y: number; size: number }
  headline: {
    x: number
    y: number
    maxWidth: number
    size: number
    minSize: number
    lineHeight: number
  }
  /** Rows shrink to `minSize` first, then wrap to `maxLines`. */
  eventName: TextRow
  name: TextRow
  title: TextRow
  /** Drawn on its own row under the title. */
  company: TextRow
  photo: { x: number; y: number; w: number; h: number; radius: number }
  /** Width every text row may use once the photo slot is collapsed. */
  photoHiddenTextMaxWidth: number
}

export const layouts: Record<AspectId, Layout> = {
  square: {
    width: 1080,
    height: 1080,
    padding: 72,
    companyLogo: { x: 72, y: 72, w: 352, h: 132 },
    eventLogo: { x: 722, y: 72, w: 286, h: 132 },
    logoBandHeight: 96,
    prefix: { x: 72, y: 168, size: 44 },
    headline: { x: 72, y: 328, maxWidth: 936, size: 156, minSize: 88, lineHeight: 1.04 },
    eventName: {
      x: 72,
      y: 436,
      maxWidth: 470,
      size: 44,
      minSize: 32,
      lineHeight: 1.2,
      maxLines: 2,
    },
    name: { x: 72, y: 521, maxWidth: 470, size: 66, minSize: 44, lineHeight: 1.1, maxLines: 2 },
    title: { x: 72, y: 587, maxWidth: 470, size: 34, minSize: 28, lineHeight: 1.35, maxLines: 2 },
    company: { x: 72, y: 633, maxWidth: 470, size: 34, minSize: 28, lineHeight: 1.35, maxLines: 2 },
    photo: { x: 576, y: 576, w: 432, h: 432, radius: 40 },
    photoHiddenTextMaxWidth: 936,
  },
}
