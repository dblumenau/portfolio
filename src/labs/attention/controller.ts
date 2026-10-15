import { chapters } from './model';

export function initAttentionLab(root: HTMLElement) {
  const video = root.querySelector<HTMLVideoElement>('video')!;
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-attention-chapter]')];
  const status = root.querySelector<HTMLElement>('[data-attention-status]')!;
  let pendingSeek: number | null = null;

  function markChapter(index: number) {
    buttons.forEach((button, position) => {
      if (position === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  }
  function seek(time: number) {
    video.currentTime = Math.min(time, Math.max(0, video.duration - .05));
    pendingSeek = null;
  }
  video.addEventListener('loadedmetadata', () => {
    if (pendingSeek !== null) seek(pendingSeek);
  });
  video.addEventListener('timeupdate', () => {
    let index = 0;
    chapters.forEach((chapter, position) => { if (video.currentTime >= chapter.time) index = position; });
    markChapter(index);
  });
  video.addEventListener('error', () => {
    status.textContent = 'The recording could not load. The complete text alternative, original stills and download remain available below.';
  });
  buttons.forEach((button, index) => {
    button.disabled = false;
    button.addEventListener('click', () => {
      video.pause();
      pendingSeek = chapters[index].time;
      markChapter(index);
      status.textContent = `Recorded moment: ${chapters[index].description} These controls only seek the film.`;
      if (video.readyState >= 1) seek(pendingSeek);
      else video.load();
      const bounds = video.getBoundingClientRect();
      if (bounds.top < 24 || bounds.bottom > window.innerHeight - 24) {
        video.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    });
  });
  root.dataset.ready = 'true';
}
