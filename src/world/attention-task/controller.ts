import type * as THREE from 'three';
import { answer, chapters, execution, presentation } from './data';
import { initialView, reduceTask, stages, taskHash, type TaskAction } from './model';
import type { AttentionScene } from './scene';
import type { ExperienceBridge, Suspension } from '../experience-host';

export function mountAttentionTask(root: HTMLElement, bridge: ExperienceBridge) {
  const stage = root.querySelector<HTMLElement>('[data-world-stage]')!;
  const viewport = root.querySelector<HTMLElement>('[data-world-viewport]')!;
  const card = root.querySelector<HTMLElement>('[data-task-card]')!;
  const overlay = root.querySelector<HTMLElement>('[data-task-overlay]')!;
  const primary = root.querySelector<HTMLButtonElement>('[data-task-primary]')!;
  const slip = root.querySelector<HTMLButtonElement>('[data-task-slip]')!;
  const target = root.querySelector<HTMLElement>('[data-task-target]')!;
  const proof = root.querySelector<HTMLDialogElement>('[data-task-proof]')!;
  const video = root.querySelector<HTMLVideoElement>('[data-task-video]')!;
  const image = root.querySelector<HTMLImageElement>('[data-task-result-image]')!;
  const announcement = root.querySelector<HTMLElement>('[data-world-announcement]')!;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const listeners: (() => void)[] = [];
  let view = initialView(), active = false, disposed = false;
  let gpuReady = false;
  let scene: AttentionScene | undefined, scenePromise: Promise<void> | undefined;
  let proofFocus: HTMLElement | null = null;
  let drag: { id: number; x: number; y: number; start: { x: number; y: number }; end: { x: number; y: number } } | undefined;
  let compared = false;
  let seek = 0;
  let snapNextFrame = true;
  let proofMode: 'film' | 'result' = 'film';
  let currentChapter = -1;
  function listen(element: EventTarget, name: string, callback: EventListener) { element.addEventListener(name, callback); listeners.push(() => element.removeEventListener(name, callback)); }
  function loadScene() {
    if (!gpuReady || scenePromise) return;
    scenePromise = import('./scene').then(({ buildAttentionTask }) => {
      if (disposed) return;
      scene = buildAttentionTask(() => bridge.invalidate()); bridge.invalidate();
    }).catch(() => { root.dataset.taskScene = 'unavailable'; });
  }
  function updateHTML(announce = false) {
    const copy = presentation[view.stage];
    root.dataset.taskStage = view.stage;
    root.querySelector<HTMLElement>('[data-task-step]')!.textContent = `${String(stages.indexOf(view.stage) + 1).padStart(2, '0')} / 04`;
    root.querySelector<HTMLElement>('[data-task-title]')!.textContent = copy.title;
    root.querySelector<HTMLElement>('[data-task-description]')!.textContent = copy.description;
    primary.textContent = copy.action;
    root.querySelector<HTMLElement>('[data-task-ticket]')!.textContent = copy.ticket;
    root.querySelector<HTMLButtonElement>('[data-task-prev]')!.disabled = view.stage === 'waiting';
    root.querySelector<HTMLElement>('[data-task-result-actions]')!.hidden = view.stage !== 'built';
    root.querySelector<HTMLElement>('[data-task-compare]')!.hidden = view.stage !== 'built' && !compared;
    root.querySelector<HTMLElement>('[data-task-sheet-label]')!.textContent = view.stage === 'built' ? `ACTUAL GENERATED PAGE · ${execution.actual_file.sessions} SESSIONS` : 'THE PAGE · STILL FOLDED';
    slip.hidden = !active || view.stage !== 'chosen' || view.evidenceOpen;
    root.querySelector<HTMLElement>('[data-task-docked]')!.hidden = view.stage !== 'returned' && view.stage !== 'built';
    target.hidden = !active || view.stage !== 'chosen' || view.evidenceOpen;
    if (announce) announcement.textContent = `${copy.title} ${copy.description} Recorded outcome: ${answer}.`;
    bridge.invalidate();
  }
  function dispatch(action: TaskAction, historyEntry = true) {
    const before = view.stage;
    view = reduceTask(view, action);
    if (stages.indexOf(view.stage) < stages.indexOf(before)) resetPresentation();
    if (before !== view.stage && historyEntry) bridge.pushHash(`#task/attention/${view.stage}`);
    updateHTML(before !== view.stage);
  }
  function cancelDrag() {
    if (drag && slip.hasPointerCapture(drag.id)) slip.releasePointerCapture(drag.id);
    drag = undefined;
    if (view.dragging) dispatch({ type: 'CANCEL_DRAG' }, false);
  }
  function resetPresentation() {
    snapNextFrame = true;
    stage.dataset.taskPresentation = 'pending';
    scene?.update(view, performance.now(), true);
  }
  function enter(hash: string, fresh: boolean) {
    const value = taskHash(hash) ?? 'waiting';
    if (active) {
      if (view.stage !== value) { closeProof(false); cancelDrag(); dispatch({ type: 'STAGE', stage: value }, false); }
      return;
    }
    if (fresh) { view = initialView(); compared = false; }
    else view = reduceTask(view, { type: 'STAGE', stage: value });
    active = true;
    stage.dataset.task = 'attention'; root.dataset.task = 'attention';
    resetPresentation(); card.hidden = overlay.hidden = false;
    updateHTML(true); loadScene(); primary.focus({ preventScroll: true });
  }
  function closeProof(restoreFocus = true) {
    video.pause();
    if (proof.open) proof.close();
    dispatch({ type: 'EVIDENCE', open: false }, false);
    if (restoreFocus) proofFocus?.focus({ preventScroll: true });
  }
  function leave() {
    closeProof(false); cancelDrag(); active = false;
    card.hidden = overlay.hidden = true;
    delete stage.dataset.task; delete root.dataset.task;
  }
  function resultImage() {
    const phone = view.resultViewport === 'phone';
    image.src = `/media/attention/workshop-${phone ? 'phone' : 'desktop'}.png`;
    image.width = phone ? 390 : 1280; image.height = phone ? 1437 : 800;
    image.dataset.viewport = view.resultViewport;
    root.querySelectorAll<HTMLElement>('[data-task-result-viewport]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.taskResultViewport === view.resultViewport)));
  }
  function showProof(mode: 'film' | 'result') {
    proofMode = mode;
    cancelDrag(); proofFocus = document.activeElement as HTMLElement;
    dispatch({ type: 'EVIDENCE', open: true }, false);
    root.querySelector<HTMLElement>('[data-task-film]')!.hidden = mode !== 'film';
    root.querySelector<HTMLElement>('[data-task-result]')!.hidden = mode !== 'result';
    root.querySelector<HTMLElement>('[data-task-proof-title]')!.textContent = mode === 'film' ? `Actual recording · ${presentation[view.stage].chapter.label}` : 'The actual built page';
    if (mode === 'film') {
      seek = presentation[view.stage].chapter.time;
      currentChapter = -1; syncProofContext(seek);
      video.preload = 'metadata';
      if (!video.src) { video.src = '/media/attention/execution.mp4'; video.load(); }
      const track = video.querySelector<HTMLTrackElement>('track')!; track.src ||= track.dataset.src!;
      video.pause();
      if (video.readyState >= 1) video.currentTime = seek;
    } else resultImage();
    if (!proof.open) proof.showModal();
    root.querySelector<HTMLButtonElement>('[data-task-proof-close]')!.focus({ preventScroll: true });
  }
  function syncProofContext(time: number) {
    if (proofMode !== 'film' || !view.evidenceOpen) return;
    let index = 0;
    chapters.forEach((chapter, candidate) => { if (time >= chapter.time) index = candidate; });
    if (index === currentChapter) return;
    currentChapter = index;
    const chapter = chapters[index]!;
    root.querySelector<HTMLElement>('[data-task-proof-title]')!.textContent = `Actual recording · ${chapter.label}`;
    root.querySelector<HTMLElement>('[data-task-proof-context]')!.textContent = index >= chapters.length - 1 ? `Separate updated-app observation. ${chapter.description} This is not another answer return.` : chapter.description;
    root.querySelectorAll<HTMLElement>('[data-task-chapter]').forEach(button => {
      if (Number(button.dataset.taskChapter) === chapter.time) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  }
  function positionLabels(width: number, height: number) {
    const viewportBounds = viewport.getBoundingClientRect();
    const ticket = root.querySelector<HTMLElement>('[data-task-anchor="ticket"]')!;
    const docked = root.querySelector<HTMLElement>('[data-task-docked]')!;
    const sheet = root.querySelector<HTMLElement>('[data-task-sheet-label]')!;
    const shift = (element: HTMLElement, x: number, y: number) => { element.style.left = `${parseFloat(element.style.left) + x}px`; element.style.top = `${parseFloat(element.style.top) + y}px`; };
    const clamp = (element: HTMLElement) => {
      const bounds = element.getBoundingClientRect();
      const x = Math.max(0, viewportBounds.left + 8 - bounds.left) - Math.max(0, bounds.right - viewportBounds.left - width + 8);
      const y = Math.max(0, viewportBounds.top + 32 - bounds.top) - Math.max(0, bounds.bottom - viewportBounds.top - height + 8);
      shift(element, x, y);
    };
    clamp(ticket);
    const ticketBounds = ticket.getBoundingClientRect();
    for (const element of [target, docked]) {
      if (element.hidden) continue;
      if (height < 400) {
        element.style.transform = 'none';
        element.style.left = `${ticketBounds.left - viewportBounds.left + 30}px`;
        element.style.top = `${Math.min(height - element.offsetHeight - 12, ticketBounds.bottom - viewportBounds.top + 12)}px`;
      } else {
        const bounds = element.getBoundingClientRect();
        if (bounds.left < ticketBounds.right + 8 && bounds.right > ticketBounds.left && bounds.bottom > ticketBounds.top && bounds.top < ticketBounds.bottom) shift(element, ticketBounds.right + 8 - bounds.left, 0);
      }
    }
    if (height < 400) {
      sheet.style.transform = 'none';
      sheet.style.left = `${Math.max(8, width * .7 - sheet.offsetWidth / 2)}px`;
      sheet.style.top = `${height - sheet.offsetHeight - 12}px`;
    }
    overlay.querySelectorAll<HTMLElement>('[data-task-anchor]').forEach(element => { if (!element.hidden) clamp(element); });
  }
  listen(primary, 'click', () => {
    cancelDrag();
    if (view.stage === 'built') showProof('result');
    else dispatch({ type: view.stage === 'waiting' ? 'REVEAL_CHOICE' : view.stage === 'chosen' ? 'RETURN_ANSWER' : 'UNFOLD_RESULT' });
  });
  listen(root.querySelector('[data-task-prev]')!, 'click', () => { cancelDrag(); dispatch({ type: 'PREVIOUS' }); });
  listen(root.querySelector('[data-task-replay]')!, 'click', () => { cancelDrag(); compared = false; dispatch({ type: 'REPLAY' }); primary.focus({ preventScroll: true }); });
  listen(root.querySelector('[data-task-watch]')!, 'click', () => showProof('film'));
  listen(root.querySelector('[data-task-proof-close]')!, 'click', () => closeProof());
  listen(proof, 'cancel', event => { event.preventDefault(); closeProof(); });
  listen(video, 'loadedmetadata', () => { video.currentTime = seek; video.pause(); });
  for (const event of ['timeupdate', 'seeked']) listen(video, event, () => syncProofContext(video.currentTime));
  root.querySelectorAll<HTMLElement>('[data-task-chapter]').forEach(button => listen(button, 'click', () => { seek = Number(button.dataset.taskChapter); video.pause(); if (video.readyState >= 1) video.currentTime = seek; syncProofContext(seek); }));
  root.querySelectorAll<HTMLElement>('[data-task-result-viewport]').forEach(button => listen(button, 'click', () => { dispatch({ type: 'VIEWPORT', viewport: button.dataset.taskResultViewport as 'desktop' | 'phone' }, false); resultImage(); }));
  listen(root.querySelector('[data-task-before]')!, 'click', () => { compared = true; dispatch({ type: 'STAGE', stage: 'waiting' }); });
  listen(root.querySelector('[data-task-after]')!, 'click', () => { compared = true; dispatch({ type: 'STAGE', stage: 'built' }); });
  listen(slip, 'pointerdown', event => {
    const pointer = event as PointerEvent;
    if (view.stage !== 'chosen' || !pointer.isPrimary || pointer.button !== 0 || drag || !scene) return;
    event.preventDefault();
    const rect = viewport.getBoundingClientRect();
    drag = { id: pointer.pointerId, x: pointer.clientX, y: pointer.clientY, start: scene.project('slip', rect.width, rect.height), end: scene.project('target', rect.width, rect.height) };
    slip.setPointerCapture(pointer.pointerId); dispatch({ type: 'BEGIN_DRAG' }, false);
  });
  listen(slip, 'pointermove', event => {
    const pointer = event as PointerEvent;
    if (!drag || pointer.pointerId !== drag.id) return;
    const dx = drag.end.x - drag.start.x, dy = drag.end.y - drag.start.y;
    const progress = ((pointer.clientX - drag.x) * dx + (pointer.clientY - drag.y) * dy) / (dx * dx + dy * dy);
    dispatch({ type: 'DRAG', progress }, false);
  });
  listen(slip, 'pointerup', event => {
    const pointer = event as PointerEvent;
    if (!drag || pointer.pointerId !== drag.id) return;
    const bounds = target.getBoundingClientRect();
    const valid = pointer.clientX >= bounds.left - 12 && pointer.clientX <= bounds.right + 12 && pointer.clientY >= bounds.top - 12 && pointer.clientY <= bounds.bottom + 12;
    cancelDrag(); if (valid) dispatch({ type: 'RETURN_ANSWER' });
  });
  listen(slip, 'pointercancel', cancelDrag);
  listen(slip, 'lostpointercapture', cancelDrag);
  listen(slip, 'click', event => { if ((event as MouseEvent).detail === 0) { cancelDrag(); dispatch({ type: 'RETURN_ANSWER' }); } });
  listen(window, 'pointerdown', event => { if (drag && (event as PointerEvent).pointerId !== drag.id) cancelDrag(); });
  listen(window, 'resize', cancelDrag);
  listen(window, 'pagehide', () => { cancelDrag(); video.pause(); });
  listen(document, 'visibilitychange', () => { if (document.hidden) { cancelDrag(); video.pause(); } });
  listen(root.querySelector('[data-world-canvas]')!, 'webglcontextlost', cancelDrag);
  return {
    get active() { return active; },
    enter, leave,
    attachGPU(available: boolean) { gpuReady = available; if (active && available) { loadScene(); bridge.invalidate(); } },
    suspend(_reason: Suspension) { cancelDrag(); video.pause(); },
    resume() { if (active) bridge.invalidate(); },
    escape() { if (!view.evidenceOpen) return false; closeProof(); return true; },
    render(renderer: THREE.WebGLRenderer, now: number) {
      if (!active || !scene) return false;
      const width = viewport.clientWidth, height = viewport.clientHeight;
      scene.resize(width, height);
      const moving = scene.update(view, now, snapNextFrame || reducedMotion || view.evidenceOpen);
      renderer.render(scene.scene, scene.camera);
      snapNextFrame = false;
      delete stage.dataset.taskPresentation;
      root.dataset.taskResultVisible = String(scene.resultVisible);
      root.dataset.taskDrawCalls = String(renderer.info.render.calls);
      root.dataset.taskTriangles = String(renderer.info.render.triangles);
      root.dataset.taskGeometries = String(renderer.info.memory.geometries);
      root.dataset.taskTextures = String(renderer.info.memory.textures);
      overlay.querySelectorAll<HTMLElement>('[data-task-anchor]').forEach(element => {
        element.style.transform = '';
        const point = scene!.project(element.dataset.taskAnchor as Parameters<AttentionScene['project']>[0], width, height);
        element.style.left = `${point.x}px`; element.style.top = `${point.y}px`;
      });
      positionLabels(width, height);
      delete stage.dataset.experienceLoading;
      return moving && !view.evidenceOpen;
    },
    dispose() { disposed = true; cancelDrag(); video.pause(); if (proof.open) proof.close(); listeners.forEach(remove => remove()); scene?.dispose(); },
  };
}
export type AttentionTask = ReturnType<typeof mountAttentionTask>;
