import { stages } from './model';
import { setIconLabel } from '../../ui/icons';

export function initQuestionLab(root: HTMLElement) {
  let stage = 0;
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-stage]')];
  const panels = [...root.querySelectorAll<HTMLElement>('[data-question-panel]')];
  const next = root.querySelector<HTMLButtonElement>('[data-question-next]')!;
  const video = root.querySelector<HTMLVideoElement>('video')!;
  const status = root.querySelector<HTMLElement>('[data-question-status]')!;
  const progress = root.querySelector<HTMLElement>('[data-question-progress]')!;
  let soughtTime: number | null = null;

  function seekRecording(time: number) {
    soughtTime = time;
    video.pause();
    if (video.readyState >= 1) video.currentTime = time;
    else video.load();
  }
  video.addEventListener('loadedmetadata', () => {
    if (soughtTime !== null) video.currentTime = soughtTime;
  });

  function render(seek = true) {
    root.dataset.stage = String(stage);
    buttons.forEach((button, index) => {
      button.disabled = false;
      if (index === stage) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    panels.forEach((panel, index) => { panel.hidden = index !== stage; });
    status.textContent = stages[stage].status;
    progress.textContent = `0${stage + 1} / 04`;
    next.disabled = false;
    setIconLabel(next, stages[stage].action, stage === 3 ? 'rotate' : 'arrow-right');
    if (seek) seekRecording(stages[stage].time);
  }
  next.addEventListener('click', () => { stage = (stage + 1) % stages.length; render(); });
  buttons.forEach((button, index) => button.addEventListener('click', () => { stage = index; render(); }));
  // A replay chooses recorded text and video positions. It creates no live task.
  render(false);
  root.dataset.ready = 'true';
}
