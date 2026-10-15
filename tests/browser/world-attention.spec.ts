import { test, expect, chromium, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AttentionScene } from '../../src/world/attention-task/scene';
import { initialView, reduceTask, taskHash } from '../../src/world/attention-task/model';
const execution = JSON.parse(readFileSync(new URL('../../src/labs/attention/execution.json', import.meta.url), 'utf8'));
const chapterTimes = [...readFileSync(new URL('../../src/labs/attention/model.ts', import.meta.url), 'utf8').matchAll(/\{ time: ([\d.]+), label:/g)].slice(0, 5).map(match => Number(match[1]));

test.use({ launchOptions: { args: ['--enable-unsafe-swiftshader'] } });
test.setTimeout(90_000);
const primary = (page: Page) => page.locator('[data-task-primary]');
async function ready(page: Page, hash = '') {
  await page.goto(`/world/${hash}`);
  await page.locator('[data-world-stage]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-world-state', 'ready');
}
async function enter(page: Page) { await page.locator('[data-open-task]').click(); await expect(page).toHaveURL(/#task\/attention\/waiting$/); }
async function state(page: Page, stage: string) { await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-task-stage', stage); await expect(page).toHaveURL(new RegExp(`#task/attention/${stage}$`)); }
async function build(page: Page) { for (const stage of ['chosen', 'returned', 'built']) { await primary(page).click(); await state(page, stage); } }
function sceneModuleURL() {
  const name = readdirSync(resolve(process.env.PORTFOLIO_DIST_ROOT ?? 'dist', '_astro')).find(name => /^scene\..*\.js$/.test(name) && readFileSync(resolve(process.env.PORTFOLIO_DIST_ROOT ?? 'dist', '_astro', name), 'utf8').includes('attention-output'));
  if (!name) throw new Error('The private build must contain the lazy task scene.');
  return `/_astro/${name}`;
}
type TaskGeometry = { stage: string; tilt: number; height: number; scale: number; left: number; right: number; leftVisible: boolean; rightVisible: boolean; resultVisible: boolean };
async function observeTaskGeometry(page: Page) {
  await page.evaluate(async moduleURL => {
    const { buildAttentionTask } = await import(moduleURL) as { buildAttentionTask: (invalidate: () => void) => AttentionScene };
    const probe = buildAttentionTask(() => {});
    const prototype = Object.getPrototypeOf(probe.scene) as AttentionScene['scene'];
    const original = prototype.onBeforeRender;
    const samples: TaskGeometry[] = [];
    prototype.onBeforeRender = function (...args: Parameters<typeof original>) {
      const output = this.getObjectByName('attention-output');
      if (output) {
        const left = this.getObjectByName('attention-left-fold')!, right = this.getObjectByName('attention-right-fold')!;
        samples.push({ stage: document.querySelector<HTMLElement>('[data-forge-world]')!.dataset.taskStage!, tilt: output.rotation.x, height: output.position.y, scale: output.scale.x, left: left.rotation.z, right: right.rotation.z, leftVisible: left.visible, rightVisible: right.visible, resultVisible: this.getObjectByName('attention-result')!.visible });
      }
      return original.apply(this, args);
    };
    probe.dispose();
    Object.assign(window, { readTaskGeometry: () => samples.slice(), clearTaskGeometry: () => { samples.length = 0; } });
  }, sceneModuleURL());
}
const geometrySamples = (page: Page) => page.evaluate(() => (window as unknown as { readTaskGeometry: () => TaskGeometry[] }).readTaskGeometry());

test('scene snaps commit fold and answer endpoints before subsequent ordinary invalidations', async ({ page }, info) => {
  await page.goto('/about-the-demos/');
  const result = await page.evaluate(async moduleURL => {
    const { buildAttentionTask } = await import(moduleURL) as { buildAttentionTask: (invalidate: () => void) => AttentionScene };
    const task = buildAttentionTask(() => {});
    const view = { stage: 'built' as 'waiting' | 'chosen' | 'returned' | 'built', dragProgress: 0, dragging: false, evidenceOpen: false, resultViewport: 'desktop' as const };
    const pose = () => { const output = task.scene.getObjectByName('attention-output')!, left = task.scene.getObjectByName('attention-left-fold')!, right = task.scene.getObjectByName('attention-right-fold')!; return { tilt: output.rotation.x, height: output.position.y, left: left.rotation.z, right: right.rotation.z, answer: task.scene.getObjectByName('attention-answer')!.position.toArray(), resultVisible: task.resultVisible }; };
    try {
      task.update(view, 0, true);
      view.stage = 'waiting'; task.update(view, 100, true); const waiting = pose();
      task.update(view, 116, true);
      const subsequent = [132, 148, 300, 900].map(time => ({ time, moving: task.update(view, time, false), pose: pose() }));
      const endpoints = (['chosen', 'returned', 'built', 'waiting'] as const).map((stage, index) => {
        view.stage = stage; const time = 1000 + index * 1000; task.update(view, time, true); const snapped = pose();
        return { stage, snapped, following: [16, 64, 800].map(offset => ({ moving: task.update(view, time + offset, false), pose: pose() })) };
      });
      return { waiting, subsequent, endpoints };
    } finally { task.dispose(); }
  }, sceneModuleURL());
  expect(result.waiting).toMatchObject({ tilt: 0, height: .35, left: 0, resultVisible: false }); expect(Math.abs(result.waiting.right)).toBe(0);
  for (const frame of result.subsequent) { expect(frame.pose).toEqual(result.waiting); expect(frame.moving).toBe(false); }
  for (const endpoint of result.endpoints) for (const frame of endpoint.following) { expect(frame.pose).toEqual(endpoint.snapped); expect(frame.moving).toBe(false); }
  await info.attach('committed-snap-endpoints', { body: JSON.stringify(result), contentType: 'application/json' });
});

test('the reducer guards ordering, duplicate returns, transient drag and unknown hashes', () => {
  let view = initialView();
  expect(reduceTask(view, { type: 'RETURN_ANSWER' })).toEqual(view);
  view = reduceTask(view, { type: 'REVEAL_CHOICE' });
  view = reduceTask(view, { type: 'BEGIN_DRAG' });
  expect(reduceTask(view, { type: 'DRAG', progress: 2 }).dragProgress).toBe(1);
  view = reduceTask(view, { type: 'EVIDENCE', open: true });
  expect(view.dragging).toBe(false); expect(view.stage).toBe('chosen');
  view = reduceTask(view, { type: 'RETURN_ANSWER' });
  expect(reduceTask(view, { type: 'RETURN_ANSWER' })).toEqual(view);
  expect(taskHash('#task/attention/unknown')).toBe('waiting');
  expect(taskHash('#task/unknown/built')).toBe('waiting');
  expect(taskHash('#memory/exhibit')).toBeNull();
});

test('three keyboard actions return one fixed answer to the same ticket and unfold the exact artifact', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const requests: { method: string; url: string }[] = [];
  page.on('request', request => requests.push({ method: request.method(), url: request.url() }));
  await ready(page);
  expect(requests.some(request => /media\/attention\/(question|workshop|execution)/.test(request.url))).toBe(false);
  await enter(page);
  for (const stage of ['chosen', 'returned', 'built']) {
    await primary(page).focus(); await page.keyboard.press('Enter'); await state(page, stage);
    await expect(page.locator('[data-task-ticket]')).toContainText(stage === 'chosen' ? 'Waiting' : stage === 'returned' ? execution.chosen_layout : 'Completed');
    await expect(page.locator('[data-task-card]')).toContainText('The choice and result are fixed; nothing is sent.');
    await expect(page.locator('[data-task-card]')).toContainText('automated Computer Use');
    await expect(page.locator('.world-task-ticket')).toHaveCount(1);
  }
  await expect(page.locator('[data-task-docked]')).toContainText(execution.chosen_layout);
  await expect(page.locator('[data-task-result-actions]')).toBeVisible();
  await primary(page).click();
  const proof = page.locator('[data-task-proof]');
  await expect(proof).toBeVisible();
  await expect(proof.locator('img')).toHaveAttribute('src', '/media/attention/workshop-desktop.png');
  await proof.locator('[data-task-result-viewport="phone"]').click();
  await expect(proof.locator('img')).toHaveAttribute('src', '/media/attention/workshop-phone.png');
  await proof.evaluate(element => { element.scrollTop = element.scrollHeight; });
  const close = (await proof.locator('[data-task-proof-close]').boundingBox())!;
  expect(close.y).toBeGreaterThanOrEqual(0); expect(close.y + close.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  const [download] = await Promise.all([page.waitForEvent('download'), proof.getByRole('link', { name: /Download the actual page/ }).click()]);
  expect(download.suggestedFilename()).toBe(execution.exhibit.artifact_download_name);
  const response = await page.request.get('/media/attention/workshop-source.txt');
  expect(response.headers()['content-type']).toContain('text/plain');
  expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(execution.actual_file.sha256);
  const film = await page.request.get('/media/attention/execution.mp4');
  expect(createHash('sha256').update(await film.body()).digest('hex')).toBe(execution.artifacts['execution.mp4'].sha256);
  await page.keyboard.press('Escape'); await expect(proof).toBeHidden(); await expect(primary(page)).toBeFocused();
  expect(requests.every(request => request.method === 'GET')).toBe(true);
  expect(requests.every(request => new URL(request.url).origin === new URL(page.url()).origin)).toBe(true);
  expect(requests.some(request => request.url.includes('/answered.png'))).toBe(false);
  await info.attach('built-experience', { body: await page.screenshot(), contentType: 'image/png' });
});

test('mouse drag, missed drop, cancellation and button return have equivalent durable outcomes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await ready(page); await enter(page); await primary(page).click();
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-task-draw-calls', /\d+/);
  const slip = page.locator('[data-task-slip]');
  let bounds = (await slip.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2); await page.mouse.down(); await page.mouse.move(bounds.x + 30, bounds.y + 100); await page.mouse.up();
  await state(page, 'chosen');
  bounds = (await slip.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2); await page.mouse.down();
  await slip.dispatchEvent('pointercancel', { pointerId: 1 }); await page.mouse.up(); await state(page, 'chosen');
  bounds = (await slip.boundingBox())!;
  const target = (await page.locator('[data-task-target]').boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2); await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 8 }); await page.mouse.up();
  await state(page, 'returned');
  await page.locator('[data-task-prev]').click(); await state(page, 'chosen'); await primary(page).click(); await state(page, 'returned');
  await page.locator('[data-task-prev]').click(); await slip.focus(); await page.keyboard.press('Enter'); await state(page, 'returned');
  await expect(page.locator('[data-task-docked]')).toHaveCount(1);
});

test('touch drag and a second finger cancel cleanly without requiring canvas gestures', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce', baseURL: test.info().project.use.baseURL });
  const page = await context.newPage(); await ready(page); await enter(page); await primary(page).click();
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-task-draw-calls', /\d+/);
  const cdp = await context.newCDPSession(page);
  const start = (await page.locator('[data-task-slip]').boundingBox())!, end = (await page.locator('[data-task-target]').boundingBox())!;
  const x = start.x + start.width / 2, y = start.y + start.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, x, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, x, y }, { id: 2, x: x - 20, y: y - 40 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await state(page, 'chosen');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 3, x, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 3, x: end.x + end.width / 2, y: end.y + end.height / 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await state(page, 'returned');
  await context.close();
});

