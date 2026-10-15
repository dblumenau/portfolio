import type { ExperienceBridge, WorldExperience, Suspension } from '../experience-host';
import { candidateLabels, evidenceJSON, findRecords, initialState, inspect, memoryLabel, type Candidate } from './model';
import type { MemoryDeskScene } from './scene';

export function mountMemoryDesk(root: HTMLElement, bridge: ExperienceBridge): WorldExperience {
  const card = root.querySelector<HTMLElement>('[data-memory-card]')!, overlay = root.querySelector<HTMLElement>('[data-memory-overlay]')!;
  const get = <T extends HTMLElement = HTMLElement>(name: string) => card.querySelector<T>(`[data-memory-${name}]`)!;
  const scope = new AbortController(), motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let state = initialState(), active = false, disposed = false, gpu = bridge.gpuAvailable(), visible = true;
  let scene: MemoryDeskScene | undefined, pending: Promise<void> | undefined, url: string | null = null;
  function revoke() { if (url) URL.revokeObjectURL(url); url = null; get<HTMLAnchorElement>('download').removeAttribute('href'); }
  function exportURL() { revoke(); if (active && state.selected.size) { url = URL.createObjectURL(new Blob([evidenceJSON(state)], { type: 'application/json' })); get<HTMLAnchorElement>('download').href = url; } }
  function update(animate = true) {
    get<HTMLButtonElement>('find').disabled = false;
    get('results').hidden = state.records.length === 0;
    get('status').textContent = state.records.length ? `${state.records.length} matching records in this sample` : 'Open the index drawer to retrieve the records.';
    card.querySelectorAll<HTMLButtonElement>('[data-memory-inspect]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.memoryInspect === state.inspected)));
    const record = state.records.find(item => item.tuple.object === state.inspected);
    if (record) {
      get('label').textContent = `${record.tuple.object} · inspected record`;
      get('tuple').textContent = `${record.tuple.subject} / ${record.tuple.predicate} / ${record.tuple.object}`;
      get('type').textContent = record.originalType ?? 'unknown (null in the sample)';
      get('source').hidden = !record.excerpt; get('missing').hidden = !!record.excerpt;
      get('quote').textContent = record.excerpt?.quote ?? ''; get('attribution').textContent = record.excerpt?.attribution ?? '';
      get('toggle').textContent = state.selected.has(state.inspected!) ? 'Remove from my evidence card' : 'Add to my evidence card';
      get('toggle').setAttribute('aria-pressed', String(state.selected.has(state.inspected!)));
    }
    get('selection').textContent = `${state.selected.size} of 3 records selected${state.selected.size ? `: ${candidateLabels.filter(label => state.selected.has(label)).join(', ')}` : ''}`;
    get('json').textContent = evidenceJSON(state);
    const download = get<HTMLAnchorElement>('download'); download.setAttribute('aria-disabled', String(!state.selected.size)); download.textContent = state.selected.size ? 'Download evidence card' : 'Choose at least one record';
    download.tabIndex = state.selected.size ? 0 : -1; exportURL();
    scene?.sync(state, animate && visible && !document.hidden && !motion.matches); bridge.invalidate();
    root.dataset.memorySelected = String(state.selected.size);
  }
  function revealEvidence() {
    if (window.innerWidth > 1100) return;
    const evidence = get(get('source').hidden ? 'missing' : 'source');
    const box = evidence.getBoundingClientRect(), top = 8, bottom = window.innerHeight - 8;
    const delta = box.top < top ? box.top - top : box.bottom > bottom ? box.bottom - bottom : 0;
    if (delta) window.scrollBy({ top: delta, behavior: 'instant' });
  }
  function focusEntry() {
    const heading = card.querySelector<HTMLElement>('h2')!, clip = card.getBoundingClientRect();
    const top = Math.max(0, clip.top), bottom = Math.min(window.innerHeight, clip.bottom);
    const candidates = [heading, ...card.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],summary,[tabindex="0"]')];
    const target = candidates.find(element => { const box = element.getBoundingClientRect(); return box.width > 0 && box.height > 0 && box.top >= top && box.bottom <= bottom; });
    (target ?? heading).focus({ preventScroll: true });
  }
  function query(label: Candidate = 'vue') { state.records = findRecords(); inspect(state, label); update(); }
  function loadScene() {
    if (!active || !gpu || pending || scene) return;
    pending = import('./scene').then(({ buildMemoryDesk }) => {
      if (disposed || !active) return; scene = buildMemoryDesk(); delete root.dataset.memoryScene; scene.sync(state, false); bridge.invalidate();
    }).catch(() => { root.dataset.memoryScene = 'unavailable'; delete root.querySelector<HTMLElement>('[data-world-stage]')!.dataset.experienceLoading; }).finally(() => { pending = undefined; });
  }
  card.addEventListener('click', event => {
    if (!active || disposed) return;
    const target = (event.target as Element).closest<HTMLElement>('button,a'); if (!target) return;
    if (target.hasAttribute('data-memory-find')) { query(); revealEvidence(); bridge.pushHash('#memory-desk/vue'); }
    else if (target.dataset.memoryInspect && candidateLabels.includes(target.dataset.memoryInspect as Candidate)) { inspect(state, target.dataset.memoryInspect as Candidate); update(); revealEvidence(); bridge.pushHash(`#memory-desk/${state.inspected}`); }
    else if (target.hasAttribute('data-memory-toggle') && state.inspected) { state.selected.has(state.inspected) ? state.selected.delete(state.inspected) : state.selected.add(state.inspected); state.assembled = false; get('download-status').textContent = ''; update(); }
    else if (target.hasAttribute('data-memory-reset')) { state.selected.clear(); state.assembled = false; get('download-status').textContent = ''; update(false); }
    else if (target.hasAttribute('data-memory-download')) { if (!state.selected.size) { event.preventDefault(); return; } state.assembled = true; exportURL(); get('download-status').textContent = 'Evidence card prepared locally. The JSON preview contains the same bytes.'; scene?.sync(state, !motion.matches); bridge.invalidate(); }
  }, { signal: scope.signal });
  return {
    enter(hash) { const entering = !active; active = true; card.hidden = overlay.hidden = false; if (gpu) root.querySelector<HTMLElement>('[data-world-stage]')!.dataset.experienceLoading = 'true'; else delete root.querySelector<HTMLElement>('[data-world-stage]')!.dataset.experienceLoading; const label = memoryLabel(hash); if (label) query(label); else update(false); loadScene(); if (entering) focusEntry(); },
    leave() { active = false; card.hidden = overlay.hidden = true; scene?.dispose(); scene = undefined; revoke(); },
    attachGPU(available) { gpu = available; if (available && active) { root.querySelector<HTMLElement>('[data-world-stage]')!.dataset.experienceLoading = 'true'; loadScene(); scene?.refresh(); bridge.invalidate(); } },
    render(renderer, now) { if (!active || !scene || !gpu) return false; const viewport = root.querySelector<HTMLElement>('[data-world-viewport]')!; const moving = scene.render(renderer, now, viewport.clientWidth, viewport.clientHeight); delete root.querySelector<HTMLElement>('[data-world-stage]')!.dataset.experienceLoading; root.dataset.memoryDrawCalls = String(renderer.info.render.calls); root.dataset.memoryTriangles = String(renderer.info.render.triangles); root.dataset.memoryTextures = '1'; root.dataset.memoryFrames = String(Number(root.dataset.memoryFrames ?? 0) + 1); return moving; },
    suspend(reason: Suspension) { visible = false; scene?.settle(); if (reason === 'context-lost') gpu = false; },
    resume() { visible = true; scene?.settle(); scene?.refresh(); if (active) bridge.invalidate(); },
    escape() { return false; },
    dispose() { disposed = true; active = false; scope.abort(); scene?.dispose(); scene = undefined; revoke(); },
  };
}
