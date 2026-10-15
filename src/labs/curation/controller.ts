import { stageCopy, stages, type Stage } from './model';
import { setIconLabel } from '../../ui/icons';
export function initCuration(root: HTMLElement) {
  if (root.dataset.ready === 'true') return;
  const get = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-stage-button]')];
  const next = get<HTMLButtonElement>('[data-next]');
  let stage: Stage = 'before';
  function render(selected: Stage) {
    stage = selected;
    root.dataset.stage = stage;
    const copy = stageCopy[stage];
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.stageButton === stage)));
    get('[data-stage-title]').textContent = copy.title;
    get('[data-stage-copy]').textContent = copy.copy;
    get('[data-stage-status]').textContent = copy.status;
    setIconLabel(next, copy.action, stage === 'merged' ? 'undo' : stage === 'restored' ? 'rotate' : 'arrow-right');
    get('[data-result-state]').textContent = stage === 'before' ? 'Before the merge' : stage === 'merged' ? 'Recorded merge result' : 'Recorded inverse result';
    root.querySelectorAll<HTMLElement>('[data-identity], [data-row-hash]').forEach(field => { field.textContent = field.dataset[stage] ?? ''; });
    root.querySelectorAll<HTMLElement>('[data-field-status]').forEach((label, i) => { label.textContent = stage === 'before' ? `Original ${i === 0 ? 'object' : 'subject'} spelling` : stage === 'merged' ? `${i === 0 ? 'Object' : 'Subject'} normalized · source link retained` : `${i === 0 ? 'Object' : 'Subject'} restored · inverse audited`; });
  }
  buttons.forEach(button => { button.disabled = false; button.addEventListener('click', () => { const selected = button.dataset.stageButton as Stage; if (stages.includes(selected)) render(selected); }); });
  next.disabled = false;
  next.addEventListener('click', () => render(stageCopy[stage].next));
  get<HTMLAnchorElement>('[data-open-audits]').addEventListener('click', () => { root.querySelectorAll<HTMLDetailsElement>('[data-audit]').forEach(detail => { detail.open = true; }); });
  root.dataset.ready = 'true';
}
