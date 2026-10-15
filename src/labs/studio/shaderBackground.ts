/** Adapted from David Blumenau's Kitforge, revision 809d559d8c54e1f44385100ab336d2e988b4a84a. See PROVENANCE.md. */
import { ShaderMount } from './vendor/paper/shader-mount.js'
import { ShaderFitOptions } from './vendor/paper/shader-sizing.js'
import { emptyPixel } from './vendor/paper/empty-pixel.js'
import { getShaderColorFromString } from './vendor/paper/get-shader-color-from-string.js'
import { liquidMetalFragmentShader, LiquidMetalShapes } from './vendor/paper/shaders/liquid-metal.js'

import type { ShaderBackgroundPreset } from './shaderBackgrounds'
import type { BackgroundFrame, DecodedBackground } from './types'

/** Side of the baked square, in pixels. Cover-fitted up to the 1080 template by `render()`. */
export const SHADER_SIZE = 768

/** Frames per second the loop is baked at. */
export const SHADER_FPS = 20

/** Length of one pass of the baked loop. */
export const SHADER_LOOP_MS = 4000

/**
 * Length of the dissolve that closes the loop. `liquidMetal` translates through simplex noise
 * (`snoise(uv - t)`), so it never returns to an earlier state and has no true period: baking a
 * plain window would jump on every repeat. The tail is instead cross-faded back into the head.
 */
export const SHADER_BLEND_MS = 1000

/** Side of a wizard thumbnail. */
export const SHADER_THUMB_SIZE = 96

/** How long to wait for the mount's ResizeObserver to size the canvas before giving up. */
const SIZING_TIMEOUT_MS = 2000

/** Frames between progress reports, and between yields back to the UI thread. */
const PROGRESS_EVERY = 5
const YIELD_EVERY = 10

/** A browser that cannot run the shader at all. The message is user-facing; show it as is. */
export class ShaderUnsupportedError extends Error {
  constructor(message = 'This browser cannot show animated backgrounds: WebGL2 is unavailable.') {
    super(message)
    this.name = 'ShaderUnsupportedError'
  }
}

export interface BakeShaderOptions {
  size?: number
  fps?: number
  durationMs?: number
  blendMs?: number
  onProgress?: (done: number, total: number) => void
  signal?: AbortSignal
}

/** One original preset frame, copied losslessly and owned by the caller. */
export async function sampleShaderBackground(preset: ShaderBackgroundPreset, opts: { size?: number; signal?: AbortSignal } = {}): Promise<DecodedBackground> {
  if (opts.signal?.aborted) throw new DOMException('Cancelled', 'AbortError')
  const size = Math.max(1, Math.round(positive(opts.size, 512)))
  const stage = await ShaderStage.create(size, preset, opts.signal)
  const cancel = () => stage.dispose(true)
  opts.signal?.addEventListener('abort', cancel, { once: true })
  let image: ImageBitmap | HTMLCanvasElement | undefined
  try {
    if (opts.signal?.aborted) throw new DOMException('Cancelled', 'AbortError')
    stage.drawAt(preset, preset.frame)
    image = await stage.capture()
    if (opts.signal?.aborted) { close(image); image = undefined; throw new DOMException('Cancelled', 'AbortError') }
    return { id: `shader:${preset.id}:still`, width: size, height: size, frames: [{ image, delayMs: 4000 }], totalMs: 4000, animated: false }
  } finally { opts.signal?.removeEventListener('abort', cancel); stage.dispose(true) }
}

/** Shared still fallback for browsers without a working shader context. */
export function fallbackBackground(preset: ShaderBackgroundPreset, size = 512): DecodedBackground {
  const image = document.createElement('canvas')
  image.width = image.height = size
  const ctx = image.getContext('2d')
  if (!ctx) throw new Error('This browser cannot open a drawing canvas.')
  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, preset.colorBack); gradient.addColorStop(1, preset.colorTint)
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, size, size)
  return { id: preset.id, width: size, height: size, frames: [{ image, delayMs: 4000 }], totalMs: 4000, animated: false }
}

export function releaseBackground(background: DecodedBackground | null): void {
  background?.frames.forEach(frame => close(frame.image))
}

