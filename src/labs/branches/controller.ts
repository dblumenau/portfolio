import { setIconLabel } from '../../ui/icons';
import { phases, branchLabels, type BranchName } from './model';

export function initBranches(root: HTMLElement) {
  let phase = 0;
  let selected: BranchName = 'balanced';
  let compare = false;
  let traveller: HTMLImageElement | null = null;
  const get = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const next = get<HTMLButtonElement>('[data-next]');
  const stageButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-step]')];
  const branchButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-branch]')];
  const results = [...root.querySelectorAll<HTMLElement>('[data-result]')];

  function render() {
    const story = phases[phase];
    root.dataset.phase = String(phase);
    get('[data-step-label]').textContent = `0${phase + 1} / ${story.label}`;
    get('[data-stage-title]').textContent = story.title;
    get('[data-stage-copy]').textContent = story.copy;
    next.disabled = false;
    setIconLabel(next, story.action, phase === 5 ? 'rotate' : 'arrow-right');
    get('[data-gallery]').hidden = phase !== 0;
    get('[data-workspace]').hidden = phase === 0;
    stageButtons.forEach((button, index) => {
      button.disabled = false;
      if (phase === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
      button.dataset.completed = String(index < phase);
    });
    const count = phase === 0 ? 0 : Math.min(phase, 3);
    get('[data-count]').textContent = count ? `${count} direction${count === 1 ? '' : 's'} retained` : 'Reference ready';
    branchButtons.forEach((button, index) => {
      const name = button.dataset.branch as BranchName;
      button.disabled = index >= count;
      button.setAttribute('aria-pressed', String(name === selected && !compare));
      button.dataset.comparing = String(compare && name !== 'balanced');
      button.querySelector<HTMLElement>('[data-preferred-badge]')!.hidden = phase !== 5 || name !== 'quiet';
    });
    results.forEach(article => {
      const name = article.dataset.result as BranchName;
      article.hidden = compare ? name === 'balanced' : name !== selected;
      article.querySelector<HTMLElement>('[data-result-preferred]')!.hidden = phase !== 5 || name !== 'quiet';
    });
    get('[data-results]').classList.toggle('is-comparing', compare);
    get('[data-result-heading]').textContent = compare ? 'Two revisions / the original is still available' : `${branchLabels[selected]} direction`;
    const compareButton = get<HTMLButtonElement>('[data-compare]');
    compareButton.disabled = phase < 3;
    compareButton.setAttribute('aria-pressed', String(compare));
    setIconLabel(compareButton, compare ? 'Return to Quiet' : 'Compare Bold and Quiet', compare ? 'arrow-left' : 'arrow-both');
    get('[data-status]').textContent = compare ? phases[4].status : phase >= 3 && selected === 'balanced' ? 'Viewing the original. Bold and Quiet are retained beside it.' : story.status;
    get('[data-original-proof]').textContent = phase > 1 ? 'All 4 rows unchanged' : 'Preservation checked in the run';
    get('[data-choice]').hidden = phase < 3;
    const preference = get<HTMLButtonElement>('[data-prefer]');
    preference.disabled = phase === 5;
    setIconLabel(preference, phase === 5 ? 'Quiet is preferred' : 'Replay Quiet as preferred', 'check');
    get('[data-choice-status]').textContent = phase === 5 ? 'Recorded preference selected. All three directions remain available.' : 'The recorded choice keeps the other directions available.';
  }

  function moveReference(source: DOMRect) {
    const target = get<HTMLImageElement>('[data-shared-image]').getBoundingClientRect();
    traveller?.remove();
    const image = document.createElement('img');
    traveller = image;
    image.src = '/media/studio/sample-print.png';
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    image.className = 'bl-traveller';
    Object.assign(image.style, { left: `${source.left}px`, top: `${source.top}px`, width: `${source.width}px`, height: `${source.height}px` });
    document.body.append(image);
    const animation = image.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${target.left - source.left}px, ${target.top - source.top}px) scale(${target.width / source.width})`, opacity: .95 },
    ], { duration: 600, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' });
    animation.finished.finally(() => { image.remove(); if (traveller === image) traveller = null; });
  }

  function go(nextPhase: number) {
    const source = phase === 0 && nextPhase === 1 ? get('[data-gallery-image]').getBoundingClientRect() : null;
    phase = nextPhase;
    selected = phase < 2 ? 'balanced' : phase === 2 ? 'bold' : 'quiet';
    compare = phase === 4;
    render();
    if (source && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) moveReference(source);
  }

  next.addEventListener('click', () => go(phase === 5 ? 0 : phase + 1));
  stageButtons.forEach(button => button.addEventListener('click', () => go(Number(button.dataset.step))));
  branchButtons.forEach(button => button.addEventListener('click', () => {
    selected = button.dataset.branch as BranchName;
    compare = false;
    render();
  }));
  get('[data-prefer]').addEventListener('click', () => go(5));
  get('[data-compare]').addEventListener('click', () => { compare = !compare; selected = 'quiet'; render(); });
  window.addEventListener('pagehide', () => traveller?.remove(), { once: true });
  render();
  root.dataset.ready = 'true';
}

export function initBranchCaptures(root: HTMLElement) {
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-capture]')];
  const image = root.querySelector<HTMLImageElement>('[data-capture-image]')!;
  const caption = root.querySelector<HTMLElement>('[data-capture-caption]')!;
  buttons.forEach(button => button.addEventListener('click', () => {
    buttons.forEach(candidate => candidate.setAttribute('aria-pressed', String(candidate === button)));
    image.src = button.dataset.src!;
    root.querySelector<HTMLAnchorElement>('[data-capture-open]')!.href = button.dataset.src!;
    image.alt = button.dataset.alt!;
    caption.textContent = button.dataset.caption!;
  }));
}
