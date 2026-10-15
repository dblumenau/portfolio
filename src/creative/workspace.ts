import { validRecipe, type Recipe } from './recipe';
import type { Draft, PrintRecord } from '../world/printshop/model';

export const WORKSPACE_KEY = 'portfolio.creative.v1';
const DATABASE = 'portfolio-creative-v1', MAX_BYTES = 24 * 1024 * 1024, TTL = 24 * 60 * 60 * 1000;
export type KeptPrint = { record: PrintRecord; recipe: Recipe; blobKey: string };
export type WorldWork = { draft: Draft; draftVersion: number; prints: [KeptPrint | null, KeptPrint | null]; selected: 0 | 1 | null; fallback: boolean };
export type StudioWork = { recipe: Recipe; display: { time: number; playing: boolean }; source?: string; previous?: Omit<StudioWork, 'previous'> };
export type IncomingCopy = { id: string; recipe: Recipe; label: string; focus: 'draft' | '0' | '1' };
type Workspace = { version: 1; world?: WorldWork; studio?: StudioWork; incoming?: IncomingCopy; returnFocus?: IncomingCopy['focus'] };
type StoredPNG = { key: string; blob: Blob; expires: number };
let dbPromise: Promise<IDBDatabase> | undefined;
export function readWorkspace(): Workspace {
  const raw = sessionStorage.getItem(WORKSPACE_KEY);
  if (!raw) return { version: 1 };
  if (raw.length > 50000) throw new Error('Invalid workspace');
  const value = JSON.parse(raw) as Workspace;
  if (value.version !== 1) throw new Error('Unsupported workspace');
  if (value.studio && (!validStudio(value.studio) || (value.studio.previous && !validStudio(value.studio.previous)))) throw new Error('Invalid Studio work');
  if (value.returnFocus !== undefined && !['draft', '0', '1'].includes(value.returnFocus)) throw new Error('Invalid return focus');
  if (value.incoming && (!validRecipe(value.incoming.recipe) || typeof value.incoming.id !== 'string' || !['draft', '0', '1'].includes(value.incoming.focus) || typeof value.incoming.label !== 'string' || value.incoming.label.length > 80)) throw new Error('Invalid copy');
  if (value.world) {
    const w = value.world, d = w.draft;
    if (!validDraft(d) || !Array.isArray(w.prints) || w.prints.length !== 2 || !Number.isSafeInteger(w.draftVersion) || w.draftVersion < 0 || ![null, 0, 1].includes(w.selected) || typeof w.fallback !== 'boolean' || w.prints.some(p => p && (!validRecipe(p.recipe) || typeof p.blobKey !== 'string' || p.blobKey.length > 80 || !validDraft(p.record) || !Number.isSafeInteger(p.record.id) || p.record.id < 1 || !Number.isSafeInteger(p.record.version) || p.record.version < 0))) throw new Error('Invalid rack');
  }
  return value;
}
function validDisplay(display: StudioWork['display']) { return display && Number.isFinite(display.time) && display.time >= 0 && display.time < 4000 && typeof display.playing === 'boolean'; }
function validStudio(work: Omit<StudioWork, 'previous'>) { return validRecipe(work.recipe) && validDisplay(work.display) && (work.source === undefined || typeof work.source === 'string' && work.source.length <= 80); }
function validDraft(d: Draft) { return d && typeof d.headline === 'string' && d.headline.length <= 60 && typeof d.smallLine === 'string' && d.smallLine.length <= 60 && ['amber-pulse', 'cyber-teal', 'forest-mist'].includes(d.look) && ['poster', 'center'].includes(d.arrangement); }
export function writeWorkspace(patch: Partial<Workspace>): void {
  const next = { ...readWorkspace(), ...patch, version: 1 };
  const raw = JSON.stringify(next);
  if (raw.length > 50000) throw new Error('Workspace is full');
  sessionStorage.setItem(WORKSPACE_KEY, raw);
}
function database(): Promise<IDBDatabase> {
  return dbPromise ||= new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('pngs', { keyPath: 'key' });
    request.onsuccess = () => { const db = request.result; db.onversionchange = () => { db.close(); dbPromise = undefined; }; resolve(db); };
    request.onerror = () => { dbPromise = undefined; reject(request.error); };
    request.onblocked = () => reject(new Error('Local print storage is blocked'));
  });
}
// PNG keys are immutable. A cloned tab owns its metadata and may still reference an older key.
// Replacement and reset leave those bytes intact until their inactivity expiry.
export async function storePNG(blob: Blob): Promise<string> {
  if (blob.type !== 'image/png' || blob.size > MAX_BYTES) throw new Error('Print storage is full');
  const db = await database(), key = crypto.randomUUID();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('pngs', 'readwrite'), store = transaction.objectStore('pngs'), now = Date.now();
    let bytes = 0, count = 0;
    const cursor = store.openCursor();
    cursor.onsuccess = () => {
      const current = cursor.result;
      if (current) { const row = current.value as StoredPNG; if (row.expires < now) current.delete(); else { bytes += row.blob.size; count++; } current.continue(); }
      else if (bytes + blob.size > MAX_BYTES || count >= 128) transaction.abort();
      else store.put({ key, blob, expires: now + TTL } satisfies StoredPNG);
    };
    transaction.oncomplete = () => resolve(); transaction.onabort = transaction.onerror = () => reject(transaction.error ?? new Error('Print storage is full'));
  });
  return key;
}
export async function restorePNG(key: string): Promise<Blob> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pngs', 'readwrite'), store = transaction.objectStore('pngs');
    const request = store.get(key); let blob: Blob | undefined;
    request.onsuccess = () => { const row = request.result as StoredPNG | undefined; if (row && row.expires >= Date.now() && row.blob instanceof Blob) { blob = row.blob; store.put({ ...row, expires: Date.now() + TTL }); } };
    transaction.oncomplete = () => blob ? resolve(blob) : reject(new Error('Kept PNG is unavailable'));
    transaction.onerror = transaction.onabort = () => reject(transaction.error ?? new Error('Print storage is unavailable'));
  });
}
export function storageMessage(saved: boolean): string { return saved ? 'Saved in this tab. Downloads keep the exact PNG.' : 'Not saved for return: local storage is unavailable or full. Download your prints before leaving.'; }
