/** Adapted from David Blumenau's Kitforge, revision 809d559d8c54e1f44385100ab336d2e988b4a84a. See PROVENANCE.md. */
import { colors, familyFor, weights } from './brand'
import { layouts, type Layout, type TextRow } from './layout'
import { resolveTemplate } from './templates'
import { frameAt } from './frames'
import { ellipsize, fitFontSize, fontString, wrapLines, type RenderContext } from './text'
import type { KitDoc, TextField } from './types'

export type { RenderContext } from './text'

/** A box in template space. */
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** The photo's placement inside its slot: a multiplier over cover-fit plus a centred offset. */
export interface PhotoTransform {
  offsetX: number
  offsetY: number
  scale: number
}

/** Cover-fit is the floor, so the rounded clip can never show empty space. */
export const MIN_PHOTO_SCALE = 1
export const MAX_PHOTO_SCALE = 6

const TEXT_SHADOW = 'rgba(0, 0, 0, 0.45)'
const TEXT_SHADOW_BLUR = 18
const TEXT_SHADOW_OFFSET_Y = 3
const TITLE_ALPHA = 0.85
/** Portfolio adaptation: clear headline descenders before the metadata stack begins. */
const HEADLINE_METADATA_GAP = 24

/**
 * The only drawing code in the app. Preview and export both call it, which is what makes
 * the export WYSIWYG. Pure: no DOM access, no async, no module state — the same `doc` and
 * `timeMs` always produce the same pixels.
 */
export function render(ctx: RenderContext, doc: KitDoc, timeMs: number): void {
  const layout = compositionLayout(doc)

  ctx.save()

  ctx.fillStyle = colors.ground
  ctx.fillRect(0, 0, layout.width, layout.height)

  const frame = frameAt(doc.background, timeMs)
  if (frame) drawCover(ctx, frame.image, layout.width, layout.height)

  drawPhoto(ctx, doc, layout)
  drawLogo(ctx, doc.companyLogo.image, layout.companyLogo, 'left')
  drawLogo(ctx, doc.eventLogo.image, layout.eventLogo, 'right')
  drawText(ctx, doc, layout)

  ctx.restore()
}

/** Where the photo lands in template space. Falls back to the bare slot when there is no image. */
export function photoDrawRect(doc: KitDoc, layout: Layout): Rect {
  const slot = layout.photo
  const image = doc.photo.image
  if (!image || !image.width || !image.height) {
    return { x: slot.x, y: slot.y, w: slot.w, h: slot.h }
  }
  return placeInSlot(layout, image.width, image.height, doc.photo)
}

/** Keeps `scale` at or above cover-fit and the pan inside the image, so the clip is always full. */
export function clampPhotoTransform(
  transform: PhotoTransform,
  layout: Layout,
  imgW: number,
  imgH: number,
): PhotoTransform {
  const scale = clamp(finite(transform.scale, 1), MIN_PHOTO_SCALE, MAX_PHOTO_SCALE)
  const offsetX = finite(transform.offsetX, 0)
  const offsetY = finite(transform.offsetY, 0)
  if (imgW <= 0 || imgH <= 0) return { offsetX: 0, offsetY: 0, scale }

  const slot = layout.photo
  const rect = placeInSlot(layout, imgW, imgH, { offsetX: 0, offsetY: 0, scale })
  const roomX = Math.max(0, (rect.w - slot.w) / 2)
  const roomY = Math.max(0, (rect.h - slot.h) / 2)

  return {
    offsetX: clamp(offsetX, -roomX, roomX),
    offsetY: clamp(offsetY, -roomY, roomY),
    scale,
  }
}

/** The transform a freshly picked photo starts at: cover-fit, centred. */
export function resetPhotoTransform(): PhotoTransform {
  return { offsetX: 0, offsetY: 0, scale: MIN_PHOTO_SCALE }
}

function placeInSlot(layout: Layout, imgW: number, imgH: number, transform: PhotoTransform): Rect {
  const slot = layout.photo
  const base = Math.max(slot.w / imgW, slot.h / imgH) * transform.scale
  const w = imgW * base
  const h = imgH * base
  return {
    x: slot.x + (slot.w - w) / 2 + transform.offsetX,
    y: slot.y + (slot.h - h) / 2 + transform.offsetY,
    w,
    h,
  }
}

