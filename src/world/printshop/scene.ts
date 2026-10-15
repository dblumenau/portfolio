import * as THREE from 'three';
import type { ShopArtwork } from './controller';

/** The press moves actual retained rasters; it never redraws or encodes them. */
export function buildPrintshop(initial: ShopArtwork) {
  const scene = new THREE.Scene(); scene.name = 'small-edition-printshop'; scene.background = new THREE.Color('#dce2cc');
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 120);
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  const box = new THREE.BoxGeometry(1, 1, 1), plane = new THREE.PlaneGeometry(1, 1), cylinder = new THREE.CylinderGeometry(1, 1, 1, 24), circle = new THREE.CircleGeometry(1, 36);
  [box, plane, cylinder, circle].forEach(value => geometries.add(value));
  const mat = (color: string) => { const material = new THREE.MeshStandardMaterial({ color, roughness: .8 }); materials.add(material); return material; };
  const wood = mat('#a77952'), edge = mat('#6f523c'), matGreen = mat('#6c8465'), dark = mat('#284c3c'), iron = mat('#526659'), brass = mat('#c8a868'), paper = mat('#f8eed7');
  const textureMaterial = () => { const material = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, side: THREE.DoubleSide }); materials.add(material); return material; };
  const draftMaterial = textureMaterial(), printMaterials = [textureMaterial(), textureMaterial()] as const;
  const mesh = (parent: THREE.Object3D, material: THREE.Material, position: [number, number, number], scale: [number, number, number], geometry: THREE.BufferGeometry = box) => { const result = new THREE.Mesh(geometry, material); result.position.set(...position); result.scale.set(...scale); parent.add(result); return result; };
  scene.add(new THREE.HemisphereLight('#fff9e8', '#71826d', 2.6));
  const key = new THREE.DirectionalLight('#fff6e1', 3); key.position.set(-4, 9, 8); scene.add(key);
  mesh(scene, edge, [0, -.35, .35], [14, .55, 7.5]);
  mesh(scene, wood, [0, -.03, .35], [14.2, .2, 7.7]);
  mesh(scene, matGreen, [0, .1, .35], [13.4, .08, 7]);
  for (const x of [-5.8, 5.8]) for (const z of [-2.4, 3]) mesh(scene, edge, [x, -.85, z], [.3, .9, .3]);
  const shade = new THREE.MeshBasicMaterial({ color: '#263f2d', transparent: true, opacity: .14, depthWrite: false }); materials.add(shade);
  for (const x of [-4.7, 0, 4.8]) { const shadow = mesh(scene, shade, [x, .155, -.5], [2, 1.35, 1], circle); shadow.rotation.x = -Math.PI / 2; }
  // The draft board has one mutable canvas texture.
  const board = new THREE.Group(); board.position.set(-4.7, 2.05, -1.2); board.rotation.y = .1; scene.add(board);
  mesh(board, edge, [0, 0, -.13], [3.1, 3.35, .24]);
  mesh(board, paper, [0, .02, .02], [2.92, 3.15, .07]);
  mesh(board, draftMaterial, [0, .02, .065], [2.75, 2.75, 1], plane);
  mesh(scene, wood, [-4.7, .3, -1.2], [3.45, .18, 1.5]);
  for (const x of [-5.6, -3.8]) mesh(scene, edge, [x, .8, -1.35], [.16, 1.2, .24]);
  mesh(board, brass, [0, 1.68, 0], [.55, .13, .33]);
  // A carriage rolls across the prepared sheet before it travels to the rack.
  mesh(scene, edge, [0, .28, .5], [3.35, .25, 3.8]);
  mesh(scene, iron, [0, .45, .5], [3, .12, 3.45]);
  for (const x of [-1.45, 1.45]) mesh(scene, dark, [x, 1.45, -.65], [.25, 2.3, .3]);
  mesh(scene, dark, [0, 2.6, -.65], [3.25, .3, .4]);
  for (const x of [-1.1, 1.1]) mesh(scene, brass, [x, .55, .6], [.08, .08, 3.25]);
  const carriage = new THREE.Group(); carriage.position.set(0, 1.03, -.45); scene.add(carriage);
  const roller = mesh(carriage, dark, [0, 0, 0], [.34, 2.45, .34], cylinder); roller.rotation.z = Math.PI / 2;
  const axle = mesh(carriage, brass, [0, 0, 0], [.08, 3.1, .08], cylinder); axle.rotation.z = Math.PI / 2;
  for (const x of [-1.5, 1.5]) mesh(carriage, iron, [x, .28, 0], [.18, .55, .25]);
  const handle = new THREE.Group(); handle.position.set(1.7, 1.05, -.65); scene.add(handle);
  const shaft = mesh(handle, brass, [0, .7, 0], [.09, 1.4, .09], cylinder); shaft.rotation.z = -.2;
  const grip = mesh(handle, wood, [.15, 1.4, 0], [.16, .55, .16], cylinder); grip.rotation.z = Math.PI / 2;
  const blank = mesh(scene, paper, [0, .535, .75], [2.55, 2.55, 1], plane); blank.rotation.x = -Math.PI / 2;
  // The two rack slots only become sheets after their PNG has been committed.
  for (const x of [3.35, 6.25]) mesh(scene, edge, [x, 2.5, -1.6], [.19, 4.65, .24]);
  for (const y of [.3, 2.55, 4.8]) mesh(scene, wood, [4.8, y, -1.6], [3.3, .15, .28]);
  const rackPositions = [new THREE.Vector3(4.8, 3.58, -1.4), new THREE.Vector3(4.8, 1.23, -1.4)];
  const rack = rackPositions.map((position, index) => { const sheet = mesh(scene, printMaterials[index as 0 | 1], position.toArray(), [2.08, 2.08, 1], plane); sheet.rotation.y = -.06; sheet.visible = false; return sheet; });
  for (const y of [4.65, 2.3]) mesh(scene, brass, [4.8, y, -1.3], [.45, .14, .2]);
  const flight = mesh(scene, printMaterials[0], [0, .55, .75], [2.55, 2.55, 1], plane); flight.name = 'printshop-travelling-print'; flight.visible = false;
  const flat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  const hung = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -.06, 0));
  const start = new THREE.Vector3(0, .56, .75);
  const draftTexture = canvasTexture(initial.draft); draftMaterial.map = draftTexture;
  const textures: [THREE.CanvasTexture<HTMLCanvasElement | OffscreenCanvas> | null, THREE.CanvasTexture<HTMLCanvasElement | OffscreenCanvas> | null] = [null, null];
  const canvases: [CanvasImageSource | null, CanvasImageSource | null] = [null, null];
  let draftVersion = -1, motion: { slot: 0 | 1; started: number } | null = null;
  let previousWidth = 0, previousHeight = 0;
  const anchors = { draft: new THREE.Vector3(-4.7, 4.12, -1.2), press: new THREE.Vector3(0, .45, 2.85), rack: new THREE.Vector3(4.8, 5.2, -1.5), print0: new THREE.Vector3(6.15, 3.2, -.9), print1: new THREE.Vector3(6.15, .9, -.9) };
  const corners: THREE.Vector3[] = []; for (const x of [-7.1, 7.1]) for (const y of [-1.3, 5.3]) for (const z of [-3.5, 4.2]) corners.push(new THREE.Vector3(x, y, z));
  const projected = new THREE.Vector3();
  function canvasTexture(canvas: HTMLCanvasElement | OffscreenCanvas) { const texture = new THREE.CanvasTexture<HTMLCanvasElement | OffscreenCanvas>(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.generateMipmaps = false; texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter; return texture; }
  function sync(artwork: ShopArtwork) {
    if (artwork.version !== draftVersion) { draftVersion = artwork.version; draftTexture.needsUpdate = true; }
    for (const slot of [0, 1] as const) {
      const canvas = artwork.prints[slot]?.surface.canvas ?? null;
      if (canvases[slot] !== canvas) {
        textures[slot]?.dispose(); canvases[slot] = canvas;
        textures[slot] = canvas ? canvasTexture(canvas) : null;
        printMaterials[slot].map = textures[slot]; printMaterials[slot].needsUpdate = true;
      }
      rack[slot]!.visible = !!canvas && motion?.slot !== slot;
    }
  }
  function settle() { motion = null; flight.visible = false; carriage.position.z = -.45; handle.rotation.x = 0; roller.rotation.y = 0; rack.forEach((sheet, slot) => { sheet.visible = !!canvases[slot as 0 | 1]; }); }
  function animate(now: number) {
    if (!motion) return false;
    const t = Math.max(0, Math.min(1, (now - motion.started) / 900));
    const pull = Math.min(1, t / .45), transfer = Math.max(0, (t - .4) / .6), eased = transfer * transfer * (3 - 2 * transfer);
    carriage.position.z = -.45 + Math.sin(pull * Math.PI / 2) * 1.8; roller.rotation.y = pull * Math.PI * 3;
    handle.rotation.x = Math.sin(pull * Math.PI) * -.8;
    flight.position.lerpVectors(start, rackPositions[motion.slot]!, eased); flight.position.y += Math.sin(eased * Math.PI) * 1.55;
    flight.quaternion.slerpQuaternions(flat, hung, eased); flight.scale.setScalar(2.55 - eased * .47);
    if (t >= 1) { settle(); return false; }
    return true;
  }
  function resize(width: number, height: number) {
    if (width === previousWidth && height === previousHeight) return;
    previousWidth = width; previousHeight = height; camera.aspect = width / height; camera.updateProjectionMatrix();
    let distance = 18;
    for (let pass = 0; pass < 5; pass++) {
      camera.position.set(0, distance * .58, distance); camera.lookAt(0, 1.4, .1); camera.updateMatrixWorld();
      let fit = 1;
      for (const corner of corners) { projected.copy(corner).project(camera); fit = Math.max(fit, Math.abs(projected.x) / (1 - 32 / width), Math.abs(projected.y) / (1 - 42 / height)); }
      if (fit <= 1) break; distance *= fit * 1.02;
    }
  }
  sync(initial);
  return {
    scene,
    sync,
    startPress(slot: 0 | 1, now: number) { settle(); motion = { slot, started: now }; rack[slot]!.visible = false; flight.material = printMaterials[slot]; flight.visible = true; flight.position.copy(start); flight.quaternion.copy(flat); },
    settle,
    refresh() { draftTexture.needsUpdate = true; textures.forEach(texture => { if (texture) texture.needsUpdate = true; }); },
    render(renderer: THREE.WebGLRenderer, now: number, width: number, height: number) { resize(width, height); const moving = animate(now); renderer.render(scene, camera); return moving; },
    positionLabels(overlay: HTMLElement, viewport: HTMLElement) {
      const bounds = viewport.getBoundingClientRect(), width = bounds.width, height = bounds.height;
      overlay.querySelectorAll<HTMLElement>('[data-shop-anchor]').forEach(element => {
        const key = element.dataset.shopAnchor as keyof typeof anchors;
        projected.copy(anchors[key]).project(camera);
        element.style.left = `${(projected.x * .5 + .5) * width}px`; element.style.top = `${(-projected.y * .5 + .5) * height}px`;
        if (height < 400) {
          if (key === 'draft') { element.style.left = `${width * .18}px`; element.style.top = '47px'; }
          if (key === 'rack') { element.style.left = `${width * .77}px`; element.style.top = '40px'; }
          if (key === 'print0' || key === 'print1') { element.style.left = `${width * .82}px`; element.style.top = `${key === 'print0' ? height * .43 : height * .73}px`; }
          if (key === 'press') { element.style.left = `${width * .4}px`; element.style.top = `${height - 38}px`; }
          if (width < 600 && (key === 'press' || key === 'print0' || key === 'print1')) {
            element.style.left = `${width * (key === 'press' ? .18 : key === 'print0' ? .51 : .84)}px`;
            element.style.top = `${height - 31}px`;
          }
        }
        const box = element.getBoundingClientRect();
        const x = Math.max(0, bounds.left + 8 - box.left) - Math.max(0, box.right - bounds.right + 8);
        const y = Math.max(0, bounds.top + 30 - box.top) - Math.max(0, box.bottom - bounds.bottom + 8);
        element.style.left = `${parseFloat(element.style.left) + x}px`; element.style.top = `${parseFloat(element.style.top) + y}px`;
      });
    },
    dispose() { settle(); draftTexture.dispose(); textures.forEach(texture => texture?.dispose()); geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose()); scene.clear(); },
  };
}
export type PrintshopScene = ReturnType<typeof buildPrintshop>;
