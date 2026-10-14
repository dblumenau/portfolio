/** Adapted from David Blumenau's Kitforge, revision 809d559d8c54e1f44385100ab336d2e988b4a84a. See PROVENANCE.md. */
/**
 * Animated backgrounds driven by Paper Shaders' `liquidMetal` fragment shader.
 *
 * These are data only. `src/media/shaderBackground.ts` bakes a preset into the same
 * `DecodedBackground` frame list a GIF produces, so `render()` never learns that WebGL exists.
 */

/** Mask the metal flows through. `none` fills the whole canvas. */
export type ShaderShape = 'none' | 'circle' | 'daisy' | 'diamond' | 'metaballs'

export interface ShaderBackgroundPreset {
  id: string
  label: string
  /** Fill behind the metal, as `#rrggbb`. */
  colorBack: string
  /** Colour burnt over the metal, as `#rrggbb`. */
  colorTint: string
  shape: ShaderShape
  /** Zoom on the pattern; higher is wider. */
  scale: number
  /** Multiplies elapsed time exactly as the Paper Shaders `speed` prop does. */
  speed: number
  /** Density of the stripe pattern (1 to 10). */
  repetition: number
  /** Stripe edge softness (0 hard to 1 smooth). */
  softness: number
  /** Noise distortion over the stripes (0 to 1). */
  distortion: number
  /** Strength of the distortion at the shape edges (0 to 1). */
  contour: number
  /** Direction of travel, in degrees. */
  angle: number
  /** Red channel dispersion (-1 to 1). */
  shiftRed: number
  /** Blue channel dispersion (-1 to 1). */
  shiftBlue: number
  /** Start offset in ms, so the presets do not all open on the same frame. */
  frame: number
}

/**
 * The twelve looks from TechBBQ's marketing kit generator, with their original parameters.
 * Order is the order that page lists them in.
 */
export const shaderBackgroundPresets: ShaderBackgroundPreset[] = [
  {
    id: 'amber-pulse',
    label: 'Amber Pulse',
    colorBack: '#0d0500',
    colorTint: '#FFA500',
    shape: 'none',
    scale: 1.8,
    speed: 0.22,
    repetition: 1.6,
    softness: 0.45,
    distortion: 0.07,
    contour: 0.28,
    angle: 65,
    shiftRed: 0.25,
    shiftBlue: -0.2,
    frame: 8,
  },
  {
    id: 'crimson-flow',
    label: 'Crimson Flow',
    colorBack: '#0a0000',
    colorTint: '#FF1830',
    shape: 'none',
    scale: 1.9,
    speed: 0.22,
    repetition: 1.7,
    softness: 0.5,
    distortion: 0.06,
    contour: 0.22,
    angle: 55,
    shiftRed: 0.35,
    shiftBlue: -0.2,
    frame: 4,
  },
  {
    id: 'ember-red',
    label: 'Ember Red',
    colorBack: '#050000',
    colorTint: '#CC1100',
    shape: 'none',
    scale: 2.2,
    speed: 0.16,
    repetition: 2.2,
    softness: 0.7,
    distortion: 0.04,
    contour: 0.15,
    angle: 120,
    shiftRed: 0.3,
    shiftBlue: -0.25,
    frame: 18,
  },
  {
    id: 'scarlet-tide',
    label: 'Scarlet Tide',
    colorBack: '#080000',
    colorTint: '#FF0028',
    shape: 'none',
    scale: 1.7,
    speed: 0.25,
    repetition: 1.5,
    softness: 0.4,
    distortion: 0.08,
    contour: 0.3,
    angle: 30,
    shiftRed: 0.4,
    shiftBlue: -0.15,
    frame: 2,
  },
  {
    id: 'royal-plum',
    label: 'Royal Plum',
    colorBack: '#08000d',
    colorTint: '#7B2CBF',
    shape: 'none',
    scale: 2,
    speed: 0.2,
    repetition: 1.8,
    softness: 0.55,
    distortion: 0.05,
    contour: 0.22,
    angle: 70,
    shiftRed: -0.1,
    shiftBlue: 0.3,
    frame: 10,
  },
  {
    id: 'mystic-magenta',
    label: 'Mystic Magenta',
    colorBack: '#0a0008',
    colorTint: '#C724B1',
    shape: 'none',
    scale: 1.8,
    speed: 0.24,
    repetition: 1.6,
    softness: 0.45,
    distortion: 0.07,
    contour: 0.28,
    angle: 90,
    shiftRed: 0.05,
    shiftBlue: 0.25,
    frame: 6,
  },
  {
    id: 'lava-bloom',
    label: 'Lava Bloom',
    colorBack: '#0a0000',
    colorTint: '#FF4500',
    shape: 'metaballs',
    scale: 1.6,
    speed: 0.18,
    repetition: 1.4,
    softness: 0.4,
    distortion: 0.08,
    contour: 0.25,
    angle: 35,
    shiftRed: 0.45,
    shiftBlue: -0.2,
    frame: 7,
  },
  {
    id: 'daisy-ember',
    label: 'Daisy Ember',
    colorBack: '#0a0200',
    colorTint: '#FF8A00',
    shape: 'daisy',
    scale: 1.7,
    speed: 0.2,
    repetition: 1.5,
    softness: 0.45,
    distortion: 0.07,
    contour: 0.28,
    angle: 110,
    shiftRed: 0.35,
    shiftBlue: -0.25,
    frame: 9,
  },
  {
    id: 'diamond-ruby',
    label: 'Diamond Ruby',
    colorBack: '#080000',
    colorTint: '#E60039',
    shape: 'diamond',
    scale: 1.9,
    speed: 0.18,
    repetition: 1.6,
    softness: 0.5,
    distortion: 0.05,
    contour: 0.32,
    angle: 60,
    shiftRed: 0.4,
    shiftBlue: -0.15,
    frame: 11,
  },
  {
    id: 'cyber-teal',
    label: 'Cyber Teal',
    colorBack: '#001218',
    colorTint: '#00D4D4',
    shape: 'none',
    scale: 2,
    speed: 0.22,
    repetition: 1.8,
    softness: 0.55,
    distortion: 0.06,
    contour: 0.22,
    angle: 45,
    shiftRed: -0.3,
    shiftBlue: 0.25,
    frame: 8,
  },
  {
    id: 'ocean-deep',
    label: 'Ocean Deep',
    colorBack: '#000714',
    colorTint: '#1E5DFF',
    shape: 'metaballs',
    scale: 1.8,
    speed: 0.18,
    repetition: 1.6,
    softness: 0.5,
    distortion: 0.07,
    contour: 0.25,
    angle: 80,
    shiftRed: -0.25,
    shiftBlue: 0.4,
    frame: 12,
  },
  {
    id: 'forest-mist',
    label: 'Forest Mist',
    colorBack: '#021200',
    colorTint: '#34D266',
    shape: 'none',
    scale: 2.2,
    speed: 0.16,
    repetition: 2,
    softness: 0.6,
    distortion: 0.05,
    contour: 0.2,
    angle: 130,
    shiftRed: -0.2,
    shiftBlue: -0.1,
    frame: 16,
  },
]

/** Returns `undefined` for an image preset id, an upload, or anything unknown. */
export function shaderBackgroundById(id: string): ShaderBackgroundPreset | undefined {
  return shaderBackgroundPresets.find((preset) => preset.id === id)
}
