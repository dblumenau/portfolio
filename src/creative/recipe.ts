import { createDoc, backgrounds, rolePresets } from '../labs/studio/model';
import type { KitDoc, DecodedBackground, TextField } from '../labs/studio/types';
import { sampleShaderBackground, bakeShaderBackground, fallbackBackground } from '../labs/studio/shaderBackground';

export const RENDERER_VERSION = 'portfolio-square-1';
export const PRESET_VERSION = 'kitforge-809d559-1';
export type Look = 'amber-pulse' | 'cyber-teal' | 'forest-mist';
export type BackgroundRecipe = { look: Look; mode: 'raw-still' | 'loop-frame' | 'fallback'; size: 512; sample: 'preset.frame'; fps: 16; durationMs: 4000; blendMs: 1000; time: number; frame: number };
export type Recipe = {
  version: 1; renderer: typeof RENDERER_VERSION; presets: typeof PRESET_VERSION;
  templateId: string; words: { prefix: string; headline: string; event: TextField; name: TextField; detail: TextField; company: TextField };
  font: KitDoc['font']; ink: string; composition: KitDoc['composition']; scale: number; aspect: 'square';
  photo: { offsetX: number; offsetY: number; scale: number; visible: boolean }; background: BackgroundRecipe;
};
export function backgroundRecipe(look: string, mode: BackgroundRecipe['mode'], time = 0): BackgroundRecipe {
  const resolved = Math.max(0, Math.min(3999, Number.isFinite(time) ? time : 0));
  return { look: look as Look, mode, size: 512, sample: 'preset.frame', fps: 16, durationMs: 4000, blendMs: 1000, time: mode === 'loop-frame' ? resolved : 0, frame: mode === 'loop-frame' ? Math.floor(resolved / 62.5) : 0 };
}
export function recipeFromDoc(doc: KitDoc, background: BackgroundRecipe): Recipe {
  return { version: 1, renderer: RENDERER_VERSION, presets: PRESET_VERSION, templateId: doc.templateId,
    words: { ...doc.customTemplate, event: { ...doc.eventName }, name: { ...doc.name }, detail: { ...doc.title }, company: { ...doc.company } },
    font: doc.font, ink: doc.textColor, composition: doc.composition, scale: doc.headlineScale, aspect: doc.aspect,
    photo: { offsetX: doc.photo.offsetX, offsetY: doc.photo.offsetY, scale: doc.photo.scale, visible: doc.photo.visible }, background: { ...background } };
}
export function docFromRecipe(recipe: Recipe): KitDoc {
  const doc = createDoc();
  doc.templateId = recipe.templateId; doc.customTemplate = { prefix: recipe.words.prefix, headline: recipe.words.headline };
  doc.eventName = { ...recipe.words.event }; doc.name = { ...recipe.words.name }; doc.title = { ...recipe.words.detail }; doc.company = { ...recipe.words.company };
  doc.font = recipe.font; doc.textColor = recipe.ink; doc.composition = recipe.composition; doc.headlineScale = recipe.scale; doc.aspect = recipe.aspect;
  doc.photo = { ...recipe.photo, image: null }; doc.backgroundId = recipe.background.look;
  return doc;
}
export async function decodeRecipeBackground(recipe: BackgroundRecipe, signal?: AbortSignal): Promise<DecodedBackground> {
  const preset = backgrounds.find(p => p.id === recipe.look)!;
  if (recipe.mode === 'fallback') return fallbackBackground(preset, recipe.size);
  if (recipe.mode === 'raw-still') return sampleShaderBackground(preset, { size: recipe.size, signal });
  return bakeShaderBackground(preset, { ...recipe, signal });
}
export function validRecipe(value: unknown): value is Recipe {
  if (!value || typeof value !== 'object') return false;
  const r = value as Recipe;
  const text = (field: TextField, limit: number) => field && typeof field.text === 'string' && field.text.length <= limit && typeof field.visible === 'boolean';
  return r.version === 1 && r.renderer === RENDERER_VERSION && r.presets === PRESET_VERSION && rolePresets.some(p => p.id === r.templateId) && !!r.words &&
    typeof r.words.prefix === 'string' && r.words.prefix.length <= 40 && typeof r.words.headline === 'string' && r.words.headline.length <= 90 &&
    text(r.words.event, 120) && text(r.words.name, 100) && text(r.words.detail, 140) && text(r.words.company, 140) &&
    ['sans', 'serif', 'mono'].includes(r.font) && /^#[\da-f]{6}$/i.test(r.ink) && ['poster', 'center', 'corner'].includes(r.composition) &&
    Number.isFinite(r.scale) && r.scale >= .75 && r.scale <= 1.15 && r.aspect === 'square' && !!r.photo &&
    [r.photo.offsetX, r.photo.offsetY, r.photo.scale].every(Number.isFinite) && Math.abs(r.photo.offsetX) <= 10800 && Math.abs(r.photo.offsetY) <= 10800 && r.photo.scale >= 1 && r.photo.scale <= 6 && typeof r.photo.visible === 'boolean' && !!r.background &&
    backgrounds.some(p => p.id === r.background.look) && ['raw-still', 'loop-frame', 'fallback'].includes(r.background.mode) &&
    r.background.size === 512 && r.background.sample === 'preset.frame' && r.background.fps === 16 && r.background.durationMs === 4000 && r.background.blendMs === 1000 &&
    Number.isFinite(r.background.time) && r.background.time >= 0 && r.background.time < 4000 && r.background.frame === Math.floor(r.background.time / 62.5) &&
    (r.background.mode === 'loop-frame' || r.background.time === 0);
}
