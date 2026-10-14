/** Adapted from David Blumenau's Kitforge, revision 809d559d8c54e1f44385100ab336d2e988b4a84a. See PROVENANCE.md. */
export type AspectId = 'square'

/** One decoded frame of a background, already composited and ready to `drawImage`. */
export interface BackgroundFrame {
  image: ImageBitmap | HTMLCanvasElement
  delayMs: number
}

/** A background source (preset or upload) after decoding. Static images are the 1-frame case. */
export interface DecodedBackground {
  id: string
  width: number
  height: number
  frames: BackgroundFrame[]
  totalMs: number
  animated: boolean
}

/** The user photo and its transform, in template space (1080x1080), not CSS pixels. */
export interface PhotoState {
  image: ImageBitmap | null
  offsetX: number
  offsetY: number
  scale: number
  visible: boolean
}

/** An uploaded logo. Runtime only: the bitmap is never persisted, exactly like `photo.image`. */
export interface LogoSlot {
  image: ImageBitmap | null
}

export interface TextField {
  text: string
  visible: boolean
}

/** The two role lines a user types themselves, used when `templateId` is the custom id. */
export interface CustomTemplate {
  prefix: string
  headline: string
}

/** The whole editable document. `render()` takes this plus a time and draws a frame. */
export interface KitDoc {
  templateId: string
  customTemplate: CustomTemplate
  backgroundId: string
  background: DecodedBackground | null
  companyLogo: LogoSlot
  eventLogo: LogoSlot
  photo: PhotoState
  eventName: TextField
  name: TextField
  title: TextField
  company: TextField
  /** Fill for every text row, as a `#rrggbb` hex string. */
  textColor: string
  font: 'sans' | 'serif' | 'mono'
  composition: 'poster' | 'center' | 'corner'
  headlineScale: number
  aspect: AspectId
}

