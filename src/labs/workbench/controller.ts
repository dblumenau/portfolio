import { setIconLabel } from '../../ui/icons';
import { phases, receipt, parseState } from './model';
export function initWorkbench(root: HTMLElement) {
  let state = parseState(location.search);
  root.querySelector<HTMLElement>('[data-wb-fallback]')!.hidden = true;
  const el = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const next = el<HTMLButtonElement>('[data-wb-next]');
  const show = (selector: string, visible: boolean) => { el(selector).hidden = !visible; };
  const render = (announce = false) => {
    const phase = phases[state.phase];
    el('[data-wb-progress]').textContent = `${String(state.phase + 1).padStart(2, '0')} / 06`;
    root.dataset.step = String(state.phase);
    root.querySelectorAll<HTMLElement>('[data-wb-phase]').forEach(item => { item.toggleAttribute('data-active', Number(item.dataset.wbPhase) === state.phase); if (Number(item.dataset.wbPhase) === state.phase) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current'); });
    el('[data-wb-phase-name]').textContent = phase.name;
    el('#wb-stage-title').textContent = phase.title;
    el('[data-wb-copy]').textContent = phase.copy;
    setIconLabel(next, phase.action, 'arrow-right');
    next.disabled = state.phase === 0 && !(state.choices.skill && state.choices.preference);
    show('[data-wb-choices]', state.phase === 0);
    show('[data-wb-back]', state.phase > 0);
    show('[data-wb-choice-result]', state.phase === 1);
    show('[data-wb-state-note]', state.phase > 1);
    const correct = state.choices.skill === 'shared' && state.choices.preference === 'local';
    el('[data-wb-choice-result]').textContent = correct ? 'Your choices match the tested arrangement: share the maintained skill, keep each status line local.' : 'The tested arrangement shares the maintained skill and keeps status lines local. That gives both desks a common tool without flattening their working habits.';
    el('[data-wb-state-note]').textContent = state.phase === 2 ? 'Refusal is the result: exit 1. Neither config file changed.' : state.phase === 3 ? 'Adopted into config.machine.toml: reasoning = high.' : state.phase === 4 ? 'Both get the update. One intentional override survives.' : 'Six protected-file hashes match. Two doctor checks pass.';
    el('[data-wb-base]').textContent = state.phase >= 4 ? 'base 02' : 'base 01';
    root.querySelectorAll('[data-wb-model]').forEach(item => { item.textContent = state.phase >= 4 ? 'demo-model-v2' : 'demo-model'; });
    el('[data-wb-reason="a"]').textContent = state.phase >= 2 ? 'high' : 'medium';
    el('[data-wb-reason="b"]').textContent = state.phase >= 4 ? 'low' : 'medium';
    el('[data-wb-status="a"]').textContent = ['Ready to assemble','Assembled from layers','Manual drift · apply refused','Local change adopted','Updated · local choice kept','doctor: ok'][state.phase];
    el('[data-wb-status="b"]').textContent = ['Ready to assemble','Assembled from layers','Unchanged','Unchanged','Updated · new base default','doctor: ok'][state.phase];
    root.querySelectorAll('[data-wb-locker]').forEach(item => { item.textContent = state.phase === 5 ? 'SHA-256 verified unchanged' : 'Stay at this desk'; });
    el('[data-wb-skill]').textContent = state.phase === 5 ? 'Matching SHA-256 on both desks' : state.phase > 0 ? 'Linked and readable on both desks' : 'One source, two desks';
    const steps = phase.steps.map(index => receipt.steps[index]);
    el('[data-wb-output]').textContent = steps.map(step => `[${step.desk}] $ ${step.command}\n${step.output}[exit ${step.exitCode}; ${step.durationMs} ms observed]\n`).join('\n');
    el('[data-wb-command-label]').textContent = `${steps[0].command.replace('metacodex ','')} / exit ${steps[0].exitCode}`;
    el('[data-wb-exit]').textContent = `exit ${steps[0].exitCode}`;
    root.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach(input => { input.checked = state.choices[input.name as keyof typeof state.choices] === input.value; });
    if (announce) el('[data-wb-announcement]').textContent = `${phase.name}. ${phase.copy}`;
  };
  const stateUrl = () => {
    const phase = state.phase;
    const params = new URLSearchParams();
    if (phase) params.set('step', String(phase));
    if (state.choices.skill) params.set('skill', state.choices.skill);
    if (state.choices.preference) params.set('preference', state.choices.preference);
    return `${location.pathname}${params.size ? `?${params}` : ''}`;
  };
  const navigate = (phase: number) => {
    state.phase = phase;
    history.pushState({}, '', stateUrl());
    render(true);
    const title = el('#wb-stage-title'); title.focus({ preventScroll: true });
    if (matchMedia('(max-width: 760px)').matches) title.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };
  root.addEventListener('change', event => {
    const input = event.target as HTMLInputElement;
    if (input.matches('input[type="radio"]')) { state.choices[input.name as keyof typeof state.choices] = input.value; history.replaceState({}, '', stateUrl()); render(); }
  });
  next.addEventListener('click', () => { if (state.phase === 5) { state.choices = { skill: '', preference: '' }; navigate(0); } else navigate(state.phase + 1); });
  el('[data-wb-back]').addEventListener('click', () => navigate(state.phase - 1));
  window.addEventListener('popstate', () => { state = parseState(location.search); render(true); });
  render();
}
