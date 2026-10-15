/** Native dialog enhancement; the trigger's direct film link is the fallback. */
export function initializeOverviewFilm(root: HTMLElement) {
  const trigger = root.querySelector<HTMLAnchorElement>('[data-overview-trigger]');
  const dialog = root.querySelector<HTMLDialogElement>('[data-overview-dialog]');
  const video = root.querySelector<HTMLVideoElement>('[data-overview-video]');
  const close = root.querySelector<HTMLButtonElement>('[data-overview-close]');
  if (!trigger || !dialog || !video || !close || typeof dialog.showModal !== 'function') return;

  let previousOverflow: string | undefined;
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-controls', dialog.id);

  const pause = () => video.pause();
  const restoreScroll = () => {
    if (previousOverflow !== undefined) {
      document.body.style.overflow = previousOverflow;
      previousOverflow = undefined;
    }
  };
  trigger.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    if (dialog.open) return;
    if (!video.hasAttribute('src')) {
      video.src = video.dataset.src!;
      video.poster = video.dataset.poster!;
      video.querySelectorAll<HTMLTrackElement>('track[data-src]').forEach(track => { track.src = track.dataset.src!; });
      video.preload = 'metadata';
      video.load();
    }
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    pause();
    restoreScroll();
    trigger.focus({ preventScroll: true });
  });
  window.addEventListener('pagehide', () => {
    pause();
    if (dialog.open) dialog.close();
    restoreScroll();
  });
}