function drawPhoto(ctx: RenderContext, doc: KitDoc, layout: Layout): void {
  const image = doc.photo.image
  if (!doc.photo.visible || !image || !image.width || !image.height) return

  const slot = layout.photo
  const rect = photoDrawRect(doc, layout)

  ctx.save()
  ctx.beginPath()
  roundRectPath(ctx, slot.x, slot.y, slot.w, slot.h, slot.radius)
  ctx.clip()
  ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h)
  ctx.restore()
}

/**
 * Contain-fit inside the box and top-aligned, with `align` picking the edge the logo hugs.
 * An empty slot draws nothing at all.
 */
function drawLogo(
  ctx: RenderContext,
  image: ImageBitmap | null,
  box: Rect,
  align: 'left' | 'right',
): void {
  if (!image || !image.width || !image.height) return

  const scale = Math.min(box.w / image.width, box.h / image.height)
  const width = image.width * scale
  const height = image.height * scale
  const x = align === 'right' ? box.x + box.w - width : box.x

  ctx.drawImage(image, x, box.y, width, height)
}

function drawText(ctx: RenderContext, doc: KitDoc, layout: Layout): void {
  const template = resolveTemplate(doc)
  const wide = !doc.photo.visible
  const headlineWidth = wide ? layout.photoHiddenTextMaxWidth : layout.headline.maxWidth
  const rowWidth = (row: TextRow): number => (wide ? layout.photoHiddenTextMaxWidth : row.maxWidth)
  // The logo band is always reserved, so the text block starts below it however empty it is.
  const band = layout.logoBandHeight

  const fontFamily = familyFor(doc.font)
  ctx.textAlign = doc.composition === 'center' ? 'center' : 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = doc.textColor
  // Dark text needs no lift off the background; the shadow only helps light text read.
  const shadow = isLight(doc.textColor)
  ctx.shadowColor = shadow ? TEXT_SHADOW : 'transparent'
  ctx.shadowBlur = shadow ? TEXT_SHADOW_BLUR : 0
  ctx.shadowOffsetY = shadow ? TEXT_SHADOW_OFFSET_Y : 0

  ctx.font = fontString(weights.prefix, layout.prefix.size, fontFamily)
  ctx.fillText(
    ellipsize(ctx, template.prefix, headlineWidth),
    layout.prefix.x,
    layout.prefix.y + band,
  )

  const headlineSize = fitFontSize(ctx, template.headline, {
    weight: weights.headline,
    family: fontFamily,
    size: layout.headline.size,
    minSize: layout.headline.minSize,
    maxWidth: headlineWidth,
  })
  let lastHeadlineBaseline = layout.headline.y + band
  let headlineBottom = lastHeadlineBaseline
  const drawHeadline = (line: string, baseline: number) => {
    const metrics = ctx.measureText(line)
    headlineBottom = Math.max(headlineBottom, baseline + glyphExtent(metrics.actualBoundingBoxDescent, headlineSize * 0.25))
    ctx.fillText(line, layout.headline.x, baseline)
  }
  if (ctx.measureText(template.headline).width <= headlineWidth) {
    drawHeadline(template.headline, lastHeadlineBaseline)
  } else {
    const lines = wrapLines(ctx, template.headline, headlineWidth, 2)
    for (let index = 0; index < lines.length; index += 1) {
      lastHeadlineBaseline =
        layout.headline.y + band + index * headlineSize * layout.headline.lineHeight
      drawHeadline(lines[index] ?? '', lastHeadlineBaseline)
    }
  }

  // Hidden blocks collapse: the stack keeps its baseline rhythm and everything below moves up.
  // A row that wraps pushes the rows under it down by its extra lines.
  const lead = Math.max(layout.eventName.size, layout.name.size) * 0.6
  const top = layout.eventName.y + band
  let baseline = top + Math.max(0, lastHeadlineBaseline + lead - top)

  const rows: { field: TextField; row: TextRow; weight: number; alpha: number; step: number }[] = [
    {
      field: doc.eventName,
      row: layout.eventName,
      weight: weights.eventName,
      alpha: 1,
      step: layout.name.y - layout.eventName.y,
    },
    {
      field: doc.name,
      row: layout.name,
      weight: weights.name,
      alpha: 1,
      step: layout.title.y - layout.name.y,
    },
    {
      field: doc.title,
      row: layout.title,
      weight: weights.title,
      alpha: TITLE_ALPHA,
      step: layout.company.y - layout.title.y,
    },
    {
      field: doc.company,
      row: layout.company,
      weight: weights.title,
      alpha: TITLE_ALPHA,
      step: 0,
    },
  ]

  let firstVisible = true
  for (const { field, row, weight, alpha, step } of rows) {
    const text = field.text.replace(/\s+/g, ' ').trim()
    if (!field.visible || !text) continue
    ctx.globalAlpha = alpha
    const drawn = drawRow(ctx, text, row, weight, rowWidth(row), baseline, fontFamily, firstVisible ? headlineBottom + HEADLINE_METADATA_GAP : undefined)
    ctx.globalAlpha = 1
    baseline = drawn.baseline + step + drawn.extra
    firstVisible = false
  }
}

