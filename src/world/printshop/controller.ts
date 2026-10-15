import { fontsReady } from '../../labs/studio/fonts';
import { sampleShaderBackground, fallbackBackground, releaseBackground } from '../../labs/studio/shaderBackground';
import type { DecodedBackground } from '../../labs/studio/types';
import { backgrounds, drawDraft, printDocument, freezeDraft, canvasToBlob, releaseSurface, createExportCanvas } from './document';
import { backgroundRecipe, recipeFromDoc, type Recipe } from '../../creative/recipe';
import { readWorkspace, writeWorkspace, restorePNG, storePNG, storageMessage, type WorldWork } from '../../creative/workspace';
import type { ExportSurface } from '../../labs/studio/canvas';
import { initialPrintshop, reducePrintshop, canPull, nextSlot, looks, type Action, type PrintRecord, type Look } from './model';
import type { ExperienceBridge, Suspension, WorldExperience } from '../experience-host';
import type { PrintshopScene } from './scene';
export type FinishedPrint = { record: PrintRecord; surface: ExportSurface; blob: Blob; url: string; recipe: Recipe; blobKey: string };
export type ShopArtwork = { draft: HTMLCanvasElement; version: number; prints: readonly [FinishedPrint | null, FinishedPrint | null] };

export function mountPrintshop(root: HTMLElement, bridge: ExperienceBridge): WorldExperience {
  const card = root.querySelector<HTMLElement>('[data-shop-card]')!;
  const overlay = root.querySelector<HTMLElement>('[data-shop-overlay]')!;
  const form = root.querySelector<HTMLFormElement>('[data-shop-form]')!;
  const draft = root.querySelector<HTMLCanvasElement>('[data-shop-draft]')!;
  const ctx = draft.getContext('2d', { alpha: false });
  const dialog = root.querySelector<HTMLDialogElement>('[data-shop-proof]')!;
  const status = root.querySelector<HTMLElement>('[data-shop-status]')!;
  const scope = new AbortController();
  let state = initialPrintshop(), active = false, disposed = false, fonts = false, fontPromise: Promise<void> | undefined;
  let background: DecodedBackground | null = null, preparedLook: Look | null = null;
  let sampling = false, sampler: AbortController | undefined, generation = 0, encoding = false, serial = 0;
  let preparingSurface: ExportSurface | undefined;
  let focusOnReady = false;
  let composing = false, drawQueued = false, drawVersion = 0, gpu = false, sceneVisible = true;
  let scene: PrintshopScene | undefined, scenePromise: Promise<void> | undefined, pressTimer: ReturnType<typeof setTimeout> | undefined;
  let inspectorFocus: HTMLElement | null = null;
  const prints: [FinishedPrint | null, FinishedPrint | null] = [null, null];
  let restoring = true, restorationFailed = false, saved = true, pinnedFallback = false, workspaceEpoch = 0;
  let pngWrite: Promise<string> | undefined;
  let savedSnapshot: string | undefined;
  let returnFocus: 'draft' | '0' | '1' | undefined;
  const storageStatus = root.querySelector<HTMLElement>('[data-shop-storage]')!;
  function restoreOriginFocus() {
    if (!active || restoring || !returnFocus) return;
    focusOnReady = false; root.querySelector<HTMLElement>(`[data-shop-continue="${returnFocus}"]`)?.focus({ preventScroll: false });
    try { writeWorkspace({ returnFocus: undefined }); } catch {} returnFocus = undefined;
  }
  const worldWork = (): WorldWork => ({ draft: { ...state.draft }, draftVersion: state.draftVersion, fallback: pinnedFallback || state.fallback,
    selected: state.selectedPrint, prints: prints.map(print => print ? { record: print.record, recipe: print.recipe, blobKey: print.blobKey } : null) as WorldWork['prints'] });
  function reloadIfStale(): boolean {
    if (restoring || disposed || encoding || pngWrite || !saved) return false;
    try {
      const latest = readWorkspace().world;
      if (latest ? JSON.stringify(latest) !== JSON.stringify(worldWork()) : state.draftVersion > 0 || prints.some(Boolean)) { location.reload(); return true; }
    } catch {}
    return false;
  }
  const persist = () => {
    if (restoring || disposed) return false;
    if (restorationFailed) { storageStatus.textContent = 'Your rack could not be restored. Reload to retry, or clear this rack before printing. Existing saved records are kept.'; root.dataset.shopSaved = 'false'; return false; }
    try {
      if (JSON.stringify(readWorkspace().world) !== savedSnapshot) return false;
      const work = worldWork(); writeWorkspace({ world: work }); savedSnapshot = JSON.stringify(work); saved = prints.every(print => !print || !!print.blobKey);
    } catch { saved = false; }
    storageStatus.textContent = storageMessage(saved); root.dataset.shopSaved = String(saved); return saved;
  };
  async function restore() {
    const epoch = workspaceEpoch;
    const current = () => !disposed && epoch === workspaceEpoch;
    try {
      const workspace = readWorkspace(), work = workspace.world; returnFocus = workspace.returnFocus; savedSnapshot = JSON.stringify(work);
      if (work) {
        state = { ...state, draft: { ...work.draft }, draftVersion: work.draftVersion, selectedPrint: work.selected }; pinnedFallback = work.fallback;
        field('headline').value = state.draft.headline; field('smallLine').value = state.draft.smallLine;
        for (const slot of [0, 1] as const) {
          const kept = work.prints[slot]; if (!kept) continue;
          let image: ImageBitmap | undefined, surface: ExportSurface | undefined, url: string | undefined;
          try {
            const blob = await restorePNG(kept.blobKey);
            if (!current()) return;
            image = await createImageBitmap(blob);
            if (!current()) return;
            surface = createExportCanvas(); surface.ctx.drawImage(image, 0, 0); image.close(); image = undefined;
            url = URL.createObjectURL(blob);
            prints[slot] = { ...kept, surface, blob, url }; surface = undefined; url = undefined;
            state.prints[slot] = kept.record; serial = Math.max(serial, kept.record.id);
          } catch { if (!current()) return; saved = false; restorationFailed = true; }
          finally { image?.close(); if (surface) releaseSurface(surface); if (url) URL.revokeObjectURL(url); }
        }
        if (!current()) return;
        say(saved ? 'Your draft and kept PNGs are restored.' : 'Some kept PNGs could not be restored. Your editable draft is here.');
      }
      storageStatus.textContent = storageMessage(saved);
    } catch { if (current()) { saved = false; storageStatus.textContent = storageMessage(false); } }
    finally {
      if (current()) {
        restoring = false; root.dataset.shopSaved = String(saved); updateUI(); scene?.sync(artwork());
        if (active) {
          enableFonts();
          const match = /^#printshop\/print-([12])$/.exec(location.hash);
          if (match && prints[Number(match[1]) - 1]) inspect((Number(match[1]) - 1) as 0 | 1, false, false);
          restoreOriginFocus();
        }
      }
    }
  }
  const artwork = (): ShopArtwork => ({ draft, version: drawVersion, prints });
  const field = (name: string) => form.querySelector<HTMLInputElement>(`[data-shop-field="${name}"]`)!;
  function dispatch(action: Action) { state = reducePrintshop(state, action); updateUI(); if (action.type === 'EDIT' || action.type === 'SELECT_PRINT') persist(); }
  function say(message: string) { if (!disposed) status.textContent = message; }
  function updateUI() {
    root.dataset.shopPreparation = state.preparation; root.dataset.shopMode = state.mode; root.dataset.shopVersion = String(state.draftVersion);
    root.dataset.shopPrints = String(state.prints.filter(Boolean).length); root.dataset.shopFallback = String(state.fallback);
    card.setAttribute('aria-busy', String(!!state.pendingPrint || state.preparation === 'sampling-look' || state.preparation === 'loading-fonts'));
    const ready = fonts && !!ctx && !restoring;
    form.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input,[data-shop-look],[data-shop-arrangement]').forEach(control => { control.disabled = !ready; });
    form.querySelectorAll<HTMLElement>('[data-shop-look]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.shopLook === state.draft.look)));
    form.querySelectorAll<HTMLElement>('[data-shop-arrangement]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.shopArrangement === state.draft.arrangement)));
    const slot = nextSlot(state);
    const action = restorationFailed ? 'Reload to restore, or clear this rack' : !state.draft.headline.trim() ? 'Add a headline' : slot === null ? 'Choose a print to replace' : state.replacement !== null ? `Pull a replacement for Print ${slot + 1}` : prints[0] ? 'Pull a second print' : 'Pull a print';
    root.querySelectorAll<HTMLButtonElement>('[data-shop-pull]').forEach(button => { button.disabled = !ready || restorationFailed || !canPull(state) || encoding || composing; button.setAttribute('aria-label', action); if (button.hasAttribute('data-shop-lever')) button.querySelector('span')!.textContent = state.replacement !== null ? `Replace Print ${state.replacement + 1}` : prints[0] ? 'Pull again' : 'Pull a print'; else button.textContent = action; });
    root.querySelector<HTMLAnchorElement>('[data-shop-continue="draft"]')!.setAttribute('aria-disabled', String(!ready || state.preparation !== 'ready' || !state.draft.headline.trim()));
    const current = looks.find(look => look.id === preparedLook)?.label;
    const requested = looks.find(look => look.id === state.draft.look)!.label;
    root.querySelector<HTMLElement>('[data-shop-draft-look]')!.textContent = state.fallback ? 'Simple background on this device' : current ? `${current} · still sample` : 'Preparing the ink';
    root.querySelector<HTMLElement>('[data-shop-look-note]')!.textContent = state.preparation === 'sampling-look' ? `Preparing ${requested}.${current ? ` The draft still shows ${current}.` : ''}` : state.fallback ? 'Simple background on this device. This is still a real print.' : 'Original Studio ink, sampled as a still.';
    root.querySelector<HTMLElement>('[data-shop-empty]')!.hidden = prints.some(Boolean);
    root.querySelector<HTMLElement>('[data-shop-next]')!.hidden = !prints.some(Boolean);
    root.querySelector<HTMLElement>('[data-shop-compare]')!.hidden = !prints.every(Boolean);
    root.querySelector<HTMLElement>('[data-shop-replace]')!.hidden = !prints.every(Boolean);
    root.querySelector<HTMLElement>('[data-shop-replace-cancel]')!.hidden = state.replacement === null;
    root.querySelectorAll<HTMLButtonElement>('[data-shop-replace-slot]').forEach(button => { button.setAttribute('aria-pressed', String(Number(button.dataset.shopReplaceSlot) === state.replacement)); button.disabled = !!state.pendingPrint || state.mode === 'pressing' || encoding; });
    for (const slot of [0, 1] as const) {
      const print = prints[slot];
      root.querySelector<HTMLElement>(`[data-shop-slot="${slot}"]`)!.hidden = !print;
      const pin = root.querySelector<HTMLButtonElement>(`[data-shop-anchor="print${slot}"]`)!;
      pin.disabled = !print; pin.setAttribute('aria-pressed', String(state.selectedPrint === slot));
      root.querySelector<HTMLElement>(`[data-shop-pin-note="${slot}"]`)!.textContent = print ? 'Inspect this print' : 'Room for a print';
      if (!print) continue;
      const look = looks.find(look => look.id === print.record.look)!.label;
      const description = `${print.record.headline} · ${look} · ${print.record.arrangement === 'center' ? 'Centred' : 'Poster'}`;
      root.querySelector<HTMLElement>(`[data-shop-summary="${slot}"]`)!.textContent = description;
      root.querySelector<HTMLElement>(`[data-shop-proof-description="${slot}"]`)!.textContent = description;
      root.querySelectorAll<HTMLAnchorElement>(`[data-shop-download="${slot}"]`).forEach(link => { link.href = print.url; });
    }
    bridge.invalidate();
  }
  function draw() {
    if (!active || disposed || document.hidden || !ctx || !fonts || !background) return;
    drawDraft({ canvas: draft, ctx }, state.draft, background); drawVersion++;
    root.dataset.shopRasterReady = 'true'; scene?.sync(artwork()); bridge.invalidate();
  }
  function queueDraw() { if (drawQueued) return; drawQueued = true; queueMicrotask(() => { drawQueued = false; if (!composing) draw(); }); }
  function focusEntry() { if (active && fonts && focusOnReady && !state.inspectorOpen) { focusOnReady = false; field('headline').focus({ preventScroll: true }); } }
  function enableFonts() {
    if (fonts) { focusEntry(); void prepareLook(); return; }
    fontPromise ||= fontsReady();
    void fontPromise.then(() => { fonts = true; if (active && !disposed) { updateUI(); focusEntry(); void prepareLook(); } }).catch(() => { if (active && !disposed) { dispatch({ type: 'PREPARATION', value: 'error' }); say('The local typefaces could not load. Reopen the press to try again.'); fontPromise = undefined; } });
  }
  async function prepareLook() {
    if (!fonts || !active || disposed || document.hidden || restoring) return;
    sampler?.abort();
    if (sampling) return;
    sampling = true;
    try {
      while (active && !disposed && !document.hidden) {
        const wanted = state.draft.look;
        if (preparedLook === wanted && background) { dispatch({ type: 'PREPARATION', value: 'ready' }); draw(); break; }
        const stamp = generation, controller = new AbortController(); sampler = controller;
        dispatch({ type: 'PREPARATION', value: 'sampling-look' });
        const preset = backgrounds.find(preset => preset.id === wanted)!;
        let next: DecodedBackground | null = null, fallback = false;
        try { if (pinnedFallback) { next = fallbackBackground(preset); fallback = true; } else next = await sampleShaderBackground(preset, { size: 512, signal: controller.signal }); }
        catch (error) {
          if (controller.signal.aborted || stamp !== generation || !active || disposed) continue;
          try { next = fallbackBackground(preset); fallback = true; }
          catch { dispatch({ type: 'PREPARATION', value: 'error' }); say('This browser could not open a drawing surface. The Studio Lab is available below.'); break; }
        }
        if (!next) continue;
        if (controller.signal.aborted || stamp !== generation || !active || disposed || state.draft.look !== wanted) { releaseBackground(next); continue; }
        releaseBackground(background); background = next; preparedLook = wanted;
        dispatch({ type: 'PREPARATION', value: 'ready', fallback }); draw(); persist();
        say(prints.every(Boolean) && state.replacement === null ? 'Your draft is ready. Choose a print to replace; both finished prints are kept.' : fallback ? 'Simple background on this device. Your draft is ready to print.' : 'Your draft is ready. Pull a print to keep its pixels.');
        break;
      }
    } finally { sampling = false; sampler = undefined; }
  }
  function settle() { if (pressTimer) clearTimeout(pressTimer); pressTimer = undefined; scene?.settle(); if (state.mode === 'pressing') dispatch({ type: 'SETTLE' }); }
  function discardPending() { generation++; sampler?.abort(); if (state.pendingPrint) { if (preparingSurface) releaseSurface(preparingSurface); preparingSurface = undefined; dispatch({ type: 'CANCEL_PRINT' }); say('Preparation stopped. Your draft and finished prints are kept.'); } settle(); }
  async function pull() {
    if (!active || disposed || document.hidden || encoding || composing || !canPull(state) || !ctx) return;
    const slot = nextSlot(state)!;
    const job = ++serial, stamp = generation;
    const record: PrintRecord = { id: job, ...state.draft, version: state.draftVersion };
    const recipe = recipeFromDoc(printDocument(record, background!), backgroundRecipe(record.look, state.fallback ? 'fallback' : 'raw-still'));
    dispatch({ type: 'PULL', job, slot });
    if (state.pendingPrint?.job !== job) return;
    encoding = true; updateUI();
    let frozen: ExportSurface | undefined, committed = false;
    try {
      draw(); frozen = freezeDraft(draft); preparingSurface = frozen;
      say(`Preparing Print ${slot + 1}…`);
      const blob = await canvasToBlob(frozen.canvas, 'image/png', 1);
      if (disposed || !active || generation !== stamp || state.pendingPrint?.job !== job) return;
      const url = URL.createObjectURL(blob), old = prints[slot];
      const print: FinishedPrint = { record: Object.freeze(record), surface: frozen, blob, url, recipe, blobKey: '' };
      prints[slot] = print; committed = true;
      dispatch({ type: 'PRINT_READY', job, print: record }); root.querySelector<HTMLElement>('[data-shop-missing]')!.hidden = true;
      scene?.sync(artwork());
      if (old) { URL.revokeObjectURL(old.url); releaseSurface(old.surface); }
      say(`Print ${slot + 1} is ready. Its pixels are kept while you change the next draft.`);
      const epoch = workspaceEpoch; storageStatus.textContent = 'Saving the exact PNG for your return…'; root.dataset.shopSaved = 'saving';
      try { pngWrite = storePNG(blob); const key = await pngWrite; if (!disposed && epoch === workspaceEpoch && prints[slot] === print) { print.blobKey = key; persist(); } }
      catch { if (!disposed && epoch === workspaceEpoch) { saved = false; root.dataset.shopSaved = 'false'; storageStatus.textContent = storageMessage(false); } }
      finally { pngWrite = undefined; }
      if (disposed || epoch !== workspaceEpoch || prints[slot] !== print) return;
      if (scene && gpu && sceneVisible && !document.hidden) { scene.startPress(slot, performance.now()); bridge.invalidate(); pressTimer = setTimeout(settle, 960); }
      else settle();
    } catch {
      if (active && !disposed && stamp === generation) { dispatch({ type: 'PRINT_FAILED' }); say('The PNG could not be prepared. Your finished prints are unchanged. Try pulling again.'); }
    } finally { if (frozen && !committed) releaseSurface(frozen); preparingSurface = undefined; encoding = false; if (active && !disposed) updateUI(); }
  }
  function closeInspector(restore = true) { if (dialog.open) dialog.close(); dispatch({ type: 'CLOSE_INSPECTOR' }); if (restore) { const target = inspectorFocus?.getClientRects().length ? inspectorFocus : card.querySelector<HTMLElement>(`[data-shop-slot="${state.selectedPrint ?? 0}"] [data-shop-inspect]`); target?.focus({ preventScroll: true }); } }
  function inspect(slot: 0 | 1, two = false, push = true) {
    if (!prints[slot]) { say('No print from that earlier page session is available. Make one here.'); return; }
    const focused = document.activeElement as HTMLElement; inspectorFocus = card.contains(focused) || overlay.contains(focused) ? focused : card.querySelector<HTMLElement>(`[data-shop-slot="${slot}"] [data-shop-inspect]`); root.querySelector<HTMLElement>('[data-shop-missing]')!.hidden = true;
    dispatch({ type: 'SELECT_PRINT', slot, inspect: true });
    if (push) bridge.pushHash(`#printshop/print-${slot + 1}`);
    root.querySelector<HTMLElement>('[data-shop-proof-title]')!.textContent = two ? 'A small edition of two' : `Print ${slot + 1}`;
    root.querySelector<HTMLElement>('[data-shop-proof-grid]')!.dataset.compare = String(two);
    for (const index of [0, 1] as const) {
      const figure = root.querySelector<HTMLElement>(`[data-shop-proof-slot="${index}"]`)!;
      figure.hidden = !(prints[index] && (two || index === slot));
      if (!figure.hidden) { const image = figure.querySelector<HTMLImageElement>('img')!; image.src = prints[index]!.url; image.alt = `Print ${index + 1}: ${prints[index]!.record.headline}`; }
    }
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0; root.querySelector<HTMLElement>('[data-shop-proof-close]')!.focus({ preventScroll: true });
  }
  function loadScene() {
    if (!active || !gpu || scenePromise) return;
    scenePromise = import('./scene').then(({ buildPrintshop }) => { if (disposed) return; scene = buildPrintshop(artwork()); if (active) bridge.invalidate(); }).catch(() => { root.dataset.shopScene = 'unavailable'; });
  }
  function keyboardGeometry() {
    const viewport = window.visualViewport;
    const editing = form.contains(document.activeElement) && document.activeElement instanceof HTMLInputElement;
    const open = editing && !!viewport && (window.innerHeight - viewport.height > 130 || viewport.height < 540);
    root.dataset.shopKeyboard = open ? 'open' : '';
  }
  form.addEventListener('submit', event => event.preventDefault(), { signal: scope.signal });
  form.addEventListener('compositionstart', () => { composing = true; updateUI(); }, { signal: scope.signal });
  form.addEventListener('compositionend', () => { composing = false; dispatch({ type: 'EDIT', values: { headline: field('headline').value.slice(0, 60), smallLine: field('smallLine').value.slice(0, 60) } }); queueDraw(); }, { signal: scope.signal });
  form.addEventListener('input', event => { if (!active || disposed) return; const input = event.target as HTMLInputElement; if (!input.dataset.shopField) return; dispatch({ type: 'EDIT', values: { [input.dataset.shopField]: input.value.slice(0, 60) } }); if (!composing) queueDraw(); }, { signal: scope.signal });
  form.addEventListener('focusin', keyboardGeometry, { signal: scope.signal }); form.addEventListener('focusout', () => queueMicrotask(keyboardGeometry), { signal: scope.signal });
  window.visualViewport?.addEventListener('resize', keyboardGeometry, { signal: scope.signal });
  root.addEventListener('click', event => {
    if (!active || disposed) return;
    const button = (event.target as Element).closest<HTMLButtonElement>('button'); if (!button || button.disabled) return;
    if (button.hasAttribute('data-shop-pull')) { void pull(); return; }
    if (button.dataset.shopLook && looks.some(look => look.id === button.dataset.shopLook)) { pinnedFallback = false; dispatch({ type: 'EDIT', values: { look: button.dataset.shopLook as Look } }); void prepareLook(); return; }
    if (button.dataset.shopArrangement === 'poster' || button.dataset.shopArrangement === 'center') { dispatch({ type: 'EDIT', values: { arrangement: button.dataset.shopArrangement } }); queueDraw(); return; }
    if (button.dataset.shopInspect !== undefined) { inspect(Number(button.dataset.shopInspect) as 0 | 1); return; }
    if (button.hasAttribute('data-shop-proof-close')) { closeInspector(); return; }
    if (button.hasAttribute('data-shop-compare')) { inspect(state.selectedPrint ?? 0, true); return; }
    if (button.hasAttribute('data-shop-edit-next')) { dispatch({ type: 'EDIT_NEXT' }); field('headline').focus(); return; }
    if (button.dataset.shopReplaceSlot !== undefined) { dispatch({ type: 'REPLACE_SLOT', slot: Number(button.dataset.shopReplaceSlot) as 0 | 1 }); say(`The next pull will replace Print ${Number(button.dataset.shopReplaceSlot) + 1}. The other print will stay.`); return; }
    if (button.hasAttribute('data-shop-replace-cancel')) { dispatch({ type: 'REPLACE_SLOT', slot: null }); return; }
    if (button.hasAttribute('data-shop-reset')) {
      workspaceEpoch++; restoring = false; returnFocus = undefined; discardPending(); closeInspector(false);
      for (const slot of [0, 1] as const) { const print = prints[slot]; if (print) { URL.revokeObjectURL(print.url); releaseSurface(print.surface); } prints[slot] = null; }
      state = initialPrintshop(); pinnedFallback = false; restorationFailed = false; field('headline').value = state.draft.headline; field('smallLine').value = state.draft.smallLine;
      releaseBackground(background); background = null; preparedLook = null;
      try { writeWorkspace({ world: undefined, incoming: undefined, returnFocus: undefined }); savedSnapshot = undefined; saved = true; } catch { saved = false; }
      root.querySelector<HTMLDetailsElement>('[data-shop-reset-confirm]')!.open = false;
      updateUI(); void prepareLook(); field('headline').focus(); say('The rack and World draft are cleared in this tab. Studio keeps its own draft.'); return;
    }
    if (button.hasAttribute('data-shop-done')) { (document.activeElement as HTMLElement)?.blur(); root.dataset.shopKeyboard = ''; root.querySelector<HTMLElement>('.world-shop-pull')!.focus({ preventScroll: true }); }
  }, { signal: scope.signal });
  root.addEventListener('click', event => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('[data-shop-continue]'); if (!link) return;
    if (link.getAttribute('aria-disabled') === 'true' || restoring || encoding) { event.preventDefault(); say('Wait for your draft and PNG to finish preparing.'); return; }
    const origin = link.dataset.shopContinue as 'draft' | '0' | '1';
    const print = origin === 'draft' ? null : prints[Number(origin) as 0 | 1];
    const recipe = print?.recipe ?? (background ? recipeFromDoc(printDocument(state.draft, background), backgroundRecipe(state.draft.look, state.fallback ? 'fallback' : 'raw-still')) : null);
    if (!recipe) { event.preventDefault(); return; }
    if (!persist()) { event.preventDefault(); say('The editable copy could not be saved for return. Download your prints before leaving, or keep editing here.'); return; }
    try { writeWorkspace({ incoming: { id: crypto.randomUUID(), recipe, label: print ? `Print ${Number(origin) + 1}` : 'your World draft', focus: origin }, returnFocus: origin }); }
    catch { event.preventDefault(); say('The editable copy could not be saved locally. Download the PNG, or keep editing here.'); saved = false; root.dataset.shopSaved = 'false'; storageStatus.textContent = storageMessage(false); }
  }, { signal: scope.signal });
  root.addEventListener('click', event => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!link || link.hasAttribute('download') || event.defaultPrevented || !pngWrite || (event as MouseEvent).metaKey || (event as MouseEvent).ctrlKey || link.target === '_blank') return;
    if (new URL(link.href).pathname === location.pathname) return;
    event.preventDefault(); say('Finishing the local PNG save before opening the next page…');
    void pngWrite.catch(() => {}).then(() => { if (!disposed) location.assign(link.href); });
  }, { signal: scope.signal });
  const refreshPNGs = setInterval(() => { if (!document.hidden && !disposed) for (const print of prints) if (print?.blobKey) void restorePNG(print.blobKey).catch(() => { saved = false; storageStatus.textContent = storageMessage(false); }); }, 60000);
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeInspector(); }, { signal: scope.signal });
  void restore();
  return {
    enter(hash: string, fresh: boolean) {
      if (reloadIfStale()) return;
      if (!active) { active = true; focusOnReady = fresh; card.hidden = overlay.hidden = false; settle(); enableFonts(); loadScene(); updateUI(); focusEntry(); if (!fresh) card.querySelector<HTMLElement>('h2')!.focus({ preventScroll: true }); }
      const match = /^#printshop\/print-([12])$/.exec(hash);
      if (match) { const slot = (Number(match[1]) - 1) as 0 | 1; if (prints[slot]) { if (!dialog.open || state.selectedPrint !== slot) inspect(slot, false, false); } else { root.querySelector<HTMLElement>('[data-shop-missing]')!.hidden = false; say('No print from that earlier page session is available. Make one here.'); } }
      else { root.querySelector<HTMLElement>('[data-shop-missing]')!.hidden = true; if (dialog.open) closeInspector(false); }
      restoreOriginFocus();
    },
    leave() { active = false; focusOnReady = false; discardPending(); closeInspector(false); card.hidden = overlay.hidden = true; root.dataset.shopKeyboard = ''; },
    attachGPU(available) { gpu = available; if (available && active) { loadScene(); scene?.refresh(); bridge.invalidate(); } },
    render(renderer, now) { if (!active || !scene) return false; const viewport = root.querySelector<HTMLElement>('[data-world-viewport]')!; const moving = scene.render(renderer, now, viewport.clientWidth, viewport.clientHeight); scene.positionLabels(overlay, viewport); delete root.querySelector<HTMLElement>('[data-world-stage]')!.dataset.experienceLoading; root.dataset.shopDrawCalls = String(renderer.info.render.calls); root.dataset.shopTriangles = String(renderer.info.render.triangles); root.dataset.shopTextures = String(renderer.info.memory.textures); return moving; },
    suspend(reason: Suspension) { if (reason === 'offscreen') sceneVisible = false; else if (reason === 'hidden' || reason === 'persisted') discardPending(); else if (reason === 'context-lost') gpu = false; settle(); },
    resume() { sceneVisible = true; if (active && !disposed && !reloadIfStale()) { if (fonts) void prepareLook(); else enableFonts(); scene?.refresh(); bridge.invalidate(); } },
    escape() { if (!dialog.open) return false; closeInspector(); return true; },
    dispose() { disposed = true; active = false; clearInterval(refreshPNGs); discardPending(); scope.abort(); if (dialog.open) dialog.close(); scene?.dispose(); releaseBackground(background); background = null; for (const slot of [0, 1] as const) { const print = prints[slot]; if (print) { URL.revokeObjectURL(print.url); releaseSurface(print.surface); } prints[slot] = null; } dialog.querySelectorAll('img').forEach(image => image.removeAttribute('src')); draft.width = draft.height = 0; },
  };
}
