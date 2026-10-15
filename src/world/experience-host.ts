import type * as THREE from 'three';
import { mountAttentionTask } from './attention-task/controller';
import { taskHash } from './attention-task/model';

export type WorldPose = { worldHash?: string; position: [number, number, number]; target: [number, number, number]; quaternion: [number, number, number, number] };
export type WorldOrigin = { hash: string; state: Record<string, unknown>; scroll: number; inspectorScroll: number; pose?: WorldPose };
export type ExperienceId = 'attention' | 'printshop';
export type Suspension = 'offscreen' | 'hidden' | 'persisted' | 'context-lost';
export type ExperienceBridge = { invalidate: () => void; pushHash: (hash: string) => void; exit: () => void; gpuAvailable: () => boolean };
export type WorldExperience = {
  enter: (hash: string, fresh: boolean) => void; leave: () => void;
  attachGPU: (available: boolean) => void; render: (renderer: THREE.WebGLRenderer, now: number) => boolean;
  suspend: (reason: Suspension) => void; resume: () => void; escape: () => boolean; dispose: () => void;
};
type WorldHooks = { capture: () => WorldPose; open: (origin: WorldOrigin) => void; close: () => void; invalidate: () => void };
const experienceForHash = (hash: string): ExperienceId | null => taskHash(hash) !== null ? 'attention' : /^#printshop(?:\/|$)/.test(hash) ? 'printshop' : null;

