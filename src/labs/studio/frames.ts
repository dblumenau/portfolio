/** Adapted from David Blumenau's Kitforge, revision 809d559d8c54e1f44385100ab336d2e988b4a84a. See PROVENANCE.md. */
import type { BackgroundFrame, DecodedBackground } from './types'

/**
 * Shortest loop an export runs for. Shorter backgrounds repeat until they reach it, and stills
 * export as a hold of exactly this length.
 */
const MIN_LOOP_MS = 3000

/** Longest loop an export runs for. Anything longer is truncated. */
const MAX_LOOP_MS = 10000

/** Frame rate `exportFrameTimes` falls back to when handed a nonsensical one. */
const FALLBACK_FPS = 30

/**
 * Length of one pass through an animated background, or 0 for a still. `totalMs` wins when the
 * decoder set it; summing the delays is the fallback so a hand-built background still resamples.
 */
function cycleMs(bg: DecodedBackground | null): number {
  if (!bg || bg.frames.length <= 1) return 0
  if (Number.isFinite(bg.totalMs) && bg.totalMs > 0) return bg.totalMs
  let sum = 0
  for (const frame of bg.frames) {
    if (Number.isFinite(frame.delayMs) && frame.delayMs > 0) sum += frame.delayMs
  }
  return sum
}

/**
 * Index of the frame on screen at `timeMs`, wrapping around the loop. Frames with a zero or
 * negative delay occupy no window and are skipped; negative and non-finite times read as 0.
 */
export function frameIndexAt(bg: DecodedBackground | null, timeMs: number): number {
  const cycle = cycleMs(bg)
  if (!bg || cycle <= 0) return 0

  const t = Number.isFinite(timeMs) && timeMs > 0 ? timeMs % cycle : 0
  let start = 0
  let lastTimed = 0
  for (let index = 0; index < bg.frames.length; index += 1) {
    const delay = bg.frames[index]?.delayMs ?? 0
    if (!Number.isFinite(delay) || delay <= 0) continue
    if (t < start + delay) return index
    start += delay
    lastTimed = index
  }
  return lastTimed
}

/** Frame shown at `timeMs` within the background's loop. */
export function frameAt(bg: DecodedBackground | null, timeMs: number): BackgroundFrame | null {
  if (!bg) return null
  return bg.frames[frameIndexAt(bg, timeMs)] ?? null
}

/** How long one export should run: the natural loop repeated to >= 3 s, capped at 10 s. */
export function loopDurationMs(bg: DecodedBackground | null): number {
  const cycle = cycleMs(bg)
  if (cycle <= 0) return MIN_LOOP_MS
  if (cycle >= MAX_LOOP_MS) return MAX_LOOP_MS
  return Math.min(cycle * Math.ceil(MIN_LOOP_MS / cycle), MAX_LOOP_MS)
}

/** Timestamps, in ms from loop start, that the exporter must render at a fixed `fps`. */
export function exportFrameTimes(bg: DecodedBackground | null, fps: number): number[] {
  const rate = Number.isFinite(fps) && fps > 0 ? fps : FALLBACK_FPS
  const step = 1000 / rate
  const count = Math.max(1, Math.round((loopDurationMs(bg) * rate) / 1000))
  return Array.from({ length: count }, (_, index) => index * step)
}

/** One-line summary of a background for the wizard, e.g. "16 frames · 2.0 s loop". */
export function describeBackground(bg: DecodedBackground | null): string {
  if (!bg) return 'none'
  const cycle = cycleMs(bg)
  if (cycle <= 0) return 'static'
  return `${bg.frames.length} frames · ${(cycle / 1000).toFixed(1)} s loop`
}
