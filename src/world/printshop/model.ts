import { shaderBackgroundPresets } from '../../labs/studio/shaderBackgrounds';
export type Look = 'amber-pulse' | 'cyber-teal' | 'forest-mist';
export type Arrangement = 'poster' | 'center';
export type Draft = { headline: string; smallLine: string; look: Look; arrangement: Arrangement };
export type PrintRecord = { id: number; headline: string; smallLine: string; look: Look; arrangement: Arrangement; version: number };
export type PrintshopState = {
  draft: Draft; draftVersion: number; preparation: 'loading-fonts' | 'sampling-look' | 'ready' | 'error';
  pendingPrint: { job: number; slot: 0 | 1; draftVersion: number } | null;
  prints: [PrintRecord | null, PrintRecord | null]; selectedPrint: 0 | 1 | null; replacement: 0 | 1 | null;
  mode: 'editing' | 'pressing' | 'rack'; inspectorOpen: boolean; fallback: boolean;
};
export type Action =
  | { type: 'EDIT'; values: Partial<Draft> }
  | { type: 'PREPARATION'; value: PrintshopState['preparation']; fallback?: boolean }
  | { type: 'PULL'; job: number; slot: 0 | 1 }
  | { type: 'PRINT_READY'; job: number; print: PrintRecord }
  | { type: 'PRINT_FAILED' | 'CANCEL_PRINT' | 'SETTLE' | 'EDIT_NEXT' | 'CLOSE_INSPECTOR' }
  | { type: 'SELECT_PRINT'; slot: 0 | 1; inspect: boolean }
  | { type: 'REPLACE_SLOT'; slot: 0 | 1 | null };
export const looks: { id: Look; label: string; color: string }[] = [
  { id: 'amber-pulse', label: 'Amber', color: shaderBackgroundPresets.find(preset => preset.id === 'amber-pulse')!.colorTint }, { id: 'cyber-teal', label: 'Teal', color: shaderBackgroundPresets.find(preset => preset.id === 'cyber-teal')!.colorTint }, { id: 'forest-mist', label: 'Forest', color: shaderBackgroundPresets.find(preset => preset.id === 'forest-mist')!.colorTint },
];
export const initialPrintshop = (): PrintshopState => ({ draft: { headline: 'Make room for ideas', smallLine: 'A little thing, made here.', look: 'forest-mist', arrangement: 'poster' }, draftVersion: 0, preparation: 'loading-fonts', pendingPrint: null, prints: [null, null], selectedPrint: null, replacement: null, mode: 'editing', inspectorOpen: false, fallback: false });
export function nextSlot(state: PrintshopState): 0 | 1 | null { return state.prints[0] === null ? 0 : state.prints[1] === null ? 1 : state.replacement; }
export function canPull(state: PrintshopState): boolean { return state.preparation === 'ready' && !!state.draft.headline.trim() && !state.pendingPrint && state.mode !== 'pressing' && nextSlot(state) !== null; }
export function reducePrintshop(state: PrintshopState, action: Action): PrintshopState {
  switch (action.type) {
    case 'EDIT': return { ...state, draft: { ...state.draft, ...action.values }, draftVersion: state.draftVersion + 1, mode: state.mode === 'pressing' ? 'pressing' : 'editing' };
    case 'PREPARATION': return { ...state, preparation: action.value, fallback: action.fallback ?? state.fallback };
    case 'PULL': return canPull(state) ? { ...state, pendingPrint: { job: action.job, slot: action.slot, draftVersion: state.draftVersion } } : state;
    case 'PRINT_READY': {
      if (state.pendingPrint?.job !== action.job) return state;
      const slot = state.pendingPrint.slot, prints: PrintshopState['prints'] = [...state.prints]; prints[slot] = action.print;
      return { ...state, prints, selectedPrint: slot, replacement: null, pendingPrint: null, mode: 'pressing' };
    }
    case 'PRINT_FAILED': case 'CANCEL_PRINT': return { ...state, pendingPrint: null };
    case 'SETTLE': return { ...state, mode: state.prints.some(Boolean) ? 'rack' : 'editing' };
    case 'EDIT_NEXT': return { ...state, mode: 'editing' };
    case 'SELECT_PRINT': return state.prints[action.slot] ? { ...state, selectedPrint: action.slot, inspectorOpen: action.inspect } : state;
    case 'CLOSE_INSPECTOR': return { ...state, inspectorOpen: false };
    case 'REPLACE_SLOT': return { ...state, replacement: action.slot, mode: 'editing' };
  }
}
