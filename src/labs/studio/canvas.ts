/** Adapted from David Blumenau's Kitforge, revision 809d559d8c54e1f44385100ab336d2e988b4a84a. See PROVENANCE.md. */
import type { RenderContext } from './render'
import { layouts } from './layout'

/** Export resolution, taken from the template space `render()` draws in. */
export const EXPORT_WIDTH = layouts.square.width
export const EXPORT_HEIGHT = layouts.square.height

export type ExportCanvas = HTMLCanvasElement | OffscreenCanvas
export type ExportContext = RenderContext

export interface ExportSurface {
  canvas: ExportCanvas
  ctx: ExportContext
}

/**
 * A detached 1080-square surface for one export. `OffscreenCanvas` is preferred because
 * `VideoFrame` accepts it directly and it never touches the document's layout; a plain
 * `<canvas>` is the fallback. The context is opaque: JPEG and H.264 both discard alpha,
 * and skipping the alpha channel saves a compositing pass per frame.
 */
export function createExportCanvas(
  width: number = EXPORT_WIDTH,
  height: number = EXPORT_HEIGHT,
): ExportSurface {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d', { alpha: false })
    if (ctx) return { canvas, ctx }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('This browser cannot open a 2D canvas for export')
  return { canvas, ctx }
}

/** `convertToBlob` on `OffscreenCanvas`, `toBlob` on `<canvas>`. */
export function canvasToBlob(canvas: ExportCanvas, type: string, quality: number): Promise<Blob> {
  if ('convertToBlob' in canvas) return canvas.convertToBlob({ type, quality })

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(`This browser cannot encode ${type}`))),
      type,
      quality,
    )
  })
}
