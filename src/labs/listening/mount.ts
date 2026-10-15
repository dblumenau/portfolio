import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ListeningPlayer } from './player';

for (const host of document.querySelectorAll<HTMLElement>('[data-listening-mount]')) {
  let root: Root | null = null;
  let suspended = false;
  let waiting: HTMLAudioElement | null = null;
  let clearNativeWait = () => {};
  const mount = () => {
    if (root || suspended) return;
    const fallback = host.querySelector<HTMLAudioElement>('.ll-fallback audio');
    if (fallback && !fallback.paused && !fallback.ended) {
      if (waiting === fallback) return;
      clearNativeWait();
      waiting = fallback;
      const onStopped = () => { if (fallback.paused || fallback.ended) mount(); };
      fallback.addEventListener('pause', onStopped);
      fallback.addEventListener('ended', onStopped);
      clearNativeWait = () => {
        fallback.removeEventListener('pause', onStopped);
        fallback.removeEventListener('ended', onStopped);
        waiting = null;
        clearNativeWait = () => {};
      };
      host.dataset.listeningState = 'waiting-for-pause';
      const status = host.querySelector<HTMLElement>('.ll-fallback-loading');
      if (status) status.textContent = 'The word and waveform controls are ready. Pause the sample or let it finish to use them.';
      return;
    }
    clearNativeWait();
    const initialTime = fallback?.currentTime ?? 0;
    root = createRoot(host);
    host.dataset.listeningState = 'enhanced';
    root.render(createElement(ListeningPlayer, { initialTime }));
  };
  mount();
  window.addEventListener('pagehide', () => {
    suspended = true;
    clearNativeWait();
    host.querySelector<HTMLAudioElement>('.ll-fallback audio')?.pause();
    root?.unmount(); root = null;
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) { suspended = false; mount(); }
  });
}