test('history, comparison, evidence chapters, Escape and exit preserve the original exhibit and focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await ready(page, '#memory/exhibit');
  const positions = () => page.locator('[data-world-label]').evaluateAll(labels => labels.map(label => ['left', 'top'].map(key => Number(parseFloat((label as HTMLElement).style[key as 'left' | 'top']).toFixed(3)))));
  await page.waitForTimeout(300); const beforePositions = await positions();
  const invoking = page.locator('[data-open-task]'); await invoking.focus(); await enter(page); await build(page);
  await page.goBack(); await state(page, 'returned'); await page.goBack(); await state(page, 'chosen'); await page.goForward(); await state(page, 'returned');
  await page.locator('[data-task-watch]').click();
  const video = page.locator('[data-task-video]');
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime)).toBe(14);
  expect(await video.evaluate(element => (element as HTMLVideoElement).paused)).toBe(true);
  await expect(video.locator('track')).toHaveAttribute('src', '/media/attention/execution.vtt');
  for (const time of chapterTimes) { await page.locator(`[data-task-chapter="${time}"]`).click(); await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime)).toBe(time); expect(await video.evaluate(element => (element as HTMLVideoElement).paused)).toBe(true); }
  await page.keyboard.press('Escape'); await expect(page.locator('[data-task-watch]')).toBeFocused(); await state(page, 'returned');
  await primary(page).click(); await page.locator('[data-task-before]').click(); await state(page, 'waiting');
  await expect(page.locator('[data-task-compare]')).toContainText('Presentation comparison');
  await page.locator('[data-task-after]').click(); await state(page, 'built');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/#memory\/exhibit$/); await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-exhibit', 'memory'); await expect(invoking).toBeFocused();
  await expect.poll(positions).toEqual(beforePositions);
  await enter(page); await page.locator('[data-select-district="studio"]').click();
  await expect(page).toHaveURL(/#studio$/); await expect(page.locator('[data-task-card]')).toBeHidden();
});

