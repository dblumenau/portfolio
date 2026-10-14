/** Adapted from David Blumenau's Kitforge, revision 809d559d8c54e1f44385100ab336d2e988b4a84a. See PROVENANCE.md. */
import { ArrayBufferTarget, Muxer } from './vendor/mp4-muxer/mp4-muxer.mjs'

import { fontsReady } from './fonts'
import { exportFrameTimes, loopDurationMs } from './frames'
import { render } from './render'
import type { KitDoc } from './types'

import { EXPORT_HEIGHT, EXPORT_WIDTH, createExportCanvas } from './canvas'

/** Fixed export frame rate; GIF delays are resampled onto it by `exportFrameTimes`. */
export const DEFAULT_FPS = 30

/** Players seek badly through long runs of delta frames. */
const KEYFRAME_INTERVAL = 30

/** ~8 Mbps keeps 1080-square gradients free of banding without a huge file. */
const BITRATE = 8_000_000

/** Let the encoder run a short queue ahead of the render loop, but never build a backlog. */
const MAX_QUEUE_SIZE = 8

/** Hand the browser a repaint slot at least this often, even when the queue is short. */
const YIELD_EVERY_FRAMES = 5

/** High L4.0 first; degrade only when the encoder refuses the profile. */
const CODEC_CANDIDATES = ['avc1.640028', 'avc1.4d0028', 'avc1.42e028']

export const MP4_UNSUPPORTED_MESSAGE = 'This browser cannot encode MP4. You can still download PNG or JPG.'

export interface Mp4Options {
  onProgress?: (done: number, total: number) => void
  signal?: AbortSignal
  /** Whole frames per second; `mp4-muxer` rejects a fractional rate. */
  fps?: number
}

export interface Mp4Estimate {
  frames: number
  seconds: number
}

/** One frame of the export: which point of the loop to draw, and where it sits in the file. */
export interface ExportFrame {
  timeMs: number
  /** Presentation timestamp, in microseconds. */
  timestamp: number
  /** Frame duration, in microseconds. */
  duration: number
}

/**
 * The MP4 button's gate. WebCodecs alone is not enough: Gecko's H.264 encoder emits a fresh
 * parameter set part-way through a stream, and a track described by a single `avcC` cannot
 * carry it, so the file that comes out decodes as a fraction of its frames. Chromium is the
 * engine whose encoder output this muxing path can describe, so the feature check is paired
 * with an engine check.
 */
export function canExportMp4(): boolean {
  return typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined' && isChromium()
}

/** `navigator.userAgentData` is a Chromium-only API, so its brand list is the engine check. */
function isChromium(): boolean {
  if (typeof navigator === 'undefined') return false
  const agent = navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } }
  const brands = agent.userAgentData?.brands
  return Array.isArray(brands) && brands.some((entry) => entry.brand === 'Chromium')
}

/** Presentation timestamp of frame `index`, in microseconds. */
export function timestampForFrame(index: number, fps: number): number {
  return Math.round((index * 1_000_000) / fps)
}

/**
 * Turns the resampled loop times into per-frame timestamps and durations. The last frame
 * absorbs the rounding remainder so the file's total duration is exactly `totalMs`, which
 * is what makes a GIF background loop seamlessly when the player repeats the file.
 */
export function planFrames(times: number[], fps: number, totalMs: number): ExportFrame[] {
  const totalUs = Math.round(totalMs * 1000)
  const lastIndex = times.length - 1

  return times.map((timeMs, index) => {
    const timestamp = timestampForFrame(index, fps)
    const nextTimestamp = index === lastIndex ? totalUs : timestampForFrame(index + 1, fps)
    return { timeMs, timestamp, duration: Math.max(1, nextTimestamp - timestamp) }
  })
}

/** Frame count and running time of the MP4 this doc would produce, for the export label. */
export function estimateMp4(doc: KitDoc, fps: number = DEFAULT_FPS): Mp4Estimate {
  return {
    frames: exportFrameTimes(doc.background, fps).length,
    seconds: loopDurationMs(doc.background) / 1000,
  }
}

let encoderConfig: Promise<VideoEncoderConfig | null> | null = null

/**
 * The first codec the browser will actually encode, or `null` where WebCodecs is missing.
 * Probing is cached: hardware support does not change within a session.
 */
export function pickEncoderConfig(): Promise<VideoEncoderConfig | null> {
  encoderConfig ??= probeEncoderConfigs()
  return encoderConfig
}

async function probeEncoderConfigs(): Promise<VideoEncoderConfig | null> {
  if (typeof VideoEncoder === 'undefined') return null

  for (const codec of CODEC_CANDIDATES) {
    const candidate: VideoEncoderConfig = {
      codec,
      width: EXPORT_WIDTH,
      height: EXPORT_HEIGHT,
      bitrate: BITRATE,
      framerate: DEFAULT_FPS,
      latencyMode: 'quality',
      avc: { format: 'avc' },
      hardwareAcceleration: 'no-preference',
    }

    try {
      const support = await VideoEncoder.isConfigSupported(candidate)
      if (support.supported) return support.config ?? candidate
    } catch {
      // A codec string this build cannot parse: try the next one down the chain.
    }
  }

  return null
}

/**
 * Renders the background loop frame by frame through `render()` and muxes it into an MP4.
 * Runs on the main thread, yielding between frames so the progress bar keeps painting.
 */
export async function exportMp4(doc: KitDoc, opts: Mp4Options = {}): Promise<Blob> {
  const { onProgress, signal } = opts
  const fps = opts.fps ?? DEFAULT_FPS

  await fontsReady()

  const config = await pickEncoderConfig()
  if (!config) throw new Error(MP4_UNSUPPORTED_MESSAGE)

  const times = exportFrameTimes(doc.background, fps)
  const frames = planFrames(times, fps, loopDurationMs(doc.background))
  const total = frames.length

  const { canvas, ctx } = createExportCanvas()

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width: EXPORT_WIDTH, height: EXPORT_HEIGHT, frameRate: fps },
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  })

  let failure: Error | null = null
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (error) => {
      failure ??= error
    },
  })
  try {
    encoder.configure({ ...config, framerate: fps })
    for (const [index, frame] of frames.entries()) {
      throwIfFailed(failure, signal)

      render(ctx, doc, frame.timeMs)

      const videoFrame = new VideoFrame(canvas, {
        timestamp: frame.timestamp,
        duration: frame.duration,
      })
      try {
        encoder.encode(videoFrame, { keyFrame: index % KEYFRAME_INTERVAL === 0 })
      } finally {
        videoFrame.close()
      }

      onProgress?.(index + 1, total)

      let yielded = false
      while (encoder.encodeQueueSize > MAX_QUEUE_SIZE) {
        await yieldToBrowser()
        yielded = true
        throwIfFailed(failure, signal)
      }
      if (!yielded && index % YIELD_EVERY_FRAMES === YIELD_EVERY_FRAMES - 1) {
        await yieldToBrowser()
      }
    }

    await encoder.flush()
    throwIfFailed(failure, signal)
  } catch (error) {
    closeEncoder(encoder)
    throw error
  }

  encoder.close()
  muxer.finalize()

  return new Blob([muxer.target.buffer], { type: 'video/mp4' })
}

function throwIfFailed(failure: Error | null, signal: AbortSignal | undefined): void {
  if (failure) throw failure
  if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError')
}

function closeEncoder(encoder: VideoEncoder): void {
  try {
    encoder.close()
  } catch {
    // The encoder closed itself on the error that brought us here; nothing left to release.
  }
}

/** A macrotask gap, so the browser can repaint between frames instead of after the export. */
function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
