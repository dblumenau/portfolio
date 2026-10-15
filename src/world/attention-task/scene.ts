import * as THREE from 'three';
import type { TaskView } from './model';

/** A bounded worktable, rendered by World's existing renderer and frame gate. */
export function buildAttentionTask(invalidate: () => void) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#dce2cc');
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 80);
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  let disposed = false;
  const box = new THREE.BoxGeometry(1, 1, 1); geometries.add(box);
  const plane = new THREE.PlaneGeometry(1, 1); geometries.add(plane);
  const material = (color: string) => { const value = new THREE.MeshStandardMaterial({ color, roughness: .9 }); materials.add(value); return value; };
  const wood = material('#a97550'), edge = material('#765740'), green = material('#55705a'), dark = material('#263e35'), metal = material('#bac4ba'), paper = material('#faf0d8'), fold = material('#d9cba7'), gold = material('#ced96c');
  const mesh = (parent: THREE.Object3D, mat: THREE.Material, xyz: [number, number, number], scale: [number, number, number], geometry: THREE.BufferGeometry = box) => {
    const object = new THREE.Mesh(geometry, mat); object.position.set(...xyz); object.scale.set(...scale); parent.add(object); return object;
  };
  scene.add(new THREE.HemisphereLight('#fff9e8', '#779475', 2.6));
  const light = new THREE.DirectionalLight('#fff5dd', 3); light.position.set(-3, 9, 7); scene.add(light);
  mesh(scene, edge, [0, -.35, .4], [12, .55, 7]);
  mesh(scene, wood, [0, -.02, .4], [12.2, .22, 7.2]);
  mesh(scene, green, [0, .12, .4], [11.4, .08, 6.5]);
  for (const x of [-4.9, 4.9]) for (const z of [-2.25, 3]) mesh(scene, edge, [x, -.8, z], [.35, .8, .35]);
  // The ticket is one persistent physical object, separate from the moving answer.
  mesh(scene, edge, [-3.55, .32, -.6], [3.4, .25, 2.4]);
  mesh(scene, dark, [-3.55, 1.65, -1.35], [3.15, 2.1, .22]);
  mesh(scene, green, [-3.55, 1.65, -1.2], [2.8, 1.75, .04]);
  mesh(scene, metal, [-3.55, .65, -1.35], [.38, .9, .35]);
  mesh(scene, dark, [-3.55, .43, -.1], [2.65, .09, .75]);
  for (let index = 0; index < 3; index++) mesh(scene, metal, [-3.55, .49, -.33 + index * .2], [2.35, .04, .08]);
  const ticket = mesh(scene, paper, [-4.1, .35, 1.28], [2.55, .045, 1]); ticket.rotation.y = -.06;
  mesh(scene, gold, [-5.12, .39, 1.28], [.12, .04, .8]);
  // Native Mac display: genuine unselected card, inside an illustrated device.
  mesh(scene, metal, [3.7, 1.75, -1.15], [2.8, 3.2, .2]);
  mesh(scene, dark, [3.7, 1.82, -1.02], [2.55, 2.85, .04]);
  mesh(scene, metal, [3.7, .5, -1.1], [.35, .65, .35]);
  mesh(scene, metal, [3.7, .29, -.85], [1.6, .12, .9]);
  const questionMaterial = new THREE.MeshBasicMaterial({ color: '#f2f1ed', toneMapped: false }); materials.add(questionMaterial);
  mesh(scene, questionMaterial, [3.7, 1.82, -.98], [1.95, 2.52, 1], plane);
  const loader = new THREE.TextureLoader();
  function image(path: string, target: THREE.MeshBasicMaterial) {
    loader.load(path, texture => {
      if (disposed) { texture.dispose(); return; }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 2; textures.add(texture); target.map = texture; target.needsUpdate = true; invalidate();
    }, undefined, () => invalidate());
  }
  image('/media/attention/question.png', questionMaterial);
  const slip = new THREE.Group(); scene.add(slip);
  slip.name = 'attention-answer';
  mesh(slip, gold, [0, 0, 0], [2.05, .08, .85]);
  mesh(slip, paper, [0, .05, 0], [1.94, .035, .74]);
  const target = mesh(scene, gold, [-1.85, .26, 1.3], [1.45, .035, .98]);
  const output = new THREE.Group(); output.position.set(1.1, .35, 2.4); scene.add(output);
  output.name = 'attention-output';
  const resultMaterial = new THREE.MeshBasicMaterial({ color: '#fff9eb', side: THREE.DoubleSide, toneMapped: false }); materials.add(resultMaterial);
  const result = mesh(output, resultMaterial, [0, .02, 0], [4.5, 2.8125, 1], plane); result.rotation.x = -Math.PI / 2;
  result.name = 'attention-result';
  const left = new THREE.Group(), right = new THREE.Group(); output.add(left, right);
  left.name = 'attention-left-fold'; right.name = 'attention-right-fold';
  left.position.set(-2.25, .06, 0); right.position.set(2.25, .065, 0);
  mesh(left, paper, [1.125, 0, 0], [2.25, .045, 2.84]);
  mesh(right, fold, [-1.125, 0, 0], [2.25, .045, 2.84]);
  const seal = mesh(output, green, [0, .12, 0], [.7, .06, .6]);
  let resultRequested = false;
  let returnValue = 0, openValue = 0, started = 0, fromReturn = 0, fromOpen = 0;
  let lastStage = '';
  const startSlip = new THREE.Vector3(3.5, .55, 1.15), endSlip = new THREE.Vector3(-1.85, .45, 1.3);
  const anchors = { ticket: new THREE.Vector3(-4.1, .43, 1.3), mac: new THREE.Vector3(3.7, 3.8, -1.1), target: new THREE.Vector3(-1.85, .45, 1.3), slip: new THREE.Vector3(), sheet: new THREE.Vector3(1.1, .5, 3.8) };
  function update(view: TaskView, now: number, snap: boolean) {
    if (lastStage !== view.stage) { lastStage = view.stage; started = now; fromReturn = returnValue; fromOpen = openValue; }
    if (view.stage === 'built' && !resultRequested) { resultRequested = true; image('/media/attention/workshop-desktop.png', resultMaterial); }
    const progress = snap ? 1 : Math.min(1, Math.max(0, (now - started) / 760));
    const eased = progress * progress * (3 - 2 * progress);
    const returned = view.stage === 'returned' || view.stage === 'built';
    returnValue = view.dragging ? view.dragProgress : THREE.MathUtils.lerp(fromReturn, returned ? 1 : 0, eased);
    openValue = THREE.MathUtils.lerp(fromOpen, view.stage === 'built' ? 1 : 0, eased);
    if (snap) {
      fromReturn = returnValue; fromOpen = openValue;
      started = now - 760;
    }
    slip.visible = view.stage !== 'waiting'; slip.position.lerpVectors(startSlip, endSlip, returnValue);
    slip.position.y += Math.sin(returnValue * Math.PI) * 1.25;
    slip.rotation.y = Math.sin(returnValue * Math.PI) * -.2;
    anchors.slip.copy(slip.position).add(new THREE.Vector3(0, .1, 0));
    target.visible = view.stage === 'chosen';
    output.rotation.x = openValue * .65;
    output.position.y = .35 + openValue * .87;
    output.scale.setScalar(.65 + .35 * openValue);
    left.rotation.z = openValue * 2.5; right.rotation.z = -openValue * 2.5 - (view.stage === 'returned' ? returnValue * .1 : 0);
    left.visible = right.visible = openValue < .99;
    seal.visible = openValue < .08;
    // The closed leaves conceal the real result until it is unfolded.
    result.visible = view.stage === 'built' && openValue > .02;
    return !snap && progress < 1 && !view.dragging;
  }
  const framingCorners: THREE.Vector3[] = [];
  for (const x of [-6.1, 6.1]) for (const y of [-1.2, 3.8]) for (const z of [-3.2, 4.1]) framingCorners.push(new THREE.Vector3(x, y, z));
  const framingPoint = new THREE.Vector3();
  let previousWidth = 0, previousHeight = 0;
  function resize(width: number, height: number) {
    if (width === previousWidth && height === previousHeight) return;
    previousWidth = width; previousHeight = height;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    let distance = 16.4;
    for (let pass = 0; pass < 5; pass++) {
      camera.position.set(0, distance * .7, distance); camera.lookAt(0, .6, .45); camera.updateMatrixWorld();
      let fit = 1;
      for (const corner of framingCorners) {
        framingPoint.copy(corner).project(camera);
        fit = Math.max(fit, Math.abs(framingPoint.x) / (1 - 32 / width), Math.abs(framingPoint.y) / (1 - 36 / height));
      }
      if (fit <= 1) break;
      distance *= fit * 1.02;
    }
  }
  function project(key: keyof typeof anchors, width: number, height: number) {
    const point = anchors[key].clone().project(camera);
    return { x: (point.x * .5 + .5) * width, y: (-point.y * .5 + .5) * height };
  }
  function dispose() { disposed = true; geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose()); textures.forEach(value => value.dispose()); scene.clear(); }
  return { scene, camera, update, resize, project, dispose, get resultVisible() { return result.visible; } };
}
export type AttentionScene = ReturnType<typeof buildAttentionTask>;
