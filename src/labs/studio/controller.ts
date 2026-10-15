import { createIcon } from '../../ui/icons';
import { createDoc, backgrounds, rolePresets } from './model';
import { render } from './render';
import { frameIndexAt } from './frames';
import { fallbackBackground, releaseBackground as release } from './shaderBackground';
import { createExportCanvas, canvasToBlob } from './canvas';
import { fontsReady } from './fonts';
import { backgroundRecipe, recipeFromDoc, docFromRecipe, decodeRecipeBackground, type BackgroundRecipe } from '../../creative/recipe';
import { readWorkspace, writeWorkspace, type StudioWork, type IncomingCopy } from '../../creative/workspace';

export function initializeStudio(root: HTMLElement): void {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-canvas]')!;
  const ctx = canvas.getContext('2d', { alpha: false });
  const mini = root.querySelector<HTMLElement>('[data-mini]')!;
  const miniCanvas = root.querySelector<HTMLCanvasElement>('[data-mini-canvas]')!;
  const miniCtx = miniCanvas.getContext('2d', { alpha: false });
  const status = root.querySelector<HTMLElement>('[data-status]')!;
  const storage = root.querySelector<HTMLElement>('[data-studio-storage]')!;
  const capability = root.querySelector<HTMLElement>('[data-capability]')!;
  const form = root.querySelector<HTMLFormElement>('[data-controls]')!;
  const play = root.querySelector<HTMLButtonElement>('[data-action="play"]')!;
  const timeInput = root.querySelector<HTMLInputElement>('[data-control="time"]')!;
  const progress = root.querySelector<HTMLProgressElement>('[data-progress]')!;
  const cancel = root.querySelector<HTMLButtonElement>('[data-action="cancel"]')!;
  const mp4 = root.querySelector<HTMLButtonElement>('[data-action="mp4"]')!;
  const choice = root.querySelector<HTMLElement>('[data-import-choice]')!;
  if (!ctx) { status.textContent = 'This browser could not open a drawing canvas.'; root.querySelectorAll<HTMLButtonElement>('button').forEach(b => b.disabled = true); return; }
  const scope = new AbortController();
  let doc = createDoc(), time = 0, lastStamp = 0, raf = 0, lastFrame = -1, playing = !matchMedia('(prefers-reduced-motion: reduce)').matches, visible = true, stageVisible = true, formVisible = false, disposed = false, ready = false;
  let spec = backgroundRecipe(doc.backgroundId, 'loop-frame'), requested = spec;
  let bake: AbortController | null = null, clip: AbortController | null = null, baking = false;
  let source: string | undefined, previous: StudioWork['previous'], incoming: IncomingCopy | undefined;
  let savedSnapshot: string | undefined;
  let downloads = new Set<string>(), downloadTimers = new Set<ReturnType<typeof setTimeout>>();
  const brands = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } }).userAgentData?.brands;
  const videoCapable = typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined' && !!brands?.some(b => b.brand === 'Chromium');
  const input = (name: string) => form.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-control="${name}"]`)!;
  const button = (name: string) => root.querySelector<HTMLButtonElement>(`[data-action="${name}"]`)!;
  function say(message: string) { if (!disposed) status.textContent = message; }
  function current(): Omit<StudioWork, 'previous'> { return { recipe: recipeFromDoc(doc, baking ? requested : spec), display: { time, playing }, ...(source ? { source } : {}) }; }
  function save() {
    if (disposed) return;
    try {
      if (JSON.stringify(readWorkspace().studio) !== savedSnapshot) return;
      const work = { ...current(), ...(previous ? { previous } : {}) }; writeWorkspace({ studio: work }); savedSnapshot = JSON.stringify(work);
      storage.textContent = 'Studio draft saved in this tab. Download versions you want to keep.'; root.dataset.studioSaved = 'true';
    }
    catch { storage.textContent = 'Not saved for return: local storage is unavailable or full. Download this version before leaving.'; root.dataset.studioSaved = 'false'; }
  }
  function selected(selector: string, attr: string, value: string) { root.querySelectorAll<HTMLElement>(selector).forEach(b => b.setAttribute('aria-pressed', String(b.getAttribute(attr) === value))); }
  function syncForm() {
    const values = { role: doc.templateId, prefix: doc.customTemplate.prefix, headline: doc.customTemplate.headline, event: doc.eventName.text, name: doc.name.text, detail: doc.title.text, ink: doc.textColor, font: doc.font, scale: String(Math.round(doc.headlineScale * 100)) };
    for (const [key, value] of Object.entries(values)) input(key).value = value;
    for (const [key, field] of Object.entries({ event: doc.eventName, name: doc.name, detail: doc.title })) form.querySelector<HTMLInputElement>(`[data-visible="${key}"]`)!.checked = field.visible;
    root.querySelector('[data-scale]')!.textContent = `${Math.round(doc.headlineScale * 100)}%`;
    selected('[data-composition]', 'data-composition', doc.composition); selected('[data-background]', 'data-background', doc.backgroundId);
    root.querySelector('[data-copy-title]')!.textContent = source ? `A copy of ${source}` : 'Your Studio draft';
    root.querySelector('[data-copy-description]')!.textContent = source ? 'An editable copy. Your World draft and any kept prints stay as you left them.' : 'Set some words, find a frame, and make it yours.';
    button('previous-draft').hidden = !previous;
    setPlay(playing);
  }
  function draw() {
    if (disposed) return;
    render(ctx!, doc, time); miniCtx?.drawImage(canvas, 0, 0, 216, 216); lastFrame = frameIndexAt(doc.background, time);
    root.dataset.frame = String(lastFrame); root.dataset.time = String(time); timeInput.value = String(Math.floor(time)); root.querySelector('output[data-time]')!.textContent = `${(time / 1000).toFixed(2)} s`;
  }
  function tick(stamp: number) {
    raf = 0; if (disposed) return;
    if (playing && ready && doc.background?.animated && visible && !document.hidden && !clip) { if (lastStamp) time = (time + Math.min(stamp - lastStamp, 100)) % 4000; if (frameIndexAt(doc.background, time) !== lastFrame) draw(); }
    lastStamp = stamp; if (visible && !document.hidden && playing && doc.background?.animated) raf = requestAnimationFrame(tick);
  }
  function wake() { lastStamp = 0; if (!raf && !disposed && visible && !document.hidden && playing && doc.background?.animated) raf = requestAnimationFrame(tick); }
  function setPlay(value: boolean) { playing = value; play.replaceChildren(createIcon(value ? 'pause' : 'play')); play.setAttribute('aria-pressed', String(value)); play.setAttribute('aria-label', value ? 'Pause animation' : 'Play animation'); if (!value) { if (spec.mode === 'loop-frame' && doc.background?.animated) spec = { ...spec, time, frame: frameIndexAt(doc.background, time) }; cancelAnimationFrame(raf); raf = 0; } wake(); }
  function controls() {
    const busy = baking || !!clip || !ready;
    root.querySelectorAll<HTMLButtonElement>('[data-action="png"],[data-action="jpg"]').forEach(b => b.disabled = busy);
    mp4.disabled = busy || !videoCapable || !doc.background?.animated;
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>('input,select,button').forEach(e => e.disabled = !!clip || !ready);
    play.disabled = busy || !doc.background?.animated; timeInput.disabled = busy || !doc.background?.animated;
    button('animate').hidden = spec.mode === 'loop-frame'; button('animate').disabled = busy;
    for (const action of ['open-copy', 'keep-draft', 'previous-draft']) button(action).disabled = busy;
    root.setAttribute('aria-busy', String(baking || !!clip));
  }
  function modeCopy() {
    root.dataset.backgroundMode = spec.mode;
    root.querySelector('[data-background-mode]')!.textContent = spec.mode === 'raw-still' ? 'Original preset still · paused. Animate creates a new moving version with a closing dissolve.' : spec.mode === 'fallback' ? 'Simple background still · preserved. Animate tries the shader as a new direction.' : 'Animated ink · 4-second loop with a closing dissolve.';
    capability.textContent = doc.background?.animated ? (videoCapable ? 'MP4 is encoded on this device. A 4-second silent loop.' : 'PNG and JPG work here. A 4-second MP4 needs a compatible Chrome or Edge encoder.') : 'PNG and JPG still prints are ready. Animate this print to try a moving version.';
  }
  async function chooseBackground(nextSpec: BackgroundRecipe) {
    requested = { ...nextSpec }; bake?.abort(); if (baking) return;
    baking = true; controls();
    while (!disposed) {
      const wanted = requested, controller = new AbortController(); bake = controller;
      say(wanted.mode === 'loop-frame' ? 'Mixing the animated ink…' : 'Preparing your preserved still…');
      let next;
      try { next = await decodeRecipeBackground(wanted, controller.signal); }
      catch {
        if (controller.signal.aborted) { if (disposed) break; continue; }
        next = fallbackBackground(backgrounds.find(b => b.id === wanted.look)!); requested = { ...wanted, mode: 'fallback', time: 0, frame: 0 };
        say('The shader is unavailable here. This copy uses a simple background; the original PNG is unchanged.');
      }
      if (disposed || controller.signal.aborted || requested.look !== wanted.look || (requested !== wanted && requested.mode !== 'fallback')) { release(next); if (disposed) break; continue; }
      release(doc.background); doc.background = next; doc.backgroundId = wanted.look; spec = { ...requested }; time = spec.mode === 'loop-frame' ? time : 0; lastFrame = -1; ready = true;
      if (!next.animated) setPlay(false);
      root.dataset.background = wanted.look; root.dataset.ready = 'true'; modeCopy(); draw();
      if (next.animated) say(source ? 'The moving copy is ready. Its closing dissolve changes the original still.' : 'Your print is ready. Make it yours, then take it away.');
      else if (spec.mode === 'raw-still') say('Your editable still is ready. Your World work stays as you left it.');
      break;
    }
    bake = null; baking = false; controls(); save(); wake();
  }
  function showIncoming() {
    choice.hidden = !incoming;
    if (incoming) root.querySelector('[data-import-message]')!.textContent = `${incoming.label} is ready as an editable copy. Keep this Studio draft, or open the copy. Your current draft will be available through “Return to the previous Studio draft”.${previous ? ' Opening the copy replaces the older draft in that single return slot.' : ''}`;
  }
  function acceptCopy(copy: IncomingCopy, retain: boolean) {
    if (retain) previous = current();
    release(doc.background); doc = docFromRecipe(copy.recipe); spec = { ...copy.recipe.background }; time = spec.time; source = copy.label; playing = false; ready = false;
    try { writeWorkspace({ incoming: undefined, returnFocus: copy.focus }); } catch { storage.textContent = 'The copy is open, but could not be saved for return. Download before leaving.'; }
    incoming = undefined; showIncoming(); syncForm(); void chooseBackground(spec);
  }
  function loadSaved(work: StudioWork) { doc = docFromRecipe(work.recipe); spec = { ...work.recipe.background }; time = work.display.time; playing = work.display.playing && spec.mode === 'loop-frame'; source = work.source; previous = work.previous; }
  try {
    const workspace = readWorkspace(); incoming = workspace.incoming; savedSnapshot = JSON.stringify(workspace.studio);
    if (workspace.studio) loadSaved(workspace.studio);
    else if (incoming) { doc = docFromRecipe(incoming.recipe); spec = { ...incoming.recipe.background }; time = spec.time; source = incoming.label; playing = false; writeWorkspace({ incoming: undefined, returnFocus: incoming.focus }); incoming = undefined; }
    storage.textContent = workspace.studio ? 'Restoring your Studio draft…' : 'Saving uses this tab’s local workspace.';
  } catch { storage.textContent = 'Local storage is unavailable. Download your work before leaving.'; }
  syncForm(); showIncoming(); controls();
  function syncWords() { doc.customTemplate = { prefix: input('prefix').value, headline: input('headline').value }; doc.eventName.text = input('event').value; doc.name.text = input('name').value; doc.title.text = input('detail').value; }
  function download(blob: Blob, extension: string) { if (disposed) return; const url = URL.createObjectURL(blob); downloads.add(url); const a = document.createElement('a'); a.href = url; a.download = `studio-print.${extension}`; a.click(); const timer = setTimeout(() => { URL.revokeObjectURL(url); downloads.delete(url); downloadTimers.delete(timer); }, 1500); downloadTimers.add(timer); }
  async function imageExport(type: 'png' | 'jpg') {
    const exportTime = time; setPlay(false); draw(); save(); const { canvas: surface, ctx: context } = createExportCanvas(); render(context, doc, exportTime);
    try { download(await canvasToBlob(surface, type === 'png' ? 'image/png' : 'image/jpeg', .95), type); say(`${type.toUpperCase()} downloaded. 1080 × 1080 pixels, exactly this frame.`); }
    catch (error) { say(error instanceof Error ? error.message : 'The image could not be encoded. Try another format.'); } finally { surface.width = surface.height = 0; }
  }
  async function videoExport() {
    clip = new AbortController(); const signal = clip.signal; controls(); progress.hidden = false; cancel.hidden = false; progress.value = 0; say('Printing 120 frames locally…');
    try { const { exportMp4 } = await import('./exportMp4'); const blob = await exportMp4(doc, { signal, onProgress: (done, total) => { progress.value = done / total * 100; say(`Printing your loop · ${Math.round(done / total * 100)}%`); } }); if (!signal.aborted) { download(blob, 'mp4'); say('MP4 downloaded. 4 seconds · 1080 × 1080 · silent loop.'); } }
    catch (error) { say(signal.aborted ? 'Clip cancelled. Your print is still here.' : error instanceof Error ? error.message : 'This device could not encode the clip. PNG and JPG are ready.'); }
    finally { clip = null; progress.hidden = true; cancel.hidden = true; controls(); wake(); }
  }
  root.addEventListener('input', event => {
    const target = event.target as HTMLInputElement; if (clip || !ready) return;
    if (target.dataset.visible) { const fields = { event: doc.eventName, name: doc.name, detail: doc.title }; const field = fields[target.dataset.visible as keyof typeof fields]; if (field) field.visible = target.checked; draw(); save(); return; }
    if (!target.dataset.control) return;
    switch (target.dataset.control) {
      case 'time': time = Number(target.value); setPlay(false); spec = { ...spec, time, frame: Math.floor(time / 62.5) }; break;
      case 'ink': doc.textColor = target.value; break;
      case 'font': doc.font = target.value as typeof doc.font; break;
      case 'scale': doc.headlineScale = Number(target.value) / 100; root.querySelector('[data-scale]')!.textContent = `${target.value}%`; break;
      case 'role': { const preset = rolePresets.find(p => p.id === target.value)!; doc.templateId = preset.id; input('prefix').value = preset.prefix; input('headline').value = preset.headline; syncWords(); break; }
      default: doc.templateId = 'custom'; input('role').value = 'custom'; syncWords();
    }
    draw(); save();
  }, { signal: scope.signal });
  root.addEventListener('click', event => {
    const target = (event.target as Element).closest<HTMLButtonElement>('button'); if (!target || target.disabled) return;
    if (target.dataset.background && !clip) { selected('[data-background]', 'data-background', target.dataset.background); time = 0; void chooseBackground(backgroundRecipe(target.dataset.background, spec.mode)); return; }
    if (target.dataset.composition && !clip) { doc.composition = target.dataset.composition as typeof doc.composition; selected('[data-composition]', 'data-composition', doc.composition); draw(); save(); return; }
    switch (target.dataset.action) {
      case 'return': canvas.scrollIntoView({ behavior: 'smooth', block: 'center' }); break;
      case 'play': setPlay(!playing); save(); break;
      case 'png': void imageExport('png'); break;
      case 'jpg': void imageExport('jpg'); break;
      case 'mp4': void videoExport(); break;
      case 'cancel': clip?.abort(); break;
      case 'animate': time = 0; setPlay(true); void chooseBackground(backgroundRecipe(doc.backgroundId, 'loop-frame')); break;
      case 'open-copy': if (incoming) { acceptCopy(incoming, true); canvas.scrollIntoView({ block: 'center' }); root.querySelector<HTMLElement>('[data-copy-title]')!.setAttribute('tabindex', '-1'); root.querySelector<HTMLElement>('[data-copy-title]')!.focus({ preventScroll: true }); } break;
      case 'keep-draft': incoming = undefined; try { writeWorkspace({ incoming: undefined }); } catch {} showIncoming(); say('Kept your Studio draft. Your World work is still there.'); input('headline').focus(); break;
      case 'previous-draft': if (previous) { const next = previous, before = current(); release(doc.background); loadSaved(next); previous = before; ready = false; syncForm(); void chooseBackground(spec); say('Your other Studio draft is open. You can switch back with the same button.'); } break;
      case 'reset': { release(doc.background); doc = createDoc(); source = undefined; previous = undefined; time = 0; ready = false; spec = backgroundRecipe(doc.backgroundId, 'loop-frame'); playing = !matchMedia('(prefers-reduced-motion: reduce)').matches; syncForm(); void chooseBackground(spec); break; }
    }
  }, { signal: scope.signal });
  root.querySelector('[data-back-prints]')!.addEventListener('click', save, { signal: scope.signal });
  form.addEventListener('submit', e => e.preventDefault(), { signal: scope.signal });
  const observer = new IntersectionObserver(entries => { for (const entry of entries) { if (entry.target === canvas) stageVisible = entry.isIntersecting; if (entry.target === form) formVisible = entry.isIntersecting; } visible = stageVisible || formVisible; mini.hidden = stageVisible || !formVisible; if (!visible) { cancelAnimationFrame(raf); raf = 0; } else wake(); }, { rootMargin: '0px' }); observer.observe(canvas); observer.observe(form);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { save(); cancelAnimationFrame(raf); raf = 0; } else wake(); }, { signal: scope.signal });
  function dispose() { disposed = true; bake?.abort(); clip?.abort(); cancelAnimationFrame(raf); observer.disconnect(); scope.abort(); release(doc.background); doc.background = null; downloads.forEach(url => URL.revokeObjectURL(url)); downloadTimers.forEach(clearTimeout); canvas.width = canvas.height = 0; miniCanvas.width = miniCanvas.height = 0; }
  window.addEventListener('pagehide', event => { save(); if (!event.persisted) dispose(); else { cancelAnimationFrame(raf); raf = 0; } }, { signal: scope.signal });
  window.addEventListener('pageshow', event => { if (event.persisted) { try { const workspace = readWorkspace(); if (root.dataset.studioSaved === 'true' && workspace.studio && JSON.stringify(workspace.studio) !== JSON.stringify({ ...current(), ...(previous ? { previous } : {}) })) { location.reload(); return; } incoming = workspace.incoming; showIncoming(); } catch {} } wake(); }, { signal: scope.signal });
  void fontsReady().then(() => { if (!disposed) void chooseBackground(spec); }).catch(() => say('The local typefaces could not load. Reload to try again.'));
}