/**
 * One text row: shrinks towards `row.minSize` to stay on a line, then wraps to `row.maxLines`
 * at that floor. Returns its drawn baseline and extra line height for the rows under it.
 */
function drawRow(
  ctx: RenderContext,
  text: string,
  row: TextRow,
  weight: number,
  maxWidth: number,
  baseline: number,
  fontFamily: string,
  minimumTop?: number,
): { baseline: number; extra: number } {
  const size = fitFontSize(ctx, text, {
    weight,
    family: fontFamily,
    size: row.size,
    minSize: row.minSize,
    maxWidth,
  })
  const lines = wrapLines(ctx, text, maxWidth, row.maxLines)
  // Fit first, then use the actual drawn glyphs. Keep the nominal baseline if already clear.
  if (minimumTop !== undefined) {
    const ascent = Math.max(...lines.map(line => glyphExtent(ctx.measureText(line).actualBoundingBoxAscent, size)), 0)
    baseline = Math.max(baseline, minimumTop + ascent)
  }
  const lineStep = size * row.lineHeight
  for (let index = 0; index < lines.length; index += 1) {
    ctx.fillText(lines[index] ?? '', row.x, baseline + index * lineStep)
  }
  return { baseline, extra: (lines.length - 1) * lineStep }
}

/** Older canvas implementations may not expose glyph bounds; keep a conservative font-size floor. */
function glyphExtent(value: number, fallback: number): number { return Number.isFinite(value) && value >= 0 ? value : fallback }

/** Relative luminance over 0.5 on a `#rrggbb` string; anything unparseable counts as light. */
function isLight(hex: string): boolean {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return true
  const value = Number.parseInt(match[1] ?? 'ffffff', 16)
  const r = (value >> 16) & 0xff
  const g = (value >> 8) & 0xff
  const b = value & 0xff
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.5
}

/** Cover-fit: fill the frame, centre the overflow, never letterbox. */
function drawCover(
  ctx: RenderContext,
  image: CanvasImageSource & { width: number; height: number },
  width: number,
  height: number,
): void {
  if (!image.width || !image.height) return
  const scale = Math.max(width / image.width, height / image.height)
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale
  ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight)
}

function roundRectPath(
  ctx: RenderContext,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r)
    return
  }
  const radius = Math.min(r, w / 2, h / 2)
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback
}

/** Portfolio-specific composition around Kitforge's unchanged row-fitting mechanism. */
function compositionLayout(doc: KitDoc): Layout {
 const base = layouts[doc.aspect]
 const centered = doc.composition === 'center'
 const x = centered ? 540 : 72
 const delta = doc.composition === 'corner' ? -50 : centered ? 20 : 0
 return {...base, logoBandHeight:0,
  prefix:{...base.prefix,x,y:180+delta},
  headline:{...base.headline,x,y:355+delta,size:120*doc.headlineScale,minSize:88*doc.headlineScale},
  eventName:{...base.eventName,x,y:470+delta},
  name:{...base.name,x,y:568+delta},
  title:{...base.title,x,y:645+delta},
  company:{...base.company,x,y:691+delta},
 }
}
