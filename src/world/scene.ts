import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { districts, type DistrictId } from './data';

const palette = {
  paper: '#eee9dc', chalk: '#faf7ef', ink: '#263a30', forest: '#46654c', moss: '#819274',
  lime: '#d9ee8b', rust: '#b65f43', gold: '#b59c65', plum: '#806f87', teal: '#6a9991',
};

export interface WorldScene {
  scene: THREE.Scene;
  targets: THREE.Object3D[];
  anchors: Map<DistrictId, THREE.Vector3>;
  highlights: Map<DistrictId, THREE.Mesh>;
  animate: (time: number, active: DistrictId | null) => void;
  dispose: () => void;
}

export function buildWorld(onTexture: () => void): WorldScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e8e6da');
  scene.fog = new THREE.Fog('#e8e6da', 56, 106);
  const targets: THREE.Object3D[] = [];
  const anchors = new Map<DistrictId, THREE.Vector3>();
  const highlights = new Map<DistrictId, THREE.Mesh>();
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const geometries = new Map<string, THREE.BufferGeometry>();
  const textures: THREE.Texture[] = [];
  const retiredGeometries = new Set<THREE.BufferGeometry>();
  const orbiters: THREE.Group[] = [];
  const pulses: { mesh: THREE.Mesh; curve: THREE.Curve<THREE.Vector3>; offset: number; district: DistrictId }[] = [];
  let disposed = false;

  const material = (color: string, roughness = 0.72, metalness = 0.03) => {
    const key = `${color}:${roughness}:${metalness}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness }));
    return materials.get(key)!;
  };
  const geometry = (key: string, create: () => THREE.BufferGeometry) => {
    if (!geometries.has(key)) geometries.set(key, create());
    return geometries.get(key)!;
  };
  const mesh = (parent: THREE.Object3D, shape: THREE.BufferGeometry, mat: THREE.Material, position: [number, number, number], shadow = true) => {
    const object = new THREE.Mesh(shape, mat);
    object.position.set(...position);
    object.castShadow = shadow;
    object.receiveShadow = shadow;
    parent.add(object);
    return object;
  };
  const box = (parent: THREE.Object3D, size: [number, number, number], position: [number, number, number], color: string) =>
    mesh(parent, geometry(`box:${size.join(',')}`, () => new THREE.BoxGeometry(...size)), material(color), position);
  const cylinder = (parent: THREE.Object3D, radius: number, height: number, position: [number, number, number], color: string, segments = 32) =>
    mesh(parent, geometry(`cyl:${radius}:${height}:${segments}`, () => new THREE.CylinderGeometry(radius, radius, height, segments)), material(color), position);
  const sphere = (parent: THREE.Object3D, radius: number, position: [number, number, number], color: string) =>
    mesh(parent, geometry(`sphere:${radius}`, () => new THREE.SphereGeometry(radius, 16, 12)), material(color, 0.4), position);
  const ring = (parent: THREE.Object3D, radius: number, width: number, position: [number, number, number], color: string) => {
    const object = mesh(parent, geometry(`ring:${radius}:${width}`, () => new THREE.TorusGeometry(radius, width, 6, 64)), material(color), position);
    object.rotation.x = -Math.PI / 2;
    return object;
  };
  const beam = (parent: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, radius: number, color: string) => {
    const delta = b.clone().sub(a);
    const shape = geometry(`beam:${radius}`, () => new THREE.CylinderGeometry(radius, radius, 1, 8));
    const object = mesh(parent, shape, material(color), [0, 0, 0]);
    object.position.copy(a).addScaledVector(delta, 0.5);
    object.scale.y = delta.length();
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    return object;
  };
  const line = (parent: THREE.Object3D, points: THREE.Vector3[], color: string, opacity = 1) => {
    const shape = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });
    const object = new THREE.Line(shape, mat);
    parent.add(object);
    return object;
  };
  const textTexture = (lines: string[], options: { background?: string; ink?: string; font?: number; width?: number; height?: number } = {}) => {
    const canvas = document.createElement('canvas');
    canvas.width = options.width ?? 512;
    canvas.height = options.height ?? 192;
    const context = canvas.getContext('2d')!;
    context.fillStyle = options.background ?? palette.paper;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = options.ink ?? palette.ink;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = `600 ${options.font ?? 36}px "DM Sans Variable", sans-serif`;
    lines.forEach((value, i) => context.fillText(value, canvas.width / 2, (i + 0.5) * canvas.height / lines.length, canvas.width - 30));
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.push(texture);
    return texture;
  };
  const plane = (parent: THREE.Object3D, texture: THREE.Texture, size: [number, number], position: [number, number, number]) => {
    const object = mesh(parent, geometry('plane', () => new THREE.PlaneGeometry(1, 1)), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, side: THREE.DoubleSide }), position, false);
    object.scale.set(size[0], size[1], 1);
    return object;
  };
  const plaque = (parent: THREE.Object3D, lines: string[], position: [number, number, number], width = 2.1, color = palette.paper) =>
    plane(parent, textTexture(lines, { background: color }), [width, width * 0.375], position);
  const loader = new THREE.TextureLoader();
  const photo = (path: string) => {
    const texture = loader.load(path, () => {
      if (disposed) texture.dispose();
      else onTexture();
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    textures.push(texture);
    return texture;
  };
  const galleryTexture = photo('/media/panelforge-gallery-desktop.webp');
  const chatTexture = photo('/media/panelforge-chat-desktop.webp');
  const kitTexture = photo('/media/kitforge-desktop.webp');
  const pencilTexture = photo('/media/pencil-page.webp');
  const appleTexture = photo('/media/apple-client.webp');
  const knowledgeTexture = photo('/media/knowledge-graph.webp');

  const screen = (parent: THREE.Object3D, texture: THREE.Texture, size: [number, number], position: [number, number, number], color = palette.ink) => {
    const group = new THREE.Group();
    group.position.set(...position);
    parent.add(group);
    box(group, [size[0] + 0.16, size[1] + 0.16, 0.14], [0, 0, 0], color);
    plane(group, texture, size, [0, 0, 0.081]);
    return group;
  };
  const plant = (parent: THREE.Object3D, x: number, z: number, scale = 1) => {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.scale.setScalar(scale);
    parent.add(group);
    cylinder(group, 0.32, 0.5, [0, 0.25, 0], palette.rust, 12);
    cylinder(group, 0.09, 1.4, [0, 1, 0], palette.gold, 8);
    sphere(group, 0.65, [0, 1.65, 0], palette.forest);
    sphere(group, 0.46, [0.38, 1.94, 0.1], palette.moss);
    sphere(group, 0.42, [-0.32, 2.12, -0.13], palette.forest);
  };
  const lamp = (parent: THREE.Object3D, position: [number, number, number], height = 2.8) => {
    cylinder(parent, 0.075, height, [position[0], position[1] + height / 2, position[2]], palette.ink, 8);
    cylinder(parent, 0.24, 0.14, [position[0], position[1] + height, position[2]], palette.lime, 12);
    cylinder(parent, 0.36, 0.1, [position[0], position[1] + height + 0.1, position[2]], palette.ink, 12);
  };

  scene.add(new THREE.HemisphereLight('#fff9e7', '#97a391', 2.8));
  const sun = new THREE.DirectionalLight('#fff2d2', 3.8);
  sun.position.set(-12, 24, 15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -25;
  sun.shadow.camera.right = sun.shadow.camera.top = 25;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 70;
  sun.shadow.normalBias = 0.055;
  sun.shadow.bias = -0.0003;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#e5f0e0', 1.1);
  fill.position.set(12, 8, -16);
  scene.add(fill);
  const ground = mesh(scene, geometry('ground', () => new THREE.PlaneGeometry(300, 300)), material('#e8e6da'), [0, -0.72, 0]);
  ground.rotation.x = -Math.PI / 2;
  cylinder(scene, 18.7, 0.52, [0, -0.35, 0], '#d2d7c7', 96);
  cylinder(scene, 18.6, 0.07, [0, -0.045, 0], '#e9e8db', 96);
  ring(scene, 18.1, 0.035, [0, 0.03, 0], '#bcc7b2');
  ring(scene, 16.5, 0.018, [0, 0.03, 0], '#ced4c2');

  const hub = new THREE.Group();
  scene.add(hub);
  cylinder(hub, 2.25, 0.3, [0, 0.15, 0], palette.ink, 64);
  cylinder(hub, 1.88, 0.07, [0, 0.34, 0], palette.lime, 64);
  ring(hub, 1.55, 0.025, [0, 0.42, 0], palette.forest);
  const compass = plaque(hub, ['FORGE', 'USEFUL THINGS'], [0, 0.45, 0], 2.5, palette.lime);
  compass.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI / 6;
    const mark = box(hub, [0.04, 0.04, i % 3 ? 0.15 : 0.3], [Math.sin(angle) * 1.73, 0.42, Math.cos(angle) * 1.73], palette.ink);
    mark.rotation.y = angle;
  }

  const builders: Record<DistrictId, (group: THREE.Group) => void> = {
    studio(group) {
      box(group, [7.3, 0.18, 5.6], [0, 0.18, -0.25], '#dfd4c1');
      box(group, [6.7, 3.5, 0.18], [0, 2, -2.1], palette.chalk);
      box(group, [0.16, 3.5, 4.8], [-3.3, 2, 0.1], palette.chalk);
      screen(group, galleryTexture, [4.6, 2.4], [0.45, 2.15, -1.9], palette.rust);
      plaque(group, ['PANELFORGE / STUDIO'], [0.5, 0.6, -1.9], 3.5);
      const second = screen(group, chatTexture, [2.8, 1.75], [-3.17, 2.16, 0.5]);
      second.rotation.y = Math.PI / 2;
      for (const x of [-2.65, 2.65]) {
        beam(group, new THREE.Vector3(x, 3.85, -2), new THREE.Vector3(x, 3.85, 1.3), 0.055, palette.ink);
        for (const z of [-1, 0.8]) box(group, [0.28, 0.11, 0.4], [x, 3.77, z], palette.gold);
      }
      box(group, [3.4, 0.2, 0.8], [0.2, 0.9, 1.45], palette.ink);
      for (const x of [-1.15, 1.55]) box(group, [0.1, 0.7, 0.54], [x, 0.45, 1.45], palette.ink);
      plant(group, 3.3, 1.7, 0.7);
      cylinder(group, 0.55, 0.65, [-2.25, 0.56, 2], palette.rust, 24);
      cylinder(group, 0.6, 0.08, [-2.25, 0.94, 2], palette.paper, 24);
    },
    engines(group) {
      box(group, [6.3, 0.18, 5.2], [0, 0.16, 0], '#d4dccb');
      ['CLAUDE', 'CODEX', 'OPENCODE'].forEach((name, i) => {
        const x = (i - 1) * 1.9;
        box(group, [1.46, 3.85, 1.5], [x, 2.13, -0.85], palette.ink);
        box(group, [1.3, 3.64, 0.06], [x, 2.15, -0.055], '#415646');
        for (let slot = 0; slot < 7; slot++) {
          box(group, [1.14, 0.26, 0.09], [x, 0.75 + slot * 0.43, 0.01], '#bdc7ad');
          box(group, [0.12, 0.07, 0.025], [x - 0.43, 0.75 + slot * 0.43, 0.067], slot % 3 ? palette.ink : palette.lime);
          for (let vent = 0; vent < 4; vent++) box(group, [0.045, 0.11, 0.025], [x + 0.08 + vent * 0.15, 0.75 + slot * 0.43, 0.067], '#788c72');
        }
        plaque(group, [name], [x, 3.78, 0.066], 1.2, palette.lime);
        cylinder(group, 0.08, 0.28, [x, 4.2, -0.85], palette.rust, 12);
      });
      box(group, [4.7, 0.2, 1.3], [0, 0.9, 2], palette.gold);
      for (const x of [-1.8, 1.8]) box(group, [0.14, 0.68, 0.9], [x, 0.5, 2], palette.ink);
      screen(group, chatTexture, [2.05, 1.2], [-0.8, 1.65, 1.95]);
      box(group, [0.2, 0.6, 0.2], [-0.8, 1.2, 1.9], palette.ink);
      const phone = screen(group, appleTexture, [0.57, 1.12], [1.3, 1.55, 2.03]);
      phone.rotation.x = -0.1;
      plaque(group, ['A COMMON CLIENT STREAM'], [0, 0.45, 2.68], 3.7);
      lamp(group, [3, 0.25, -1.8], 3.8);
    },
    connections(group) {
      cylinder(group, 3.75, 0.2, [0, 0.14, 0], '#dfdfca', 48);
      for (const x of [-1.6, 1.6]) {
        box(group, [0.7, 2.8, 0.8], [x, 1.65, -0.6], palette.ink);
        box(group, [0.94, 0.13, 1.1], [x, 0.35, -0.6], palette.gold);
      }
      const arch = mesh(group, new THREE.TorusGeometry(1.6, 0.35, 10, 36, Math.PI), material(palette.ink), [0, 3.05, -0.6]);
      const archInner = mesh(group, new THREE.TorusGeometry(1.58, 0.06, 6, 36, Math.PI), material(palette.lime), [0, 3.05, -0.23]);
      arch.rotation.z = archInner.rotation.z = 0;
      plaque(group, ['MCP', 'GATEWAY'], [0, 3.15, -0.19], 1.85, palette.lime);
      const ports = [new THREE.Vector3(-2.65, 0.4, 1.5), new THREE.Vector3(0, 0.4, 2.75), new THREE.Vector3(2.65, 0.4, 1.5)];
      ports.forEach((point, i) => {
        const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0.3, -0.6), new THREE.Vector3(point.x * 0.5, 0.32, 0.1), point);
        mesh(group, new THREE.TubeGeometry(curve, 20, 0.08, 6, false), material(palette.gold), [0, 0, 0]);
        cylinder(group, 0.57, 0.55, [point.x, 0.55, point.z], i === 1 ? palette.teal : palette.moss, 20);
        ring(group, 0.45, 0.035, [point.x, 0.86, point.z], palette.lime);
        plaque(group, [['IDENTITY'], ['TOOL PROFILE'], ['RESOURCE SCOPE']][i]!, [point.x, 1.22, point.z + 0.01], 1.65);
      });
      const canvas = screen(group, textTexture(['NATIVE CANVAS', 'InfinitySketch + Freeform'], { font: 28 }), [2.3, 1.5], [2.6, 2.3, -1.9]);
      canvas.rotation.y = -0.4;
      beam(group, new THREE.Vector3(2.6, 0.3, -1.9), new THREE.Vector3(2.6, 1.65, -1.9), 0.07, palette.ink);
      plant(group, -2.7, -1.9, 0.55);
    },
    memory(group) {
      cylinder(group, 3.7, 0.2, [0, 0.15, 0], '#dcd6df', 48);
      for (const x of [-2.6, 2.6]) {
        box(group, [1.35, 2.1, 1.2], [x, 1.3, -0.2], palette.ink);
        for (let row = 0; row < 3; row++) {
          box(group, [1.2, 0.08, 1.15], [x, 0.6 + row * 0.58, -0.14], palette.gold);
          for (let book = 0; book < 5; book++) box(group, [0.16, 0.42 + (book % 2) * 0.08, 0.7], [x - 0.46 + book * 0.22, 0.9 + row * 0.58, 0.05], [palette.paper, palette.rust, palette.moss, palette.plum, palette.lime][book]!);
        }
      }
      cylinder(group, 1.1, 0.45, [0, 0.6, -0.2], palette.plum, 32);
      cylinder(group, 0.16, 1.45, [0, 1.4, -0.2], palette.gold, 12);
      const archiveScreen = screen(group, knowledgeTexture, [3.3, 1.9], [0, 2.1, -2.38], palette.plum);
      archiveScreen.rotation.x = -0.08;
      for (const x of [-1.4, 1.4]) beam(group, new THREE.Vector3(x, 0.3, -2.35), new THREE.Vector3(x, 1.3, -2.35), 0.06, palette.ink);
      const constellation = new THREE.Group();
      constellation.position.set(0, 3.3, -0.2);
      group.add(constellation);
      orbiters.push(constellation);
      sphere(constellation, 0.5, [0, 0, 0], palette.lime);
      const points: THREE.Vector3[] = [];
      for (let i = 0; i < 12; i++) {
        const angle = i * Math.PI * 2 / 12;
        const point = new THREE.Vector3(Math.cos(angle) * (1.5 + i % 2 * 0.5), Math.sin(angle * 2) * 1.05, Math.sin(angle) * 1.7);
        points.push(point);
        sphere(constellation, i % 3 ? 0.14 : 0.23, [point.x, point.y, point.z], [palette.plum, palette.moss, palette.gold][i % 3]!);
        line(constellation, [new THREE.Vector3(), point], palette.plum, 0.5);
      }
      points.forEach((point, i) => line(constellation, [point, points[(i + 3) % points.length]!], palette.gold, 0.55));
      const orbit = ring(constellation, 2.24, 0.021, [0, 0, 0], palette.plum);
      orbit.rotation.z = 0.45;
      const secondOrbit = ring(constellation, 2.05, 0.018, [0, 0, 0], palette.gold);
      secondOrbit.rotation.z = -0.9;
      plaque(group, ['ENTITIES / BELIEFS / DECISIONS'], [0, 0.85, 2.5], 4.2);
      for (const x of [-1.15, 1.15]) box(group, [0.14, 0.7, 0.14], [x, 0.45, 2.5], palette.ink);
      const telescope = new THREE.Group();
      telescope.position.set(-1.8, 1.1, 1.5);
      group.add(telescope);
      beam(telescope, new THREE.Vector3(-0.35, -0.8, 0), new THREE.Vector3(0, 0, 0), 0.06, palette.ink);
      beam(telescope, new THREE.Vector3(0.35, -0.8, 0.25), new THREE.Vector3(0, 0, 0), 0.06, palette.ink);
      beam(telescope, new THREE.Vector3(0, -0.8, -0.35), new THREE.Vector3(0, 0, 0), 0.06, palette.ink);
      beam(telescope, new THREE.Vector3(-0.5, 0.3, 0.45), new THREE.Vector3(0.6, 0.7, -0.55), 0.2, palette.gold);
    },
    workbench(group) {
      box(group, [6.9, 0.18, 5.5], [0, 0.18, 0], '#e2d4bd');
      box(group, [5.7, 3.2, 0.12], [0, 2.3, -1.95], palette.ink);
      for (let row = 0; row < 4; row++) for (let col = 0; col < 10; col++) sphere(group, 0.025, [-2.5 + col * 0.55, 1.2 + row * 0.6, -1.86], palette.moss);
      plaque(group, ['SKILLS / HOOKS / HANDOFFS'], [0, 3.57, -1.86], 4.5, palette.lime);
      const toolColors = [palette.rust, palette.gold, palette.teal, palette.plum];
      for (let i = 0; i < 4; i++) {
        const x = -1.95 + i * 1.3;
        ring(group, 0.2, 0.05, [x, 2.63, -1.75], toolColors[i]! ).rotation.x = 0;
        box(group, [0.09, 0.72, 0.1], [x, 2.14, -1.74], toolColors[i]!);
      }
      box(group, [6.2, 0.23, 2.2], [0, 1.35, 0.6], palette.gold);
      for (const x of [-2.2, 2.2]) {
        box(group, [1.1, 1.05, 1.45], [x, 0.73, 0.6], palette.forest);
        for (let i = 0; i < 3; i++) {
          box(group, [0.9, 0.27, 0.06], [x, 0.39 + i * 0.32, 1.35], palette.paper);
          box(group, [0.22, 0.045, 0.07], [x, 0.39 + i * 0.32, 1.4], palette.ink);
        }
      }
      [-1.45, 1.45].forEach((x, i) => {
        screen(group, textTexture([i === 0 ? 'metaclaude' : 'metacodex', 'shared practice', 'local setup'], { background: palette.ink, ink: palette.lime, font: 33, height: 280 }), [2, 1.24], [x, 2.18, 0.25]);
        box(group, [0.14, 0.6, 0.15], [x, 1.66, 0.15], palette.ink);
        box(group, [1.5, 0.06, 0.48], [x, 1.51, 1.11], palette.ink);
      });
      cylinder(group, 0.42, 0.1, [0, 0.85, 2.7], palette.rust, 24);
      cylinder(group, 0.075, 0.65, [0, 0.48, 2.7], palette.ink, 12);
      lamp(group, [-3, 0.3, -0.2], 3.2);
    },
    'small-tools'(group) {
      box(group, [6.8, 0.18, 5.9], [0, 0.18, 0], '#d2ddd3');
      box(group, [3.1, 2.6, 2.4], [-1.55, 1.6, -1.1], palette.teal);
      const roof = box(group, [3.4, 0.15, 2.85], [-1.55, 3, -1.1], palette.ink);
      roof.rotation.x = 0.1;
      screen(group, kitTexture, [2.7, 1.68], [-1.55, 1.96, 0.17]);
      plaque(group, ['KITFORGE / PRINT SHOP'], [-1.55, 0.7, 0.19], 2.5, palette.lime);
      box(group, [2.7, 0.2, 1.85], [1.75, 0.95, 1.2], palette.gold);
      for (const x of [0.75, 2.75]) box(group, [0.12, 0.65, 1.5], [x, 0.52, 1.2], palette.ink);
      const writing = screen(group, pencilTexture, [1.2, 1.55], [1.5, 1.19, 1.2]);
      writing.rotation.x = -Math.PI / 2 + 0.18;
      beam(group, new THREE.Vector3(2.34, 1.12, 0.5), new THREE.Vector3(2.34, 1.14, 1.7), 0.045, palette.rust);
      plaque(group, ['PENCIL PAGE'], [1.7, 0.66, 2.15], 1.8);
      const camera = new THREE.Group();
      camera.position.set(2.55, 2.2, -1.7);
      group.add(camera);
      box(camera, [1.1, 0.85, 0.65], [0, 0, 0], palette.rust);
      const lens = cylinder(camera, 0.28, 0.5, [0, 0, 0.48], palette.ink, 24);
      lens.rotation.x = Math.PI / 2;
      const glass = cylinder(camera, 0.2, 0.04, [0, 0, 0.75], palette.teal, 24);
      glass.rotation.x = Math.PI / 2;
      beam(group, new THREE.Vector3(2.55, 0.3, -1.7), new THREE.Vector3(2.55, 1.8, -1.7), 0.08, palette.ink);
      plaque(group, ['LEGOBRO'], [2.55, 0.7, -1.4], 1.55);
      for (let i = 0; i < 4; i++) box(group, [0.68, 0.04, 0.92], [-2.7 + i * 0.38, 0.31 + i * 0.055, 1.55], [palette.paper, palette.plum, palette.rust, palette.lime][i]! ).rotation.y = i * 0.15;
      plant(group, -3, -2.25, 0.55);
    },
  };

  districts.forEach((district, i) => {
    const group = new THREE.Group();
    group.position.set(...district.position);
    scene.add(group);
    cylinder(group, 4.45, 0.23, [0, 0.07, 0], '#c3ccb9', 64);
    cylinder(group, 4.32, 0.055, [0, 0.22, 0], palette.paper, 64);
    const selection = ring(group, 4.36, 0.065, [0, 0.28, 0], district.color);
    selection.material = new THREE.MeshBasicMaterial({ color: district.color, transparent: true, opacity: 0.38 });
    highlights.set(district.id, selection);
    const target = mesh(group, geometry('hit', () => new THREE.CylinderGeometry(4.25, 4.25, 5.2, 24)), new THREE.MeshBasicMaterial({ visible: false }), [0, 2.3, 0], false);
    target.userData.district = district.id;
    targets.push(target);
    anchors.set(district.id, new THREE.Vector3(district.position[0], 0.3, district.position[2] + 3.7));
    builders[district.id](group);
    const endpoint = new THREE.Vector3(...district.position).multiplyScalar(0.61);
    endpoint.y = 0.11;
    const start = endpoint.clone().normalize().multiplyScalar(2.25);
    start.y = 0.1;
    const bend = start.clone().lerp(endpoint, 0.5);
    bend.x += Math.sin(i) * 0.8;
    const curve = new THREE.QuadraticBezierCurve3(start, bend, endpoint);
    mesh(scene, new THREE.TubeGeometry(curve, 24, 0.1, 6, false), material('#b2bda5'), [0, 0, 0]);
    line(scene, curve.getPoints(40).map((point) => point.setY(0.22)), palette.chalk, 0.8);
    const pulse = sphere(scene, 0.1, [0, 0.2, 0], palette.lime);
    pulses.push({ mesh: pulse, curve, offset: i / 6, district: district.id });
  });
  for (let i = 0; i < 9; i++) {
    const angle = i * Math.PI * 2 / 9 + 0.16;
    plant(scene, Math.cos(angle) * 17.2, Math.sin(angle) * 17.2, 0.53 + i % 3 * 0.13);
    if (i % 2 === 0) lamp(scene, [Math.cos(angle + 0.12) * 16.9, 0.03, Math.sin(angle + 0.12) * 16.9], 1.7);
  }
  scene.updateMatrixWorld(true);
  const moving = new Set<THREE.Object3D>([...orbiters, ...highlights.values(), ...pulses.map((pulse) => pulse.mesh), ...targets]);
  moving.forEach((object) => object.traverse((child) => { if (child instanceof THREE.Mesh) child.castShadow = false; }));
  const batches = new Map<THREE.Material, THREE.Mesh[]>();
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || Array.isArray(object.material)) return;
    let ancestor: THREE.Object3D | null = object;
    while (ancestor) {
      if (moving.has(ancestor)) return;
      ancestor = ancestor.parent;
    }
    const batch = batches.get(object.material) ?? [];
    batch.push(object);
    batches.set(object.material, batch);
  });
  batches.forEach((objects, mat) => {
    if (objects.length < 2) return;
    const shapes = objects.map((object) => object.geometry.clone().applyMatrix4(object.matrixWorld));
    const merged = mergeGeometries(shapes, false);
    shapes.forEach((shape) => shape.dispose());
    if (!merged) return;
    objects.forEach((object) => {
      retiredGeometries.add(object.geometry);
      object.removeFromParent();
    });
    const batch = mesh(scene, merged, mat, [0, 0, 0]);
    batch.castShadow = objects.some((object) => object.castShadow);
    batch.receiveShadow = objects.some((object) => object.receiveShadow);
  });
  return {
    scene, targets, anchors, highlights,
    animate(time, active) {
      orbiters.forEach((group) => { group.rotation.y = time * 0.11; });
      pulses.forEach(({ mesh: object, curve, offset, district }) => {
        object.position.copy(curve.getPoint((time * 0.09 + offset) % 1));
        object.position.y = 0.25;
        object.scale.setScalar(active === district ? 1.6 : 0.75);
      });
      highlights.forEach((object, id) => {
        const mat = object.material as THREE.MeshBasicMaterial;
        mat.opacity = active === id ? 0.95 : 0.3;
      });
    },
    dispose() {
      disposed = true;
      const shapes = new Set<THREE.BufferGeometry>();
      const mats = new Set<THREE.Material>();
      geometries.forEach((shape) => shapes.add(shape));
      retiredGeometries.forEach((shape) => shapes.add(shape));
      materials.forEach((mat) => mats.add(mat));
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          shapes.add(object.geometry);
          (Array.isArray(object.material) ? object.material : [object.material]).forEach((mat) => mats.add(mat));
        }
      });
      shapes.forEach((shape) => shape.dispose());
      mats.forEach((mat) => mat.dispose());
      textures.forEach((texture) => texture.dispose());
      scene.clear();
    },
  };
}