/**
 * How one loop is baked: the `setFrame()` values for every raw frame, and how many of those are
 * the overlap that gets cross-faded away. Pure, so the frame maths is testable without WebGL.
 */
export interface ShaderLoopPlan {
  /** Frames in the finished loop. */
  frameCount: number
  /** Leading frames of the loop that are a dissolve, and the extra raw frames baked to feed it. */
  blendCount: number
  /** Delay carried by every output frame. */
  delayMs: number
  /** `setFrame()` argument per raw frame, in order. Length is `frameCount + blendCount`. */
  times: number[]
}

/**
 * Plans a loop for `preset`. Raw frame `i` is sampled at the preset's start offset plus the
 * elapsed time scaled by its `speed`, which is exactly how the live shader advances its clock.
 */
export function planShaderLoop(
  preset: ShaderBackgroundPreset,
  opts: BakeShaderOptions = {},
): ShaderLoopPlan {
  const fps = positive(opts.fps, SHADER_FPS)
  const durationMs = positive(opts.durationMs, SHADER_LOOP_MS)
  const delayMs = 1000 / fps

  const frameCount = Math.max(2, Math.round((durationMs * fps) / 1000))
  // The dissolve cannot be the whole loop, or there would be nothing left to dissolve into.
  const requested = Math.round((positive(opts.blendMs, SHADER_BLEND_MS) * fps) / 1000)
  const blendCount = Math.max(1, Math.min(requested, Math.floor(frameCount / 2)))

  const times = Array.from(
    { length: frameCount + blendCount },
    (_, index) => preset.frame + index * delayMs * preset.speed,
  )
  return { frameCount, blendCount, delayMs, times }
}

/**
 * Weight of the head frame in output frame `index` of the dissolve. Runs 0 at the first output
 * frame, where the tail is shown whole, up to nearly 1 where the head has taken over.
 */
export function blendWeightAt(index: number, blendCount: number): number {
  if (blendCount <= 0) return 1
  return Math.min(1, Math.max(0, index / blendCount))
}

/**
 * Bakes a shader preset into the frame list `render()` already knows how to draw, so a shader
 * background, a GIF and a still are the same thing by the time they reach the canvas.
 */
export async function bakeShaderBackground(
  preset: ShaderBackgroundPreset,
  opts: BakeShaderOptions = {},
): Promise<DecodedBackground> {
  const size = Math.max(1, Math.round(positive(opts.size, SHADER_SIZE)))
  const plan = planShaderLoop(preset, opts)
  const stage = await ShaderStage.create(size, preset)

  const raw: (ImageBitmap | HTMLCanvasElement)[] = []
  try {
    for (let index = 0; index < plan.times.length; index += 1) {
      if (opts.signal?.aborted) throw new DOMException('Cancelled','AbortError')
      stage.drawAt(preset, plan.times[index] ?? 0)
      raw.push(await stage.capture())
      if (index % PROGRESS_EVERY === 0) opts.onProgress?.(index, plan.times.length)
      if (index > 0 && index % YIELD_EVERY === 0) await yieldToUi()
    }
    opts.onProgress?.(plan.times.length, plan.times.length)

    const frames = await closeLoop(raw, plan, size)
    raw.length = 0
    return {
      id: `shader:${preset.id}`,
      width: size,
      height: size,
      frames,
      totalMs: plan.frameCount * plan.delayMs,
      animated: true,
    }
  } finally {
    raw.forEach(close)
    stage.dispose()
  }
}

/**
 * Turns the raw frames into a loop that closes: the leading `blendCount` frames dissolve from the
 * overhang past the end back into the head, and the rest pass through untouched.
 */