for (const [width, height] of [[390, 844], [834, 900], [1440, 680]]) test(`task states and proof are readable and accessible at ${width} by ${height}`, async ({ page }, info) => {
  await page.setViewportSize({ width, height }); await page.emulateMedia({ reducedMotion: 'reduce' }); await ready(page); await enter(page);
  for (const stage of ['waiting', 'chosen', 'returned', 'built']) {
    if (stage !== 'waiting') await primary(page).click();
    await state(page, stage);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const action = (await primary(page).boundingBox())!, exit = (await page.locator('[data-task-exit]').boundingBox())!;
    expect(action.y + action.height).toBeLessThanOrEqual(height); expect(exit.y).toBeGreaterThanOrEqual(0);
    await info.attach(`task-${stage}-${width}`, { body: await page.screenshot(), contentType: 'image/png' });
  }
  let axe = await new AxeBuilder({ page }).analyze(); expect(axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
  await primary(page).click();
  axe = await new AxeBuilder({ page }).analyze(); expect(axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
  await info.attach(`actual-page-${width}`, { body: await page.screenshot(), contentType: 'image/png' });
});

test('direct built and unknown stage hashes reconstruct durable presentation state', async ({ page }) => {
  await ready(page, '#task/attention/built'); await state(page, 'built'); await expect(page.locator('[data-task-result-actions]')).toBeVisible();
  await page.locator('[data-task-replay]').click(); await state(page, 'waiting');
  await page.route('**/_astro/scene.*.js', route => route.abort());
  await ready(page, '?task-code-failure=1#task/attention/unknown'); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-task-stage', 'waiting');
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-task-scene', 'unavailable');
  await build(page); await primary(page).click(); await expect(page.locator('[data-task-result-image]')).toBeVisible();
});

test('blocked WebGL and no-JavaScript paths retain the entire explanation and exact evidence links', async ({ browser, page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof original>) { return String(args[0]).includes('webgl') ? null : original.apply(this, args); } as typeof original;
  });
  await page.goto('/world/'); await page.locator('[data-world-stage]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-world-state', 'fallback');
  await enter(page); await build(page); await primary(page).click(); await expect(page.locator('[data-task-result-image]')).toBeVisible();
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL: test.info().project.use.baseURL }); const plain = await context.newPage(); await plain.goto('/world/');
  const explanation = plain.locator('.world-task-static'); await explanation.locator('summary').click(); await expect(explanation.locator('li')).toHaveCount(4);
  await expect(explanation.getByRole('link', { name: 'Download the actual page' })).toHaveAttribute('href', '/media/attention/workshop-source.txt'); await expect(plain.locator('#districts .world-directory-card')).toHaveCount(6); await context.close();
});

