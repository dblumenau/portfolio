import execution from './execution.json';
export { execution };
export type Stage = 'before' | 'merged' | 'restored';
export const stages: Stage[] = ['before', 'merged', 'restored'];
export const stageCopy: Record<Stage, { label: string; title: string; copy: string; status: string; action: string; next: Stage }> = {
  before: { label: 'Before', title: 'One product, two spellings.', copy: 'Mira calls her tablet “Slate Pad”. Normalize that exact product name to “Slate Tablet”, while keeping the place called Slate Pad.', status: 'Four original relationships. Each has its own source conversation.', action: 'Replay the recorded merge', next: 'merged' },
  merged: { label: 'Merged', title: 'Two fields changed. Four links stayed.', copy: 'The object in Mira’s notes and the subject in the keyboard relationship became “slate tablet”. The place and paper rows stayed identical.', status: 'Observed response: affected=2. Two canonicalize audit actions recorded the original values.', action: 'Replay the immediate inverse', next: 'restored' },
  restored: { label: 'Restored', title: 'The spelling returns. The record grows.', copy: 'Both product fields are “slate pad” again. A second audit batch records the inverse; review timestamps and the batch marker keep its history.', status: 'Observed response: reverted=2, not_invertible=0. All four source links remain.', action: 'Return to the beginning', next: 'before' },
};
