import * as THREE from 'three';
import type { DeskState } from './model';

/** A bounded illustration of the exact local desk state, rendered by the World host. */
export function buildMemoryDesk() {
  const scene = new THREE.Scene(); scene.name = 'memory-evidence-desk'; scene.background = new THREE.Color('#dcd5d8');
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  const box = new THREE.BoxGeometry(1, 1, 1), cylinder = new THREE.CylinderGeometry(1, 1, 1, 20); geometries.add(box); geometries.add(cylinder);
  const mat = (color: string, metalness = 0) => { const material = new THREE.MeshStandardMaterial({ color, roughness: .72, metalness }); materials.add(material); return material; };
  const plum = mat('#59455e'), deep = mat('#3e3345'), wood = mat('#916f65'), brass = mat('#bd9d62', .35), cream = mat('#f6edda'), folder = mat('#a4815f'), ink = mat('#7a657f');
  const mesh = (parent: THREE.Object3D, material: THREE.Material, p: [number, number, number], s: [number, number, number], geometry: THREE.BufferGeometry = box) => { const item = new THREE.Mesh(geometry, material); item.position.set(...p); item.scale.set(...s); parent.add(item); return item; };
  scene.add(new THREE.HemisphereLight('#fff7ec', '#5c5060', 3)); const light = new THREE.DirectionalLight('#fff0d4', 3); light.position.set(-4, 9, 6); scene.add(light);
  mesh(scene, deep, [0, -.5, 0], [13, .7, 6.4]); mesh(scene, wood, [0, -.08, 0], [13.2, .15, 6.6]); mesh(scene, plum, [0, .03, 0], [12.7, .08, 6.1]);
  for (const x of [-5.8, 5.8]) mesh(scene, deep, [x, 1.65, -2.7], [.16, 3.4, .3]);
  for (const y of [.6, 2.6, 3.4]) mesh(scene, wood, [0, y, -2.7], [11.8, .14, .5]);
  for (let i = 0; i < 5; i++) mesh(scene, i % 2 ? cream : ink, [-4.8 + i * .35, 1.5, -2.7], [.24, 1.6 - (i % 2) * .25, .4]);
  mesh(scene, deep, [-3.8, .4, -.15], [4.6, .6, 3.25]);
  const drawer = new THREE.Group(); drawer.position.set(-3.8, .4, .2); scene.add(drawer);
  mesh(drawer, wood, [0, -.15, 0], [4.35, .15, 2.9]); mesh(drawer, brass, [0, .15, 1.45], [4.45, .55, .12]); mesh(drawer, deep, [0, .2, 1.54], [.7, .13, .12]);
  // Reading instrument and its finite pool of paper objects.
  mesh(scene, brass, [.6, .2, -1.5], [1.1, .18, .8], cylinder); mesh(scene, brass, [.6, 2.05, -1.5], [.09, 3.6, .09], cylinder);
  const arm = mesh(scene, brass, [.05, 3.8, -1.5], [.09, 1.25, .09], cylinder); arm.rotation.z = -.95;
  const shade = mesh(scene, deep, [-.5, 3.85, -1.5], [.65, .5, .65], cylinder); shade.rotation.z = -.25;
  const glowMaterial = new THREE.MeshBasicMaterial({ color: '#ffe3a4', transparent: true, opacity: .2, depthWrite: false }); materials.add(glowMaterial);
  const glow = mesh(scene, glowMaterial, [0, .13, .7], [2.85, .015, 2.2]);
  const source = mesh(scene, cream, [.32, .2, 1.45], [2.4, .035, 1]); source.rotation.y = -.1; source.visible = false;
  mesh(scene, folder, [4.3, .16, .5], [3.1, .12, 3.4]); mesh(scene, brass, [3.45, .24, -.95], [1.2, .1, .3]);
  const sheet = mesh(scene, cream, [4.3, .3, .45], [2.65, .04, 2.85]); sheet.visible = false;
  const clip = mesh(scene, brass, [4.3, .35, -.75], [.5, .055, .15]); clip.visible = false;
  const atlas = document.createElement('canvas'); atlas.width = 768; atlas.height = 128; const context = atlas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(atlas); texture.colorSpace = THREE.SRGBColorSpace; texture.generateMipmaps = false; texture.minFilter = THREE.LinearFilter;
  const labels = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }); materials.add(labels);
  const cards: THREE.Group[] = [];
  for (let i = 0; i < 3; i++) {
    const card = new THREE.Group(); card.name = `memory-record-${i}`; scene.add(card); cards.push(card);
    mesh(card, cream, [0, 0, 0], [2.3, 1.35, .07]); mesh(card, brass, [-.8, .67, 0], [.5, .12, .1]);
    const plane = new THREE.PlaneGeometry(2.1, 1.05); const uv = plane.attributes.uv!;
    for (let v = 0; v < uv.count; v++) uv.setX(v, (uv.getX(v) + i) / 3); geometries.add(plane);
    mesh(card, labels, [0, .12, .045], [1, 1, 1], plane);
    for (const y of [-.25, -.42]) mesh(card, ink, [0, y, .05], [1.7, .018, .01]);
    card.rotation.x = -.28; card.visible = false;
  }
  let state: DeskState, start = 0, moving = false;
  let from = cards.map(card => card.position.clone()), targets = cards.map(() => new THREE.Vector3());
  function settle() { moving = false; cards.forEach((card, i) => card.position.copy(targets[i]!)); drawer.position.z = state?.records.length ? .65 : .2; }
  function sync(next: DeskState, animate: boolean) {
    state = next; context.fillStyle = '#f6edda'; context.fillRect(0, 0, 768, 128); context.fillStyle = '#3e3345'; context.font = '600 42px sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle';
    next.records.forEach((record, i) => context.fillText(record.tuple.object, i * 256 + 128, 64)); texture.needsUpdate = true;
    from = cards.map(card => card.position.clone());
    targets = cards.map((_, i) => next.records[i]?.tuple.object === next.inspected ? new THREE.Vector3(0, 1.4, .55) : new THREE.Vector3(-5.2 + i * 1.4, .95, .65));
    cards.forEach((card, i) => { card.visible = !!next.records[i]; card.userData.tuple = next.records[i]?.tuple; card.scale.setScalar(next.records[i]?.tuple.object === next.inspected ? 1 : .55); });
    source.visible = !!next.records.find(record => record.tuple.object === next.inspected)?.excerpt;
    glow.visible = !!next.inspected; sheet.visible = clip.visible = next.assembled;
    start = performance.now(); moving = animate && (cards.some((card, i) => card.position.distanceToSquared(targets[i]!) > .0001) || Math.abs(drawer.position.z - (next.records.length ? .65 : .2)) > .0001); if (!moving) settle();
  }
  return {
    scene, sync, settle,
    refresh() { texture.needsUpdate = true; },
    render(renderer: THREE.WebGLRenderer, now: number, width: number, height: number) {
      camera.aspect = width / height; camera.updateProjectionMatrix();
      const distance = Math.max(20, 14 / camera.aspect); camera.position.set(0, distance * .55, distance); camera.lookAt(0, 1, 0);
      if (moving) { const t = Math.min(1, Math.max(0, (now - start) / 480)), eased = t * t * (3 - 2 * t); cards.forEach((card, i) => card.position.lerpVectors(from[i]!, targets[i]!, eased)); drawer.position.z = .2 + .45 * eased; if (t === 1) settle(); }
      renderer.render(scene, camera); return moving;
    },
    dispose() { texture.dispose(); atlas.width = atlas.height = 0; geometries.forEach(item => item.dispose()); materials.forEach(item => item.dispose()); scene.clear(); },
  };
}
export type MemoryDeskScene = ReturnType<typeof buildMemoryDesk>;