async function instrument(page: Page) {
  await page.addInitScript(() => {
    const buffers = new Set<object>(), textures = new Set<object>();
    const listenerSets = new Map<EventTarget, Map<string, Set<EventListenerOrEventListenerObject>>>();
    const add = EventTarget.prototype.addEventListener, remove = EventTarget.prototype.removeEventListener;
    const track = (target: EventTarget) => target === window || target === document || target instanceof Element && (target.matches('[data-forge-world]') || Boolean(target.closest('[data-forge-world]')));
    EventTarget.prototype.addEventListener = function(type, callback, options) { if (callback && track(this)) { if (!listenerSets.has(this)) listenerSets.set(this, new Map()); const types = listenerSets.get(this)!; if (!types.has(type)) types.set(type, new Set()); types.get(type)!.add(callback); } return add.call(this, type, callback, options); };
    EventTarget.prototype.removeEventListener = function(type, callback, options) { if (callback) listenerSets.get(this)?.get(type)?.delete(callback); return remove.call(this, type, callback, options); };
    const probe = { draws: 0, frames: 0, calls: 0, triangles: 0 };
    const prototype = WebGL2RenderingContext.prototype;
    const own = (gl: WebGL2RenderingContext) => gl.canvas instanceof HTMLCanvasElement && gl.canvas.matches('[data-world-canvas]');
    for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced', 'clear'] as const) {
      const original = prototype[name]; Object.defineProperty(prototype, name, { configurable: true, value: function(this: WebGL2RenderingContext, ...args: number[]) {
        if (own(this)) { if (name === 'clear') { probe.frames++; probe.calls = probe.triangles = 0; } else { probe.draws++; probe.calls++; if (args[0] === this.TRIANGLES) probe.triangles += (name.includes('Elements') ? args[1]! : args[2]!) / 3 * (name.endsWith('Instanced') ? args[name === 'drawElementsInstanced' ? 4 : 3]! : 1); } }
        return Reflect.apply(original, this, args);
      } });
    }
    for (const [kind, live] of [['Buffer', buffers], ['Texture', textures]] as const) {
      const create = `create${kind}` as 'createBuffer' | 'createTexture', remove = `delete${kind}` as 'deleteBuffer' | 'deleteTexture';
      const originalCreate = prototype[create], originalRemove = prototype[remove];
      Object.defineProperty(prototype, create, { configurable: true, value: function(this: WebGL2RenderingContext) { const result = Reflect.apply(originalCreate, this, []); if (own(this) && result) live.add(result); return result; } });
      Object.defineProperty(prototype, remove, { configurable: true, value: function(this: WebGL2RenderingContext, object: object) { if (own(this)) live.delete(object); return Reflect.apply(originalRemove, this, [object]); } });
    }
    document.addEventListener('webglcontextlost', event => { if ((event.target as Element).matches?.('[data-world-canvas]')) { buffers.clear(); textures.clear(); } }, true);
    Object.assign(window, { attentionProbe: () => ({ ...probe, buffers: buffers.size, textures: textures.size, listeners: [...listenerSets.values()].reduce((total, types) => total + [...types.values()].reduce((count, callbacks) => count + callbacks.size, 0), 0) }) });
  });
}
const probe = (page: Page) => page.evaluate(() => (window as unknown as { attentionProbe: () => { draws: number; frames: number; calls: number; triangles: number; buffers: number; textures: number; listeners: number } }).attentionProbe());
async function stopped(page: Page) { await page.waitForTimeout(200); const before = await probe(page); await page.waitForTimeout(350); expect((await probe(page)).draws).toBe(before.draws); return before; }

