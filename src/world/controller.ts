import { setIconLabel } from '../ui/icons';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { districts, journey, type DistrictId } from './data';
import { buildWorld } from './scene';

interface CameraMove {
  started: number;
  duration: number;
  fromPosition: THREE.Vector3;
  toPosition: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
}

export function mountWorld(root: HTMLElement): () => void {
  const viewport = root.querySelector<HTMLElement>('[data-world-viewport]')!;
  const canvas = root.querySelector<HTMLCanvasElement>('[data-world-canvas]')!;
  const stage = root.querySelector<HTMLElement>('[data-world-stage]')!;
  const message = root.querySelector<HTMLElement>('[data-world-status]')!;
  const inspector = root.querySelector<HTMLElement>('[data-world-inspector]')!;
  const announcement = root.querySelector<HTMLElement>('[data-world-announcement]')!;
  const tourbar = root.querySelector<HTMLElement>('[data-world-tour]')!;
  const tourTitle = root.querySelector<HTMLElement>('[data-tour-title]')!;
  const tourDescription = root.querySelector<HTMLElement>('[data-tour-description]')!;
  const tourStep = root.querySelector<HTMLElement>('[data-tour-step]')!;
  const nextButton = root.querySelector<HTMLButtonElement>('[data-tour-next]')!;
  const prevButton = root.querySelector<HTMLButtonElement>('[data-tour-prev]')!;
  const labelButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-world-label]')];
  const districtButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-select-district]')];
  const articles = [...root.querySelectorAll<HTMLElement>('[data-district-detail]')];
  const listeners: (() => void)[] = [];
  let selected: DistrictId | null = null;
  let exhibit = false;
  let overviewScroll = window.scrollY;
  let exhibitScroll = 0;
  const previousScrollRestoration = history.scrollRestoration;
  history.scrollRestoration = 'manual';
  let hovered: DistrictId | null = null;
  let move: CameraMove | null = null;
  let tourIndex = -1;
  let frame = 0;
  let disposed = false;
  let visible = true;
  let pointerStart: { x: number; y: number; time: number; id: number } | null = null;
  const activePointers = new Set<number>();
  let multiplePointers = false;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const projected = new THREE.Vector3();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 180);
  camera.position.set(24, 28, 35);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 1, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.085;
  controls.enablePan = false;
  controls.minDistance = 8;
  controls.maxDistance = 74;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.rotateSpeed = 0.52;
  controls.zoomSpeed = 0.8;
  const world = buildWorld(() => { if (!disposed) renderer.render(world.scene, camera); });

  function listen(target: EventTarget, type: string, callback: EventListener) {
    target.addEventListener(type, callback);
    listeners.push(() => target.removeEventListener(type, callback));
  }
  function size() {
    const rect = viewport.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    updateLabels();
  }
  function updateLabels() {
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    labelButtons.forEach((button) => {
      const id = button.dataset.worldLabel as DistrictId;
      projected.copy(world.anchors.get(id)!).project(camera);
      const rawX = (projected.x * 0.5 + 0.5) * width;
      const x = Math.max(button.offsetWidth / 2 + 12, Math.min(width - button.offsetWidth / 2 - 12, rawX));
      const y = (-projected.y * 0.5 + 0.5) * height;
      const available = projected.z < 1 && projected.z > -1 && projected.x > -1.15 && projected.x < 1.15 && y > 64 && y < height - 34;
      button.hidden = !available || (selected !== null && selected !== id);
      button.style.left = `${x}px`;
      button.style.top = `${y}px`;
    });
  }
  function cameraTo(id: DistrictId | null) {
    const narrow = viewport.clientWidth / viewport.clientHeight < 0.85;
    let target = new THREE.Vector3(0, -4, 0);
    let position = new THREE.Vector3(18, 22, 27);
    if (id) {
      const district = districts.find((item) => item.id === id)!;
      target = new THREE.Vector3(...district.position).add(new THREE.Vector3(0, 1.35, 0));
      position = target.clone().add(new THREE.Vector3(narrow ? 9 : 8.7, narrow ? 11 : 9.2, narrow ? 14.4 : 12.8));
    } else if (narrow) {
      position.set(14, 38, 32).multiplyScalar(1.44);
    } else if (camera.aspect < 1.4) {
      position.multiplyScalar(1.15);
    }
    move = {
      started: performance.now(), duration: reducedMotion ? 0 : id ? 1450 : 1750,
      fromPosition: camera.position.clone(), toPosition: position,
      fromTarget: controls.target.clone(), toTarget: target,
    };
    controls.autoRotate = false;
  }
  function pauseMedia() {
    root.querySelectorAll<HTMLVideoElement>('video').forEach((video) => video.pause());
  }
  function rememberView() {
    history.replaceState({ ...history.state, worldScroll: window.scrollY, worldInspectorScroll: inspector.scrollTop }, '');
  }
  function revealSelection() {
    if (!window.matchMedia('(max-width: 800px)').matches) return;
    const target = tourIndex >= 0 ? tourbar : window.matchMedia('(max-width: 600px)').matches ? root.querySelector<HTMLElement>('.world-district-nav')! : stage;
    const rect = target.getBoundingClientRect();
    window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - 20), behavior: 'instant' });
  }
  function setExhibit(open: boolean, pushHistory = true) {
    if (!selected) return;
    if (pushHistory) rememberView();
    pauseMedia();
    exhibit = open;
    stage.dataset.exhibit = open ? selected : '';
    root.querySelector<HTMLElement>('[data-exhibit-bar]')!.hidden = !open;
    root.querySelector<HTMLElement>('[data-exhibit-name]')!.textContent = districts.find(item => item.id === selected)!.name;
    if (pushHistory) history.pushState({ worldScroll: window.scrollY }, '', `#${selected}${open ? '/exhibit' : ''}`);
    if (open) {
      exhibitScroll = window.scrollY;
      inspector.scrollTop = 0;
      window.scrollTo({ top: Math.max(0, window.scrollY + stage.getBoundingClientRect().top - 20), behavior: 'instant' });
      root.querySelector<HTMLElement>('[data-close-exhibit]')!.focus({ preventScroll: true });
    } else {
      window.scrollTo({ top: exhibitScroll, behavior: 'instant' });
      root.querySelector<HTMLElement>(`[data-open-exhibit="${selected}"]`)?.focus({ preventScroll: true });
    }
    size();
    cameraTo(selected);
    if (pushHistory) rememberView();
  }
  function selectDistrict(id: DistrictId | null, options: { history?: boolean; tour?: boolean; focus?: boolean; reveal?: boolean } = {}) {
    if (options.history !== false) rememberView();
    if (!selected && id) overviewScroll = window.scrollY;
    selected = id;
    exhibit = false;
    stage.dataset.exhibit = '';
    root.querySelector<HTMLElement>('[data-exhibit-bar]')!.hidden = true;
    hovered = null;
    pauseMedia();
    if (!options.tour) stopTour();
    stage.dataset.selected = id ?? '';
    root.dataset.selected = id ?? '';
    inspector.hidden = !id;
    inspector.scrollTop = 0;
    articles.forEach((article) => { article.hidden = article.dataset.districtDetail !== id; });
    districtButtons.forEach((button) => {
      const current = button.dataset.selectDistrict === id;
      button.setAttribute('aria-pressed', String(current));
    });
    labelButtons.forEach((button) => { button.setAttribute('aria-pressed', String(button.dataset.worldLabel === id)); });
    if (options.history !== false) {
      const hash = id ? `#${id}` : window.location.pathname + window.location.search;
      if (window.location.hash !== (id ? `#${id}` : '')) history.pushState({ district: id, worldScroll: id ? window.scrollY : overviewScroll }, '', hash);
    }
    const district = districts.find((item) => item.id === id);
    announcement.textContent = district ? `${district.name}. ${district.description}` : 'Overview of all six districts.';
    size();
    cameraTo(id);
    if (options.reveal !== false) {
      if (id) revealSelection();
      else window.scrollTo({ top: overviewScroll, behavior: 'instant' });
    }
    const activeButton = districtButtons.find(button => button.dataset.selectDistrict === id);
    if (activeButton && window.matchMedia('(max-width: 600px)').matches) {
      const nav = activeButton.parentElement!;
      nav.scrollTo({ left: activeButton.offsetLeft - nav.offsetLeft - 12, behavior: 'smooth' });
    }
    if (options.focus && id) {
      const heading = inspector.querySelector<HTMLElement>(`[data-district-detail="${id}"] h2`);
      heading?.focus({ preventScroll: true });
    }
    if (options.history !== false) rememberView();
  }
  function stopTour() {
    tourIndex = -1;
    tourbar.hidden = true;
    root.querySelector<HTMLButtonElement>('[data-start-tour]')!.textContent = 'Take the guided route';
  }
  function tourTo(index: number) {
    if (index >= journey.length) {
      stopTour();
      selectDistrict(null);
      announcement.textContent = 'The guided route is complete. Explore any district, or follow a case study.';
      return;
    }
    tourIndex = Math.max(0, index);
    const step = journey[tourIndex]!;
    tourbar.hidden = false;
    tourStep.textContent = `${String(tourIndex + 1).padStart(2, '0')} / ${String(journey.length).padStart(2, '0')}`;
    tourTitle.textContent = step.title;
    tourDescription.textContent = step.description;
    prevButton.disabled = tourIndex === 0;
    setIconLabel(nextButton, tourIndex === journey.length - 1 ? 'Finish the route' : 'Next district', tourIndex === journey.length - 1 ? 'arrow-up-right' : 'arrow-right');
    root.querySelector<HTMLButtonElement>('[data-start-tour]')!.textContent = 'Restart the guided route';
    selectDistrict(step.id, { tour: true });
  }
  function pick(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(world.targets, false)[0];
    return (hit?.object.userData.district as DistrictId | undefined) ?? null;
  }
  function fromHash() {
    const [rawId, mode] = window.location.hash.slice(1).split('/');
    if (rawId && !districts.some(district => district.id === rawId)) return;
    const id = rawId ? rawId as DistrictId : null;
    const open = mode === 'exhibit' && Boolean(districts.find(district => district.id === id)?.image);
    const scroll = history.state?.worldScroll as number | undefined;
    const inspectorScroll = history.state?.worldInspectorScroll as number | undefined;
    if (selected !== id || exhibit !== open) {
      selectDistrict(id, { history: false, reveal: scroll === undefined });
      if (open) setExhibit(true, false);
    }
    if (scroll !== undefined) {
      window.scrollTo({ top: scroll, behavior: 'instant' });
      requestAnimationFrame(() => window.scrollTo({ top: scroll, behavior: 'instant' }));
    }
    if (inspectorScroll !== undefined) inspector.scrollTop = inspectorScroll;
  }
  function activateDistrict(id: DistrictId, event: Event) {
    selectDistrict(id, { focus: (event as MouseEvent).detail === 0 });
  }
  districtButtons.forEach(button => listen(button, 'click', event => activateDistrict(button.dataset.selectDistrict as DistrictId, event)));
  labelButtons.forEach(button => listen(button, 'click', event => activateDistrict(button.dataset.worldLabel as DistrictId, event)));
  root.querySelectorAll('[data-world-reset]').forEach(button => listen(button, 'click', () => {
    selectDistrict(null);
    root.querySelector<HTMLButtonElement>('[data-world-reset]')?.focus({ preventScroll: true });
  }));
  root.querySelectorAll('[data-open-exhibit]').forEach(button => listen(button, 'click', () => setExhibit(true)));
  listen(root.querySelector('[data-close-exhibit]')!, 'click', () => setExhibit(false));
  listen(root.querySelector('[data-start-tour]')!, 'click', () => tourTo(0));
  listen(nextButton, 'click', () => tourTo(tourIndex + 1));
  listen(prevButton, 'click', () => tourTo(tourIndex - 1));
  listen(root.querySelector('[data-tour-stop]')!, 'click', stopTour);
  root.querySelectorAll('a[href="#districts"]').forEach(link => listen(link, 'click', rememberView));
  listen(window, 'popstate', fromHash);
  listen(window, 'hashchange', fromHash);
  listen(canvas, 'pointerdown', (event) => {
    const pointerEvent = event as PointerEvent;
    activePointers.add(pointerEvent.pointerId);
    if (activePointers.size === 1) {
      multiplePointers = false;
      pointerStart = { x: pointerEvent.clientX, y: pointerEvent.clientY, time: performance.now(), id: pointerEvent.pointerId };
    } else multiplePointers = true;
    move = null;
  });
  listen(canvas, 'pointermove', (event) => {
    const pointerEvent = event as PointerEvent;
    if (pointerEvent.buttons) return;
    hovered = pick(pointerEvent);
    canvas.style.cursor = hovered ? 'pointer' : 'grab';
  });
  listen(canvas, 'pointerleave', () => { hovered = null; });
  listen(canvas, 'pointerup', (event) => {
    const pointerEvent = event as PointerEvent;
    if (!multiplePointers && pointerStart?.id === pointerEvent.pointerId && Math.hypot(pointerEvent.clientX - pointerStart.x, pointerEvent.clientY - pointerStart.y) < 7 && performance.now() - pointerStart.time < 600) {
      const id = pick(pointerEvent);
      if (id) selectDistrict(id);
    }
    activePointers.delete(pointerEvent.pointerId);
    if (!activePointers.size) { pointerStart = null; multiplePointers = false; }
  });
  listen(canvas, 'pointercancel', (event) => {
    activePointers.delete((event as PointerEvent).pointerId);
    if (!activePointers.size) { pointerStart = null; multiplePointers = false; }
  });
  listen(canvas, 'wheel', () => { move = null; });
  listen(window, 'keydown', (event) => {
    const keyboard = event as KeyboardEvent;
    if (keyboard.key === 'Escape' && exhibit) {
      setExhibit(false);
    } else if (keyboard.key === 'Escape' && selected) {
      selectDistrict(null);
      root.querySelector<HTMLButtonElement>('[data-world-reset]')?.focus({ preventScroll: true });
    }
  });
  root.querySelectorAll<HTMLButtonElement>('[data-play-recording]').forEach((button) => {
    listen(button, 'click', () => {
      const wrapper = button.closest<HTMLElement>('[data-media-exhibit]')!;
      const video = wrapper.querySelector<HTMLVideoElement>('video')!;
      wrapper.querySelector<HTMLElement>('[data-still]')!.hidden = true;
      video.hidden = false;
      video.src ||= video.dataset.src!;
      button.hidden = true;
      video.play().catch(() => { announcement.textContent = 'Recording ready. Use its playback controls to start.'; });
    });
  });
  const controlStart = () => { move = null; };
  controls.addEventListener('start', controlStart);
  const resizeObserver = new ResizeObserver(size);
  resizeObserver.observe(viewport);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    if (visible && !frame) frame = requestAnimationFrame(render);
  }, { rootMargin: '160px' });
  intersection.observe(stage);
  listen(document, 'visibilitychange', () => {
    if (!document.hidden && visible && !frame) frame = requestAnimationFrame(render);
  });
  listen(canvas, 'webglcontextlost', (event) => {
    event.preventDefault();
    message.hidden = false;
    message.textContent = 'The illustrated view paused. Explore the district descriptions below, or reload to return to the world.';
    root.dataset.worldState = 'fallback';
    cancelAnimationFrame(frame);
    frame = 0;
  });

  function render(now: number) {
    frame = 0;
    if (disposed || document.hidden || !visible || root.dataset.worldState === 'fallback') return;
    if (move) {
      const progress = move.duration ? Math.min((now - move.started) / move.duration, 1) : 1;
      const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      camera.position.lerpVectors(move.fromPosition, move.toPosition, eased);
      controls.target.lerpVectors(move.fromTarget, move.toTarget, eased);
      camera.position.y += Math.sin(progress * Math.PI) * (selected ? 1.3 : 2.5);
      if (progress === 1) move = null;
    }
    controls.update();
    world.animate(reducedMotion ? 0 : now / 1000, hovered ?? selected);
    renderer.render(world.scene, camera);
    updateLabels();
    frame = requestAnimationFrame(render);
  }
  root.dataset.worldState = 'ready';
  message.hidden = true;
  root.querySelectorAll<HTMLButtonElement>('[data-world-control]').forEach((button) => { button.disabled = false; });
  size();
  if (window.location.hash && districts.some((district) => district.id === window.location.hash.slice(1).split('/')[0])) fromHash();
  else cameraTo(null);
  frame = requestAnimationFrame(render);

  return () => {
    disposed = true;
    history.scrollRestoration = previousScrollRestoration;
    pauseMedia();
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    intersection.disconnect();
    listeners.forEach((remove) => remove());
    controls.removeEventListener('start', controlStart);
    controls.dispose();
    world.dispose();
    renderer.dispose();
  };
}
