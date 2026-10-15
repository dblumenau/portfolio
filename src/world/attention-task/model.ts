export const stages = ['waiting', 'chosen', 'returned', 'built'] as const;
export type TaskStage = typeof stages[number];
export type TaskView = { stage: TaskStage; dragProgress: number; dragging: boolean; evidenceOpen: boolean; resultViewport: 'desktop' | 'phone' };
export type TaskAction = { type: 'STAGE'; stage: TaskStage } | { type: 'REVEAL_CHOICE' | 'RETURN_ANSWER' | 'UNFOLD_RESULT' | 'PREVIOUS' | 'REPLAY' | 'BEGIN_DRAG' | 'CANCEL_DRAG' } | { type: 'DRAG'; progress: number } | { type: 'EVIDENCE'; open: boolean } | { type: 'VIEWPORT'; viewport: 'desktop' | 'phone' };
export const initialView = (): TaskView => ({ stage: 'waiting', dragProgress: 0, dragging: false, evidenceOpen: false, resultViewport: 'desktop' });
export function reduceTask(state: TaskView, action: TaskAction): TaskView {
  const stage = (value: TaskStage): TaskView => ({ ...state, stage: value, dragProgress: 0, dragging: false, evidenceOpen: false });
  switch (action.type) {
    case 'STAGE': return stage(action.stage);
    case 'REVEAL_CHOICE': return state.stage === 'waiting' ? stage('chosen') : state;
    case 'RETURN_ANSWER': return state.stage === 'chosen' ? stage('returned') : state;
    case 'UNFOLD_RESULT': return state.stage === 'returned' ? stage('built') : state;
    case 'PREVIOUS': return stage(stages[Math.max(0, stages.indexOf(state.stage) - 1)]!);
    case 'REPLAY': return stage('waiting');
    case 'BEGIN_DRAG': return state.stage === 'chosen' && !state.evidenceOpen ? { ...state, dragging: true, dragProgress: 0 } : state;
    case 'DRAG': return state.dragging ? { ...state, dragProgress: Math.max(0, Math.min(1, action.progress)) } : state;
    case 'CANCEL_DRAG': return { ...state, dragging: false, dragProgress: 0 };
    case 'EVIDENCE': return { ...state, evidenceOpen: action.open, dragging: false, dragProgress: 0 };
    case 'VIEWPORT': return { ...state, resultViewport: action.viewport };
  }
}
export function taskHash(hash: string): TaskStage | null {
  const [kind, task, stage] = hash.replace(/^#/, '').split('/');
  if (kind !== 'task') return null;
  if (task !== 'attention') return 'waiting';
  return stages.includes(stage as TaskStage) ? stage as TaskStage : 'waiting';
}