test('the answer physically travels between the visible Mac and persistent ticket, then the real page opens and rests', async ({ page }, info) => {
  await instrument(page); await page.setViewportSize({ width: 1440, height: 1000 }); await ready(page); await enter(page); await primary(page).click();
  await page.waitForTimeout(1100);
  const from = await page.locator('[data-task-slip]').evaluate(element => parseFloat((element as HTMLElement).style.left));
  const destination = await page.locator('[data-task-target]').evaluate(element => parseFloat((element as HTMLElement).style.left));
  expect(from).toBeGreaterThan(destination + 100);
  await primary(page).click(); await page.waitForTimeout(180);
  const during = await page.locator('[data-task-docked]').evaluate(element => parseFloat((element as HTMLElement).style.left));
  expect(during).toBeLessThan(from); expect(during).toBeGreaterThan(destination);
  await info.attach('answer-in-transit', { body: await page.screenshot(), contentType: 'image/png' });
  await page.waitForTimeout(1000); await stopped(page); await expect(page.locator('[data-task-ticket]')).toContainText('Recorded answer returned');
  await primary(page).click(); await page.waitForTimeout(1100); await stopped(page);
  await info.attach('unfolded-and-resting', { body: await page.screenshot(), contentType: 'image/png' });
});

test('software WebGL budgets, ten replays, visibility, offscreen, persisted lifecycle and teardown stay bounded', async ({ page }, info) => {
  await instrument(page); await page.emulateMedia({ reducedMotion: 'reduce' }); await ready(page); await page.waitForLoadState('networkidle');
  const baseline = await probe(page); await enter(page); await build(page); await page.waitForLoadState('networkidle');
  const initial = await stopped(page); expect(initial.calls).toBeLessThanOrEqual(40); expect(initial.triangles).toBeLessThanOrEqual(30_000); expect(initial.textures - baseline.textures).toBeLessThanOrEqual(2);
  const cycles = [];
  for (let index = 0; index < 10; index++) {
    await page.locator('[data-task-exit]').click(); await enter(page); await build(page); const current = await stopped(page); expect(current.buffers).toBe(initial.buffers); expect(current.textures).toBe(initial.textures); expect(current.listeners).toBe(initial.listeners); cycles.push(current);
  }
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); }); await stopped(page);
  await page.evaluate(() => { Reflect.deleteProperty(document, 'hidden'); document.dispatchEvent(new Event('visibilitychange')); }); await stopped(page); await state(page, 'built');
  await page.locator('footer').scrollIntoViewIfNeeded(); await stopped(page); await page.locator('[data-world-canvas]').scrollIntoViewIfNeeded(); await stopped(page);
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))); await stopped(page); await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))); await stopped(page); await state(page, 'built');
  const retained = await probe(page); expect(retained.buffers).toBe(initial.buffers); expect(retained.textures).toBe(initial.textures);
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false }))); const disposed = await stopped(page); expect(disposed.buffers).toBe(0); expect(disposed.textures).toBe(0);
  await info.attach('software-webgl-resource-budgets', { body: JSON.stringify({ baseline, initial, cycles, retained, disposed }), contentType: 'application/json' });
});