async function closeLoop(
  raw: (ImageBitmap | HTMLCanvasElement)[],
  plan: ShaderLoopPlan,
  size: number,
): Promise<BackgroundFrame[]> {
  const { frameCount, blendCount, delayMs } = plan
  const surface = document.createElement('canvas')
  surface.width = size
  surface.height = size
  const ctx = surface.getContext('2d')
  if (!ctx) throw new Error('This browser cannot bake backgrounds: no 2D canvas context.')

  const frames: BackgroundFrame[] = []
  for (let index = 0; index < frameCount; index += 1) {
    if (index < blendCount) {
      const tail = raw[index + frameCount]
      const head = raw[index]
      if (!tail || !head) continue
      ctx.clearRect(0, 0, size, size)
      ctx.globalAlpha = 1
      ctx.drawImage(tail, 0, 0, size, size)
      ctx.globalAlpha = blendWeightAt(index, blendCount)
      ctx.drawImage(head, 0, 0, size, size)
      ctx.globalAlpha = 1
      frames.push({ image: await snapshot(surface, size), delayMs })
    } else {
      const frame = raw[index]
      if (frame) frames.push({ image: frame, delayMs })
    }
  }

  // Every frame the dissolve consumed has been copied into a new bitmap; free the originals.
  for (let index = 0; index < blendCount; index += 1) {
    close(raw[index])
    close(raw[index + frameCount])
  }
  return frames
}

/** One offscreen WebGL2 canvas plus the 2D surface frames are read back through. */
class ShaderStage {
  private disposed = false
  private constructor(
    private readonly host: HTMLDivElement,
    private readonly mount: ShaderMount,
    private readonly readback: HTMLCanvasElement,
    private readonly ctx: CanvasRenderingContext2D,
    private readonly mask: HTMLImageElement,
    private readonly size: number,
  ) {}

  /**
   * `preset` seeds the uniforms. It must be a complete set: the mount looks a uniform's location
   * up once, from whatever it was constructed with, so a key missing here can never be set later
   * and silently keeps WebGL's default of 0.
   */
  static async create(size: number, preset: ShaderBackgroundPreset, signal?: AbortSignal): Promise<ShaderStage> {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError')
    // `u_image` only matters when masking an uploaded logo, but the mount still needs a loaded
    // element for the sampler: handed the bare data URI it warns and leaves the unit unbound.
    const mask = new Image()
    mask.src = emptyPixel
    await mask.decode()
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError')

    // Laid out, so the mount's observers see a real box, but far off-screen and inert.
    const host = document.createElement('div')
    host.setAttribute('aria-hidden', 'true')
    host.style.cssText = `position:fixed;left:-99999px;top:0;width:${size}px;height:${size}px;pointer-events:none;`
    document.body.appendChild(host)

    let mount: ShaderMount
    try {
      mount = new ShaderMount(
        host,
        liquidMetalFragmentShader,
        uniformsFor(mask, preset),
        undefined,
        // speed 0 freezes the internal clock, so `setFrame()` alone decides what is drawn.
        0,
        0,
        1,
        size * size,
        ['u_image'],
      )
    } catch (cause) {
      host.querySelector('canvas')?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext()
      host.remove()
      throw new ShaderUnsupportedError(
        cause instanceof Error && cause.message ? cause.message : undefined,
      )
    }

    const readback = document.createElement('canvas')
    readback.width = size
    readback.height = size
    const ctx = readback.getContext('2d', { willReadFrequently: false })
    if (!ctx) {
      mount.dispose()
      host.remove()
      throw new Error('This browser cannot bake backgrounds: no 2D canvas context.')
    }

    try {
      await waitForSize(mount, size, signal)
      return new ShaderStage(host, mount, readback, ctx, mask, size)
    } catch(error) { const context = mount.canvasElement.getContext('webgl2'); mount.dispose(); host.remove(); context?.getExtension('WEBGL_lose_context')?.loseContext(); throw error }
  }

  /** Renders one frame. `setFrame()` draws synchronously, and with speed 0 it never drifts. */
  drawAt(preset: ShaderBackgroundPreset, timeMs: number): void {
    this.mount.setUniforms(uniformsFor(this.mask, preset))
    this.mount.setFrame(timeMs)
  }

  capture(): Promise<ImageBitmap | HTMLCanvasElement> {
    this.ctx.clearRect(0, 0, this.size, this.size)
    this.ctx.drawImage(this.mount.canvasElement, 0, 0, this.size, this.size)
    return snapshot(this.readback, this.size)
  }

  /** A still of one preset, as a data URL the wizard can drop straight into an `<img>`. */
  still(preset: ShaderBackgroundPreset): string {
    this.drawAt(preset, preset.frame)
    this.ctx.clearRect(0, 0, this.size, this.size)
    this.ctx.drawImage(this.mount.canvasElement, 0, 0, this.size, this.size)
    return this.readback.toDataURL('image/jpeg', 0.82)
  }

