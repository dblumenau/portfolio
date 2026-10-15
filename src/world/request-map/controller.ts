import type { ExperienceBridge, WorldExperience, Suspension } from '../experience-host';
import { caseDefinitions, projectCase, fields, caseForHash, buildSVG, type CaseKey, type EvidenceField } from './model';
import type { RequestDeskScene, DeskView } from './scene';

export function mountRequestMap(root: HTMLElement, bridge: ExperienceBridge): WorldExperience {
  const card = root.querySelector<HTMLElement>('[data-request-card]')!, overlay = root.querySelector<HTMLElement>('[data-request-overlay]')!;
  const get = <T extends HTMLElement = HTMLElement>(name: string) => card.querySelector<T>(`[data-request-${name}]`)!;
  const scope = new AbortController(), motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 640;
  const image = get<HTMLImageElement>('preview');
  let key: CaseKey = 'host-volume-policy-denied', field: EvidenceField = 'policy', opened = false, svg: string | null = null;
  let active = false, disposed = false, gpu = bridge.gpuAvailable(), visible = true, version = 0, boardReady = false;
  let scene: RequestDeskScene | undefined, pending: Promise<void> | undefined, url: string | null = null;
  function view(): DeskView { return { record: projectCase(key), field, opened, saved: !!svg && boardReady, version }; }
  function revoke() { if (url) URL.revokeObjectURL(url); url = null; image.removeAttribute('src'); get<HTMLAnchorElement>('download').removeAttribute('href'); }
  function attachArtifact() { boardReady = false; revoke(); if (active && svg) { url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })); image.src = url; image.alt = `Evidence map: ${projectCase(key).question}`; get<HTMLAnchorElement>('download').href = url; } }
  function clearArtifact() { boardReady = false; svg = null; revoke(); get('export-status').textContent = ''; }
  function update(animate = true) {
    const record = projectCase(key);
    get<HTMLButtonElement>('open').disabled = false; get('open').hidden = opened;
    get('question').textContent = record.question; get('role').textContent = `${record.caller} / ${record.tool}`;
    get('outcome').hidden = !opened; get('inspection').hidden = !opened;
    get('result').textContent = record.outcome; get('status').textContent = record.status; get('count').textContent = String(record.upstreamToolCalls);
    get('key').textContent = key; get('catalog-ref').textContent = record.catalog?.key ?? 'not established by this case';
    get('notice').textContent = opened ? `${record.upstreamToolCalls} observed backend tool calls. No request is sent here.` : 'Open the card to read the recorded result.';
    card.querySelectorAll<HTMLButtonElement>('[data-request-case]').forEach(button => { button.disabled = false; button.hidden = button.dataset.requestCase === key; });
    card.querySelectorAll<HTMLButtonElement>('[data-request-field]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.requestField === field)));
    overlay.querySelectorAll<HTMLElement>('[data-request-window]').forEach(label => label.dataset.selected = String(opened && label.dataset.requestWindow === field));
    get('evidence-title').textContent = fields.find(item => item.key === field)!.label;
    get('facts').replaceChildren(...record.evidence[field].map(fact => { const p = document.createElement('p'); p.textContent = fact; return p; }));
    get('saved').hidden = !svg; overlay.querySelector<HTMLElement>('[data-request-scene-note]')!.textContent = opened ? `${record.tool} / ${record.upstreamToolCalls} backend tool calls / ${record.backendIdentity}` : 'A recorded request, ready to open.';
    scene?.sync(view(), animate && visible && !document.hidden && !motion.matches); bridge.invalidate();
    card.dataset.requestForwarded = String(record.upstreamToolCalls === 1); root.dataset.requestCaseKey = key; root.dataset.requestEvidenceField = field; root.dataset.requestSaved = String(!!svg);
  }
  function revealEvidence() { if (window.innerWidth > 1100) return; const box = get('evidence').getBoundingClientRect(), top = 8, bottom = window.innerHeight - 8; const delta = box.top < top ? box.top - top : box.bottom > bottom ? box.bottom - bottom : 0; if (delta) window.scrollBy({ top: delta, behavior: 'instant' }); }
  function focusEntry() {
    const heading = card.querySelector<HTMLElement>('h2')!, clip = card.getBoundingClientRect(), top = Math.max(0, clip.top), bottom = Math.min(window.innerHeight, clip.bottom);
    const target = [heading, ...card.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],summary')].find(element => { const box = element.getBoundingClientRect(); return box.width > 0 && box.height > 0 && box.top >= top && box.bottom <= bottom; });
    (target ?? heading).focus({ preventScroll: true });
  }
  function loadScene() {
    if (!active || !gpu || pending || scene) return;
    pending = import('./scene').then(({ buildRequestDesk }) => { if (disposed || !active) return; scene = buildRequestDesk(canvas); delete root.dataset.requestScene; scene.sync(view(), false); bridge.invalidate(); }).catch(() => { root.dataset.requestScene = 'unavailable'; delete root.querySelector<HTMLElement>('[data-world-stage]')!.dataset.experienceLoading; }).finally(() => { pending = undefined; });
  }
  image.addEventListener('load', () => {
    if (!active || disposed || !url || image.currentSrc !== url || !svg) return;
    const context = canvas.getContext('2d')!; context.fillStyle = '#fbf7ec'; context.fillRect(0, 0, 512, 640); const scale = Math.min(512 / image.naturalWidth, 640 / image.naturalHeight); context.drawImage(image, (512 - image.naturalWidth * scale) / 2, 0, image.naturalWidth * scale, image.naturalHeight * scale); boardReady = true; version++; scene?.sync(view(), false); bridge.invalidate();
  }, { signal: scope.signal });
  card.addEventListener('click', event => {
    if (!active || disposed) return; const button = (event.target as Element).closest<HTMLButtonElement>('button'); if (!button || button.disabled) return;
    if (button.hasAttribute('data-request-open')) { opened = true; update(); bridge.pushHash(`#request-map/${key}`); }
    else if (button.dataset.requestCase && caseDefinitions.some(item => item.key === button.dataset.requestCase)) { key = button.dataset.requestCase as CaseKey; field = 'policy'; opened = true; clearArtifact(); update(); bridge.pushHash(`#request-map/${key}`); card.querySelector<HTMLDetailsElement>('.request-choose')!.open = false; get('question').scrollIntoView({ block: 'nearest', behavior: 'instant' }); get('question').focus({ preventScroll: true }); }
    else if (button.dataset.requestField && fields.some(item => item.key === button.dataset.requestField)) { field = button.dataset.requestField as EvidenceField; clearArtifact(); update(); revealEvidence(); }
    else if (button.hasAttribute('data-request-build')) { svg = buildSVG(projectCase(key), field); attachArtifact(); get('export-status').textContent = 'Your SVG is ready. The preview and download use the same map.'; update(false); }
  }, { signal: scope.signal });
  return {
    enter(hash) { const entering = !active; active = true; card.hidden = overlay.hidden = false; const selected = caseForHash(hash); if (selected && selected !== key) { key = selected; opened = true; field = 'policy'; clearArtifact(); } else if (selected) opened = true; update(false); if (svg && !url) attachArtifact(); if (gpu) root.querySelector<HTMLElement>('[data-world-stage]')!.dataset.experienceLoading = 'true'; else delete root.querySelector<HTMLElement>('[data-world-stage]')!.dataset.experienceLoading; loadScene(); if (entering) focusEntry(); },
    leave() { active = false; card.hidden = overlay.hidden = true; scene?.dispose(); scene = undefined; revoke(); },
    attachGPU(available) { gpu = available; if (available && active) { root.querySelector<HTMLElement>('[data-world-stage]')!.dataset.experienceLoading = 'true'; loadScene(); scene?.refresh(); bridge.invalidate(); } },
    render(renderer, now) { if (!active || !gpu || !scene) return false; const viewport = root.querySelector<HTMLElement>('[data-world-viewport]')!; const moving = scene.render(renderer, now, viewport.clientWidth, viewport.clientHeight); delete root.querySelector<HTMLElement>('[data-world-stage]')!.dataset.experienceLoading; root.dataset.requestDrawCalls = String(renderer.info.render.calls); root.dataset.requestTriangles = String(renderer.info.render.triangles); root.dataset.requestFrames = String(Number(root.dataset.requestFrames ?? 0) + 1); return moving; },
    suspend(reason: Suspension) { visible = false; scene?.settle(); if (reason === 'context-lost') gpu = false; },
    resume() { visible = true; scene?.settle(); scene?.refresh(); if (active) bridge.invalidate(); },
    escape() { return false; },
    dispose() { disposed = true; active = false; scope.abort(); svg = null; revoke(); scene?.dispose(); scene = undefined; canvas.width = canvas.height = 0; },
  };
}
