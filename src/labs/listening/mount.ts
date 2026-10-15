import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ListeningPlayer } from './player';

for (const host of document.querySelectorAll<HTMLElement>('[data-listening-mount]')) {
  let root: Root | null = null;
  const mount = () => {
    if (root) return;
    root = createRoot(host);
    root.render(createElement(ListeningPlayer));
  };
  mount();
  window.addEventListener('pagehide', () => { root?.unmount(); root = null; });
  window.addEventListener('pageshow', event => { if (event.persisted) mount(); });
}
