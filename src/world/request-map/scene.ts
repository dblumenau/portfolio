import * as THREE from 'three';
import type { EvidenceField, SafeCase } from './model';
export type DeskView = { record: SafeCase; opened: boolean; field: EvidenceField; saved: boolean; version: number };

export function buildRequestDesk(canvas: HTMLCanvasElement) {
  const scene = new THREE.Scene(); scene.name = 'connections-request-map'; scene.background = new THREE.Color('#d7e0d7');
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  const box = new THREE.BoxGeometry(1, 1, 1), cylinder = new THREE.CylinderGeometry(1, 1, 1, 20), plane = new THREE.PlaneGeometry(1, 1), arch = new THREE.TorusGeometry(2.35, .18, 8, 40, Math.PI); [box, cylinder, plane, arch].forEach(g => geometries.add(g));
  const mat = (color: string, metalness = 0) => { const material = new THREE.MeshStandardMaterial({ color, roughness: .78, metalness }); materials.add(material); return material; };
  const forest = mat('#315a4b'), dark = mat('#274238'), teal = mat('#779b88'), cream = mat('#f8efda'), wood = mat('#9f7d5c'), brass = mat('#bea467', .3), paperInk = mat('#829784');
  const mesh = (parent: THREE.Object3D, material: THREE.Material, p: [number, number, number], scale: [number, number, number], geometry: THREE.BufferGeometry = box) => { const object = new THREE.Mesh(geometry, material); object.position.set(...p); object.scale.set(...scale); parent.add(object); return object; };
  scene.add(new THREE.HemisphereLight('#fff9e8', '#697b6b', 3)); const light = new THREE.DirectionalLight('#fff1d5', 3); light.position.set(-4, 9, 7); scene.add(light);
  mesh(scene, dark, [0, -.5, .2], [13.5, .7, 6.2]); mesh(scene, wood, [0, -.08, .2], [13.7, .15, 6.4]); mesh(scene, teal, [0, .04, .2], [13.2, .08, 5.9]);
  for (const x of [-5.9, 5.9]) mesh(scene, dark, [x, -.95, .2], [.3, .8, .3]);
  for (const x of [-2.35, 2.35]) mesh(scene, forest, [x - .4, 1.2, -1.5], [.36, 2.3, .36]);
  const arc = mesh(scene, forest, [-.4, 2.35, -1.5], [1, 1, 1], arch); arc.name = 'connections-recorded-arch';
  mesh(scene, brass, [-.4, 2.2, -1.5], [5.1, .16, .4]);
  const windows = [-2, -.4, 1.2].map(x => { mesh(scene, dark, [x, 1.5, -1.25], [1.4, 1.5, .17]); return mesh(scene, cream, [x, 1.5, -1.12], [1.18, 1.25, .05]); });
  const highlight = mesh(scene, brass, [-2, .68, -1.04], [1.42, .13, .14]); highlight.name = 'connections-selected-evidence'; highlight.visible = false;
  for (const x of [-2, -.4, 1.2]) for (const y of [1.4, 1.65]) mesh(scene, paperInk, [x, y, -1.07], [.8, .035, .015]);
  // One request card, with a finite recorded-state transition rather than a network stream.
  const request = new THREE.Group(); request.name = 'connections-recorded-request'; request.position.set(-4.5, .25, 1.3); scene.add(request);
  mesh(request, brass, [0, 0, 0], [1.9, .09, 1.35]); mesh(request, cream, [0, .07, 0], [1.75, .045, 1.2]);
  for (const z of [-.25, .05, .35]) mesh(request, paperInk, [0, .105, z], [1.25, .015, .025]);
  const tray = new THREE.Group(); tray.position.set(3.1, .23, 1.45); scene.add(tray);
  mesh(tray, wood, [0, 0, 0], [2.25, .16, 1.9]); for (const x of [-1.1, 1.1]) mesh(tray, forest, [x, .18, 0], [.1, .28, 2]); mesh(tray, forest, [0, .18, -.95], [2.25, .28, .1]);
  const board = new THREE.Group(); board.position.set(5.05, 2.04, -1.45); board.rotation.y = -.12; scene.add(board);
  mesh(board, wood, [0, 0, 0], [2.7, 3.55, .18]); mesh(board, cream, [0, 0, .12], [2.46, 3.3, .05]);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.generateMipmaps = false; texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter;
  const drawing = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }); materials.add(drawing);
  const map = mesh(board, drawing, [0, 0, .16], [2.3, 2.9, 1], plane); map.name = 'connections-built-svg-map'; map.visible = false;
  mesh(board, brass, [0, 1.73, .15], [.6, .16, .2]);
  let target = request.position.clone(), from = request.position.clone(), started = 0, moving = false, version = -1;
  const fieldX = { caller: -2, resource: -.4, policy: 1.2 };
  function settle() { moving = false; request.position.copy(target); }
  return {
    scene,
    sync(view: DeskView, animate: boolean) {
      from.copy(request.position); target.set(view.opened ? view.record.upstreamToolCalls === 1 ? 3.1 : -2.6 : -4.5, view.opened ? .43 : .25, 1.3);
      request.userData.caseKey = view.record.key; request.userData.forwarded = view.record.upstreamToolCalls;
      highlight.visible = view.opened; highlight.position.x = fieldX[view.field]; windows.forEach(window => { window.visible = true; });
      map.visible = view.saved; if (version !== view.version) { version = view.version; texture.needsUpdate = true; }
      started = performance.now(); moving = animate && from.distanceToSquared(target) > .0001; if (!moving) settle();
    },
    settle, refresh() { texture.needsUpdate = true; },
    render(renderer: THREE.WebGLRenderer, now: number, width: number, height: number) {
      camera.aspect = width / height; camera.updateProjectionMatrix(); const distance = Math.max(21, 14 / camera.aspect); camera.position.set(0, distance * .55, distance); camera.lookAt(0, 1.2, .2);
      if (moving) { const t = Math.max(0, Math.min(1, (now - started) / 480)), eased = t * t * (3 - 2 * t); request.position.lerpVectors(from, target, eased); if (t === 1) settle(); }
      renderer.render(scene, camera); return moving;
    },
    dispose() { texture.dispose(); materials.forEach(material => material.dispose()); geometries.forEach(geometry => geometry.dispose()); scene.clear(); },
  };
}
export type RequestDeskScene = ReturnType<typeof buildRequestDesk>;