  dispose(releaseContext = false): void {
    if (this.disposed) return
    this.disposed = true
    const context = releaseContext ? this.mount.canvasElement.getContext('webgl2') : null
    this.mount.dispose()
    this.host.remove()
    this.readback.width = this.readback.height = 0
    context?.getExtension('WEBGL_lose_context')?.loseContext()
  }
}

/**
 * Renders one still per preset through a single WebGL context. Twelve separate mounts would sit
 * near the browser's context limit and evict each other, so the tiles share one stage.
 */
export async function renderShaderThumbnails(
  presets: ShaderBackgroundPreset[],
  size = SHADER_THUMB_SIZE,
): Promise<Record<string, string>> {
  const thumbs: Record<string, string> = {}
  const first = presets[0]
  if (!first) return thumbs
  const stage = await ShaderStage.create(size, first)
  try {
    for (const preset of presets) {
      thumbs[preset.id] = stage.still(preset)
      await yieldToUi()
    }
  } finally {
    stage.dispose()
  }
  return thumbs
}

/** The uniform set the Paper Shaders `LiquidMetal` component builds, minus its React plumbing. */
function uniformsFor(mask: HTMLImageElement, preset: ShaderBackgroundPreset) {
  return {
    u_image: mask,
    u_isImage: false,
    u_fit: ShaderFitOptions.contain,
    u_rotation: 0,
    u_offsetX: 0,
    u_offsetY: 0,
    u_originX: 0.5,
    u_originY: 0.5,
    u_worldWidth: 0,
    u_worldHeight: 0,
    u_colorBack: getShaderColorFromString(preset.colorBack),
    u_colorTint: getShaderColorFromString(preset.colorTint),
    u_contour: preset.contour,
    u_distortion: preset.distortion,
    u_softness: preset.softness,
    u_repetition: preset.repetition,
    u_shiftRed: preset.shiftRed,
    u_shiftBlue: preset.shiftBlue,
    u_angle: preset.angle,
    u_scale: preset.scale,
    u_shape: LiquidMetalShapes[preset.shape],
  }
}

/**
 * The mount sizes its canvas from a ResizeObserver, which has not fired yet when the constructor
 * returns: it starts at the 300x150 canvas default and only then snaps to the host box. Capturing
 * before that bakes a stretched frame.
 */
async function waitForSize(mount: ShaderMount, size: number, signal?: AbortSignal): Promise<void> {
  const deadline = Date.now() + SIZING_TIMEOUT_MS
  while (mount.canvasElement.width !== size || mount.canvasElement.height !== size) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError')
    if (Date.now() > deadline) throw new ShaderUnsupportedError('The animated background took too long to initialize. A still is available.')
    await nextFrame(signal)
  }
}

function snapshot(
  canvas: HTMLCanvasElement,
  size: number,
): Promise<ImageBitmap | HTMLCanvasElement> {
  if (typeof createImageBitmap === 'function') return createImageBitmap(canvas)
  const copy = document.createElement('canvas')
  copy.width = size
  copy.height = size
  const ctx = copy.getContext('2d')
  if (!ctx) throw new Error('This browser cannot bake backgrounds: no 2D canvas context.')
  ctx.drawImage(canvas, 0, 0)
  return Promise.resolve(copy)
}

function close(image: ImageBitmap | HTMLCanvasElement | undefined): void {
  if (!image) return
  if (image instanceof HTMLCanvasElement) image.width = image.height = 0
  else image.close()
}

function positive(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback
}

function nextFrame(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    let frame = 0, timer: ReturnType<typeof setTimeout> | undefined
    const clear = () => { if (frame) cancelAnimationFrame(frame); if (timer) clearTimeout(timer); signal?.removeEventListener('abort', abort) }
    const done = () => { clear(); resolve() }
    const abort = () => { clear(); reject(new DOMException('Cancelled', 'AbortError')) }
    if (signal?.aborted) { abort(); return }
    signal?.addEventListener('abort', abort, { once: true })
    if (typeof requestAnimationFrame === 'function') frame = requestAnimationFrame(done)
    else timer = setTimeout(done, 16)
  })
}

function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