/** Navigation, origin and input ownership for the two World experiences. */
export function mountExperienceHost(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>('[data-world-stage]')!;
  const scope = new AbortController();
  let activeId: ExperienceId | null = null, disposed = false, request = 0, gpu = false;
  let hooks: WorldHooks | undefined;
  let previous: WorldOrigin & { focus: HTMLElement | null } = { hash: '', state: {}, scroll: 0, inspectorScroll: 0, focus: null };
  const modules = new Map<ExperienceId, WorldExperience>();
  let shopImport: Promise<typeof import('./printshop/controller')> | undefined;
  const cleanState = (state: unknown) => { const copy = state && typeof state === 'object' ? { ...state } as Record<string, unknown> : {}; delete copy.worldTask; delete copy.worldTaskOrigin; return copy; };
  function stateForHistory() { const { focus: _focus, ...origin } = previous; return { ...origin.state, worldTask: true, worldTaskOrigin: origin }; }
  function readOrigin(): WorldOrigin | null {
    const origin = history.state?.worldTaskOrigin as WorldOrigin | undefined;
    if (!origin || typeof origin.hash !== 'string' || experienceForHash(origin.hash) || (origin.hash && !origin.hash.startsWith('#')) || !Number.isFinite(origin.scroll) || !Number.isFinite(origin.inspectorScroll)) return null;
    const pose = origin.pose;
    const valid = pose && (pose.worldHash === undefined || typeof pose.worldHash === 'string') && [pose.position, pose.target, pose.quaternion].every((values, index) => Array.isArray(values) && values.length === (index === 2 ? 4 : 3) && values.every(Number.isFinite));
    return { hash: origin.hash, state: cleanState(origin.state), scroll: origin.scroll, inspectorScroll: origin.inspectorScroll, ...(valid ? { pose } : {}) };
  }
  const bridge = (id: ExperienceId): ExperienceBridge => ({
    invalidate: () => { if (activeId === id && !disposed) hooks?.invalidate(); },
    pushHash: hash => { if (activeId === id && location.hash !== hash) history.pushState(stateForHistory(), '', hash); },
    exit: () => exit(), gpuAvailable: () => gpu,
  });
  modules.set('attention', mountAttentionTask(root, bridge('attention')));
  function activateHooks() { const id = activeId; activeId = null; hooks?.open(previous); activeId = id; }
  function showMode(id: ExperienceId) {
    root.dataset.experience = stage.dataset.experience = id; stage.dataset.experienceLoading = 'true';
    const card = root.querySelector<HTMLElement>('[data-shop-card]');
    if (card && id === 'printshop') card.hidden = false;
  }
  async function open(id: ExperienceId, fresh = true, hash = id === 'attention' ? '#task/attention/waiting' : '#printshop') {
    if (disposed) return;
    if (activeId === id) { if (!fresh) modules.get(id)?.enter(hash, false); return; }
    const switching = activeId !== null;
    if (switching) exit(false, false);
    if (fresh && !switching) previous = { hash: location.hash, state: cleanState(history.state), scroll: window.scrollY, inspectorScroll: root.querySelector<HTMLElement>('[data-world-inspector]')!.scrollTop, focus: document.activeElement as HTMLElement, pose: hooks?.capture() };
    else if (!fresh) {
      const origin = readOrigin();
      if (origin) previous = { ...origin, focus: origin.hash === previous.hash && previous.focus?.isConnected ? previous.focus : root.querySelector<HTMLElement>(id === 'attention' ? '[data-open-task]' : '[data-open-printshop]') };
      else { const selected = root.dataset.selected; previous = { hash: selected ? `#${selected}${stage.dataset.exhibit ? '/exhibit' : ''}` : '', state: cleanState(history.state), scroll: window.scrollY, inspectorScroll: root.querySelector<HTMLElement>('[data-world-inspector]')!.scrollTop, focus: root.querySelector<HTMLElement>(id === 'attention' ? '[data-open-task]' : '[data-open-printshop]'), pose: hooks?.capture() }; }
    }
    activeId = id; activateHooks(); showMode(id);
    const token = ++request;
    if (fresh) history.pushState(stateForHistory(), '', hash);
    window.scrollTo({ top: Math.max(0, window.scrollY + stage.getBoundingClientRect().top - 12), behavior: 'instant' });
    if (!modules.has(id)) {
      try {
        shopImport ||= import('./printshop/controller');
        const { mountPrintshop } = await shopImport;
        if (disposed || token !== request || activeId !== id) return;
        modules.set(id, mountPrintshop(root, bridge(id)));
      } catch {
        if (activeId === id) root.querySelector<HTMLElement>('[data-shop-status]')!.textContent = 'The press could not open. The Studio Lab and readable map are available below.';
        return;
      }
    }
    if (disposed || token !== request || activeId !== id) return;
    const experience = modules.get(id)!; experience.attachGPU(gpu); experience.enter(hash, fresh); hooks?.invalidate();
  }
  function exit(push = true, restoreFocus = true) {
    if (!activeId) return;
    ++request;
    modules.get(activeId)?.leave(); activeId = null;
    root.querySelector<HTMLElement>('[data-shop-card]')!.hidden = true;
    delete root.dataset.experience; delete stage.dataset.experience; delete stage.dataset.experienceLoading;
    if (push) history.pushState(previous.state, '', `${location.pathname}${location.search}${previous.hash}`);
    hooks?.close();
    root.querySelector<HTMLElement>('[data-world-inspector]')!.scrollTop = previous.inspectorScroll;
    window.scrollTo({ top: previous.scroll, behavior: 'instant' });
    if (restoreFocus && previous.focus?.isConnected) previous.focus.focus({ preventScroll: true });
  }
  function fromHash() { const id = experienceForHash(location.hash); if (id) { if (activeId === id) modules.get(id)?.enter(location.hash, false); else void open(id, false, location.hash); } else exit(false); }
  root.addEventListener('click', event => {
    const target = (event.target as Element).closest<HTMLElement>('[data-open-task],[data-open-printshop],[data-task-exit],[data-shop-exit]');
    if (!target) return;
    event.preventDefault();
    if (target.hasAttribute('data-open-task')) void open('attention');
    else if (target.hasAttribute('data-open-printshop')) void open('printshop');
    else exit();
  }, { signal: scope.signal });
  for (const event of ['popstate', 'hashchange']) window.addEventListener(event, fromHash, { signal: scope.signal });
  window.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !activeId || event.defaultPrevented) return;
    const target = event.target as HTMLElement;
    if (event.isComposing || target.matches('input,textarea,select,[contenteditable="true"]')) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (!modules.get(activeId)?.escape()) exit();
  }, { signal: scope.signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) modules.get(activeId!)?.suspend('hidden'); else modules.get(activeId!)?.resume(); }, { signal: scope.signal });
  window.addEventListener('pagehide', event => { if (event.persisted) modules.get(activeId!)?.suspend('persisted'); }, { signal: scope.signal });
  window.addEventListener('pageshow', event => { if (event.persisted) modules.get(activeId!)?.resume(); }, { signal: scope.signal });
  root.querySelector('[data-world-canvas]')!.addEventListener('webglcontextlost', () => { gpu = false; modules.forEach(module => module.attachGPU(false)); modules.get(activeId!)?.suspend('context-lost'); }, { signal: scope.signal });
  root.querySelector('[data-world-canvas]')!.addEventListener('webglcontextrestored', () => { gpu = true; modules.forEach(module => module.attachGPU(true)); modules.get(activeId!)?.resume(); }, { signal: scope.signal });
  fromHash();
  return {
    get active() { return activeId !== null; },
    ownsHash: (hash: string) => experienceForHash(hash) !== null,
    open: (id: ExperienceId) => open(id), exit,
    connect(value: WorldHooks) { hooks = value; gpu = true; if (activeId) activateHooks(); modules.forEach(module => module.attachGPU(true)); hooks.invalidate(); },
    suspend(reason: Suspension = 'offscreen') { modules.get(activeId!)?.suspend(reason); },
    resume() { modules.get(activeId!)?.resume(); },
    render: (renderer: THREE.WebGLRenderer, now: number) => activeId ? modules.get(activeId)?.render(renderer, now) ?? false : false,
    dispose() { disposed = true; ++request; scope.abort(); modules.forEach(module => module.dispose()); },
  };
}
export type ExperienceHost = ReturnType<typeof mountExperienceHost>;