test('actual WebGL loss retains the stage, usable HTML result and restored task scene', async ({ page }) => {
  await instrument(page); await page.emulateMedia({ reducedMotion: 'reduce' }); await ready(page); await enter(page); await primary(page).click();
  await page.evaluate(() => { const gl = document.querySelector<HTMLCanvasElement>('[data-world-canvas]')!.getContext('webgl2')!; const extension = gl.getExtension('WEBGL_lose_context')!; Object.assign(window, { taskLoss: extension }); extension.loseContext(); });
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-world-state', 'fallback'); await state(page, 'chosen');
  await primary(page).click(); await primary(page).click(); await state(page, 'built'); await primary(page).click(); await expect(page.locator('[data-task-proof]')).toBeVisible(); await page.keyboard.press('Escape');
  await page.evaluate(() => (window as unknown as { taskLoss: WEBGL_lose_context }).taskLoss.restoreContext()); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-world-state', 'ready'); await state(page, 'built'); await stopped(page);
});

test('actual browser BFCache restores the same retained built task document', async ({}, info) => {
  const browser = await chromium.launch({ channel: 'chromium', ignoreDefaultArgs: ['--disable-back-forward-cache'], args: ['--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ baseURL: info.project.use.baseURL, reducedMotion: 'reduce' });
    await page.addInitScript(() => { const token = crypto.randomUUID(); let persisted = false; addEventListener('pageshow', event => { persisted ||= event.persisted; }); Object.assign(window, { taskNavigation: () => ({ token, persisted }) }); });
    await ready(page); await enter(page); await build(page); await page.waitForLoadState('networkidle');
    const before = await page.evaluate(() => (window as unknown as { taskNavigation: () => { token: string } }).taskNavigation());
    await page.goto('/labs/attention/'); await page.goBack({ waitUntil: 'commit' }); await state(page, 'built');
    await expect.poll(() => page.evaluate(() => (window as unknown as { taskNavigation: () => { persisted: boolean } }).taskNavigation().persisted)).toBe(true);
    expect((await page.evaluate(() => (window as unknown as { taskNavigation: () => { token: string } }).taskNavigation())).token).toBe(before.token);
  } finally { await browser.close(); }
});

async function labelsFit(page: Page) {
  return page.locator('[data-task-overlay]').evaluate(overlay => {
    const viewport = document.querySelector('[data-world-viewport]')!.getBoundingClientRect();
    const labels = [...overlay.querySelectorAll<HTMLElement>('[data-task-anchor]')].filter(element => !element.hidden).map(element => ({ key: element.dataset.taskAnchor!, box: element.getBoundingClientRect().toJSON() }));
    const overlap = (a: DOMRect, b: DOMRect) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
    const ticket = labels.find(label => label.key === 'ticket')!;
    const answer = labels.find(label => label.key === 'slip');
    const target = labels.find(label => label.key === 'target');
    return { viewport: viewport.toJSON(), labels, clipped: labels.filter(label => label.box.left < viewport.left - 1 || label.box.right > viewport.right + 1 || label.box.top < viewport.top - 1 || label.box.bottom > viewport.bottom + 1).map(label => label.key), ticketCovered: labels.some(label => label !== ticket && overlap(ticket.box, label.box)), answerCoversTarget: Boolean(answer && target && overlap(answer.box, target.box)) };
  });
}

for (const [width, height] of [[390, 844], [834, 900], [834, 1000], [900, 1000], [1440, 680], [1440, 1000]]) test(`normal-motion task framing and causal labels survive exhibit entry at ${width} by ${height}`, async ({ page }, info) => {
  await page.setViewportSize({ width, height });
  await ready(page); await enter(page);
  const normal = (await page.locator('[data-world-viewport]').boundingBox())!;
  await page.locator('[data-task-exit]').click();
  await page.locator('[data-select-district="studio"]').click(); await page.locator('[data-open-exhibit="studio"]').click();
  await enter(page);
  const fromExhibit = (await page.locator('[data-world-viewport]').boundingBox())!;
  expect(Math.abs(fromExhibit.width - normal.width)).toBeLessThan(1); expect(Math.abs(fromExhibit.height - normal.height)).toBeLessThan(1);
  for (const phase of ['waiting', 'chosen', 'returned', 'built']) {
    if (phase !== 'waiting') await primary(page).click();
    await state(page, phase); await page.waitForTimeout(900);
    const bounds = await labelsFit(page);
    expect(bounds.clipped, JSON.stringify(bounds)).toEqual([]);
    expect(bounds.ticketCovered, JSON.stringify(bounds)).toBe(false);
    expect(bounds.answerCoversTarget, JSON.stringify(bounds)).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const action = (await primary(page).boundingBox())!, exit = (await page.locator('[data-task-exit]').boundingBox())!;
    expect(action.y + action.height).toBeLessThanOrEqual(height); expect(exit.y).toBeGreaterThanOrEqual(0);
    await info.attach(`review-fix-${width}x${height}-${phase}`, { body: await page.screenshot(), contentType: 'image/png' });
  }
  await page.locator('[data-task-exit]').click(); await expect(page).toHaveURL(/#studio\/exhibit$/);
  await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-exhibit', 'studio');
});

for (const origin of ['#memory/exhibit', '#studio/exhibit', '#engines', '']) test(`task exit, history re-entry, second exit and reload preserve origin ${origin || 'overview'}`, async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await ready(page, origin); await page.waitForTimeout(1800);
  const expected = await page.locator('[data-world-stage]').evaluate(element => ({ selected: (element as HTMLElement).dataset.selected, exhibit: (element as HTMLElement).dataset.exhibit }));
  await enter(page); await build(page); await page.waitForTimeout(900);
  const returned = async () => {
    expect(new URL(page.url()).hash).toBe(origin);
    await expect(page.locator('[data-task-card]')).toBeHidden();
    await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-selected', expected.selected!);
    await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-exhibit', expected.exhibit!);
    expect(await page.evaluate(() => Boolean(history.state?.worldTask || history.state?.worldTaskOrigin))).toBe(false);
  };
  await page.locator('[data-task-exit]').click(); await returned();
  await page.goBack(); await state(page, 'built'); await page.goForward(); await returned();
  await page.goBack(); await state(page, 'built'); await page.locator('[data-task-exit]').click(); await returned();
  await page.goBack(); await state(page, 'built'); await page.reload(); await state(page, 'built');
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-world-state', 'ready');
  await page.locator('[data-task-exit]').click(); await returned();
  await page.reload(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-world-state', 'ready'); await returned();
});

test('normal-motion fresh entry, replay and backward reconstruction conceal the retained result immediately', async ({ page }, info) => {
  await ready(page); await observeTaskGeometry(page); await enter(page); await build(page); await page.waitForTimeout(950);
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-task-result-visible', 'true');
  const concealed = async () => {
    expect(await page.locator('[data-forge-world]').evaluate(root => getComputedStyle(root.querySelector('[data-world-canvas]')!).visibility === 'hidden' || (root as HTMLElement).dataset.taskResultVisible === 'false')).toBe(true);
    await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-task-result-visible', 'false');
  };
  const folded = async (phase: string) => {
    await expect.poll(async () => (await geometrySamples(page)).filter(sample => sample.stage === phase).length).toBeGreaterThan(0);
    for (const sample of (await geometrySamples(page)).filter(sample => sample.stage === phase)) {
      expect(sample.tilt).toBe(0); expect(sample.height).toBe(.35); expect(sample.scale).toBe(.65); expect(sample.left).toBe(0);
      expect(Math.abs(sample.right)).toBeLessThanOrEqual(.1); expect(sample.leftVisible && sample.rightVisible).toBe(true); expect(sample.resultVisible).toBe(false);
    }
  };
  await page.evaluate(() => (window as unknown as { clearTaskGeometry: () => void }).clearTaskGeometry());
  await page.locator('[data-task-exit]').click(); await enter(page); await concealed();
  await page.setViewportSize({ width: 1281, height: 720 }); await folded('waiting');
  await page.locator('[data-task-watch]').click(); await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1280, height: 720 }); await page.waitForTimeout(150); await folded('waiting');
  await info.attach('review-fix-fresh-waiting', { body: await page.screenshot(), contentType: 'image/png' });
  for (const phase of ['chosen', 'returned']) { await primary(page).click(); await state(page, phase); await concealed(); await folded(phase); }
  await primary(page).click(); await page.waitForTimeout(950); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-task-result-visible', 'true');
  await page.locator('[data-task-replay]').click(); await state(page, 'waiting'); await concealed(); await page.setViewportSize({ width: 1281, height: 720 }); await folded('waiting');
  await build(page); await page.waitForTimeout(950); await page.locator('[data-task-prev]').click(); await state(page, 'returned'); await concealed();
  await page.locator('[data-task-watch]').click(); await page.keyboard.press('Escape'); await page.setViewportSize({ width: 1280, height: 720 }); await page.waitForTimeout(150); await folded('returned');
  await info.attach('rendered-folder-geometry', { body: JSON.stringify(await geometrySamples(page)), contentType: 'application/json' });
});

test('proof context follows chosen chapters and real playback across the separate updated-app observation', async ({ page }) => {
  await ready(page); await enter(page); await build(page); await page.locator('[data-task-watch]').click();
  const video = page.locator('[data-task-video]'), title = page.locator('[data-task-proof-title]');
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime)).toBe(chapterTimes[4]);
  await expect(title).toContainText('The actual page');
  await page.locator('[data-task-chapter="7"]').click();
  await expect(title).toContainText('The native choice'); await expect(page.locator('[data-task-chapter="7"]')).toHaveAttribute('aria-current', 'step');
  expect(await video.evaluate(element => (element as HTMLVideoElement).paused)).toBe(true);
  await video.evaluate(async element => { const video = element as HTMLVideoElement; video.muted = true; video.currentTime = 6.75; await video.play(); });
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime)).toBeGreaterThan(7.05);
  await expect(title).toContainText('The native choice');
  await video.evaluate(async element => { const video = element as HTMLVideoElement; video.currentTime = 40.75; await video.play(); });
  await expect(title).toContainText('The updated Mac app');
  await expect(page.locator('[data-task-proof-context]')).toContainText('Separate updated-app observation');
  await expect(page.locator('[data-task-chapter][aria-current]')).toHaveCount(0);
  await page.locator(`[data-task-chapter="${chapterTimes[4]}"]`).click();
  await expect(title).toContainText('The actual page'); await expect(page.locator('[data-task-proof-context]')).not.toContainText('Separate updated-app');
  await state(page, 'built'); expect(await video.evaluate(element => (element as HTMLVideoElement).paused)).toBe(true);
});

test('a readable-map anchor retains its selected World context through task history and task reload', async ({ page }) => {
  await ready(page, '#memory/exhibit');
  await page.locator('a[href="#districts"]').first().click(); await expect(page).toHaveURL(/#districts$/);
  await enter(page); await build(page); await page.locator('[data-task-exit]').click();
  await expect(page).toHaveURL(/#districts$/); await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-exhibit', 'memory');
  await page.goBack(); await state(page, 'built'); await page.reload(); await state(page, 'built');
  await page.locator('[data-task-exit]').click(); await expect(page).toHaveURL(/#districts$/);
  await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-exhibit', 'memory');
});
