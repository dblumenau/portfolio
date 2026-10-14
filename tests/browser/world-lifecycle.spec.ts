import { test, expect, chromium, type Page } from '@playwright/test';

// These assertions inspect real WebGL calls, including software WebGL in headless Chromium.
// Dispatching lifecycle events exercises the handlers; it does not prove browser BFCache eligibility.
test.use({ launchOptions: { args: ['--enable-unsafe-swiftshader'] } });
test.setTimeout(90_000);

type Probe = {
  draws: number;
  frames: number;
  canvasResizes: number;
  framebufferCreates: number;
  framebufferDeletes: number;
  buffers: number;
  textures: number;
};

async function instrument(page: Page) {
  await page.addInitScript(() => {
    const liveBuffers = new Set<WebGLBuffer>();
    const liveTextures = new Set<WebGLTexture>();
    const probe = { draws: 0, frames: 0, canvasResizes: 0, framebufferCreates: 0, framebufferDeletes: 0 };
    const isWorld = (gl: WebGL2RenderingContext) => gl.canvas instanceof HTMLCanvasElement && gl.canvas.matches('[data-world-canvas]');
    const prototype = WebGL2RenderingContext.prototype;
    for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced', 'clear'] as const) {
      const original = prototype[name];
      Object.defineProperty(prototype, name, { configurable: true, value: function (this: WebGL2RenderingContext, ...args: unknown[]) {
        if (isWorld(this)) probe[name === 'clear' ? 'frames' : 'draws']++;
        return Reflect.apply(original, this, args);
      } });
    }
    for (const [name, set] of [['Buffer', liveBuffers], ['Texture', liveTextures]] as const) {
      const createName = `create${name}` as 'createBuffer' | 'createTexture';
      const deleteName = `delete${name}` as 'deleteBuffer' | 'deleteTexture';
      const create = prototype[createName];
      const remove = prototype[deleteName];
      Object.defineProperty(prototype, createName, { configurable: true, value: function (this: WebGL2RenderingContext) {
        const object = Reflect.apply(create, this, []);
        if (object && isWorld(this)) (set as Set<object>).add(object);
        return object;
      } });
      Object.defineProperty(prototype, deleteName, { configurable: true, value: function (this: WebGL2RenderingContext, object: object) {
        if (isWorld(this)) (set as Set<object>).delete(object);
        return Reflect.apply(remove, this, [object]);
      } });
    }
    for (const name of ['createFramebuffer', 'deleteFramebuffer'] as const) {
      const original = prototype[name];
      Object.defineProperty(prototype, name, { configurable: true, value: function (this: WebGL2RenderingContext, ...args: unknown[]) {
        if (isWorld(this)) probe[name === 'createFramebuffer' ? 'framebufferCreates' : 'framebufferDeletes']++;
        return Reflect.apply(original, this, args);
      } });
    }
    for (const name of ['width', 'height'] as const) {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, name)!;
      Object.defineProperty(HTMLCanvasElement.prototype, name, { ...descriptor, set(this: HTMLCanvasElement, value: number) {
        if (this.matches('[data-world-canvas]')) probe.canvasResizes++;
        descriptor.set!.call(this, value);
      } });
    }
    document.addEventListener('webglcontextlost', event => {
      if (event.target instanceof HTMLCanvasElement && event.target.matches('[data-world-canvas]')) {
        liveBuffers.clear();
        liveTextures.clear();
      }
    }, true);
    Object.assign(window, { readWorldProbe: () => ({ ...probe, buffers: liveBuffers.size, textures: liveTextures.size }) });
  });
}
async function probe(page: Page): Promise<Probe> {
  return page.evaluate(() => (window as unknown as { readWorldProbe: () => Probe }).readWorldProbe());
}
async function ready(page: Page) {
  await page.goto('/world/');
  await page.locator('[data-world-viewport]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-world-state', 'ready');
  await expect.poll(async () => (await probe(page)).draws).toBeGreaterThan(0);
}
async function expectStopped(page: Page) {
  await page.waitForTimeout(150);
  const before = await probe(page);
  await page.waitForTimeout(500);
  expect((await probe(page)).draws).toBe(before.draws);
  return before;
}
async function expectMoving(page: Page) {
  const before = await probe(page);
  await expect.poll(async () => (await probe(page)).draws).toBeGreaterThan(before.draws);
}

test('a phone canvas pauses while its long district remains visible and resumes when the canvas returns', async ({ browser }, info) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const page = await context.newPage();
  await instrument(page);
  await ready(page);
  const dimensions = await page.locator('[data-world-canvas]').evaluate(element => {
    const canvas = element as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    return { width: canvas.width, height: canvas.height, cssWidth: rect.width, cssHeight: rect.height };
  });
  expect(dimensions.width).toBe(Math.floor(dimensions.cssWidth * 1.6));
  expect(dimensions.height).toBe(Math.floor(dimensions.cssHeight * 1.6));
  await page.locator('[data-select-district="studio"]').click();
  await page.evaluate(() => window.scrollTo({ top: scrollY + document.querySelector('[data-world-canvas]')!.getBoundingClientRect().bottom + 200, behavior: 'instant' }));
  const geometry = await page.evaluate(() => {
    const canvas = document.querySelector('[data-world-canvas]')!.getBoundingClientRect();
    const stage = document.querySelector('[data-world-stage]')!.getBoundingClientRect();
    return { canvasBottom: canvas.bottom, stageTop: stage.top, stageBottom: stage.bottom, viewportHeight: innerHeight };
  });
  expect(geometry.canvasBottom).toBeLessThan(-160);
  expect(geometry.stageBottom).toBeGreaterThan(0);
  expect(geometry.stageTop).toBeLessThan(geometry.viewportHeight);
  const stopped = await expectStopped(page);
  await info.attach('offscreen-geometry-and-gl', { body: JSON.stringify({ geometry, stopped, dimensions }), contentType: 'application/json' });
  await page.locator('[data-world-canvas]').scrollIntoViewIfNeeded();
  await expectMoving(page);
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-selected', 'studio');
  await context.close();
});

test('visibility suspension also gates late texture uploads and rendering resumes on visibility return', async ({ page }, info) => {
  await instrument(page);
  let releaseTextures!: () => void;
  const gate = new Promise<void>(resolve => { releaseTextures = resolve; });
  await page.route('**/media/*.webp', async route => { await gate; await route.continue(); });
  await ready(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const before = await expectStopped(page);
  releaseTextures();
  await page.waitForLoadState('networkidle');
  const after = await expectStopped(page);
  expect(after.draws).toBe(before.draws);
  await info.attach('simulated-visibility-late-textures', { body: JSON.stringify({ before, after }), contentType: 'application/json' });
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'hidden');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expectMoving(page);
});

test('actual WebGL context loss and restoration resume the same district and media exhibit', async ({ page }, info) => {
  await instrument(page);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await ready(page);
  await page.locator('[data-select-district="memory"]').click();
  await page.locator('[data-open-exhibit="memory"]').click();
  await expect(page).toHaveURL(/#memory\/exhibit$/);
  await page.evaluate(() => {
    const gl = document.querySelector<HTMLCanvasElement>('[data-world-canvas]')!.getContext('webgl2')!;
    const extension = gl.getExtension('WEBGL_lose_context')!;
    Object.assign(window, { worldLossExtension: extension });
    extension.loseContext();
  });
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-world-state', 'fallback');
  await expect(page.locator('[data-world-status]')).toContainText('view recovers');
  await expectStopped(page);
  await page.evaluate(() => (window as unknown as { worldLossExtension: WEBGL_lose_context }).worldLossExtension.restoreContext());
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-world-state', 'ready');
  await page.locator('[data-world-canvas]').scrollIntoViewIfNeeded();
  await expectMoving(page);
  await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-exhibit', 'memory');
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-selected', 'memory');
  await expect(page).toHaveURL(/#memory\/exhibit$/);
  await expect(page.locator('[data-world-status]')).toBeHidden();
  expect(errors).toEqual([]);
  await info.attach('restored-world', { body: await page.screenshot(), contentType: 'image/png' });
});

test('simulated persisted page transitions preserve camera, selection and GPU allocations across three returns', async ({ page }, info) => {
  await instrument(page);
  await ready(page);
  await page.locator('[data-select-district="memory"]').click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  const initial = await probe(page);
  const positions = () => page.locator('[data-world-label]').evaluateAll(labels => labels.map(label => `${(label as HTMLElement).style.left}:${(label as HTMLElement).style.top}`));
  const beforePositions = await positions();
  const cycles: Probe[] = [];
  for (let index = 0; index < 3; index++) {
    await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    await expectStopped(page);
    await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    await expectMoving(page);
    const after = await probe(page);
    expect(after.framebufferCreates).toBe(initial.framebufferCreates);
    expect(after.framebufferDeletes).toBe(initial.framebufferDeletes);
    expect(after.buffers).toBe(initial.buffers);
    expect(after.textures).toBe(initial.textures);
    expect(await positions()).toEqual(beforePositions);
    await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-selected', 'memory');
    cycles.push(after);
  }
  await info.attach('simulated-persisted-transitions', { body: JSON.stringify({ initial, cycles }), contentType: 'application/json' });
});

test('non-persisted teardown releases mesh buffers, textures and the shadow framebuffer and removes input effects', async ({ page }, info) => {
  await instrument(page);
  await ready(page);
  await page.waitForLoadState('networkidle');
  const before = await probe(page);
  expect(before.buffers).toBeGreaterThan(0);
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
  const after = await expectStopped(page);
  expect(after.buffers).toBe(0);
  expect(after.textures).toBe(0);
  expect(await page.locator('[data-world-canvas]').evaluate(element => (element as HTMLCanvasElement).getContext('webgl2')!.isContextLost())).toBe(true);
  expect(after.framebufferDeletes - before.framebufferDeletes).toBe(1);
  expect(after.textures).toBeLessThan(before.textures);
  const url = page.url();
  await page.locator('[data-select-district="memory"]').evaluate(element => (element as HTMLElement).click());
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.keyboard.press('Escape');
  await expectStopped(page);
  expect(page.url()).toBe(url);
  expect((await probe(page)).buffers).toBe(0);
  await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-selected', '');
  await info.attach('teardown-resources', { body: JSON.stringify({ before, after }), contentType: 'application/json' });
});

test('unchanged district layout avoids drawing-buffer resets while a real resize updates it', async ({ page }, info) => {
  await instrument(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await ready(page);
  await page.locator('[data-select-district="memory"]').click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  const before = await probe(page);
  for (let index = 0; index < 4; index++) await page.locator('[data-select-district="memory"]').evaluate(element => (element as HTMLElement).click());
  await page.waitForTimeout(300);
  const unchanged = await probe(page);
  expect(unchanged.canvasResizes).toBe(before.canvasResizes);
  await page.setViewportSize({ width: 834, height: 1000 });
  await expect.poll(async () => (await probe(page)).canvasResizes).toBeGreaterThan(before.canvasResizes);
  const dimensions = await page.locator('[data-world-canvas]').evaluate(element => {
    const canvas = element as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    return { width: canvas.width, height: canvas.height, cssWidth: rect.width, cssHeight: rect.height };
  });
  expect(dimensions.width).toBe(Math.floor(dimensions.cssWidth));
  expect(dimensions.height).toBe(Math.floor(dimensions.cssHeight));
  await expectMoving(page);
  await info.attach('resize-and-unchanged-layout', { body: JSON.stringify({ before, unchanged, dimensions }), contentType: 'application/json' });
});

test.describe('browser BFCache restoration', () => {
  // Full Chromium supports BFCache in headless mode; Chromium's headless shell does not.
  test('actual back navigation restores the retained document, exhibit and live world', async ({}, info) => {
    const browser = await chromium.launch({ channel: 'chromium', ignoreDefaultArgs: ['--disable-back-forward-cache'], args: ['--enable-unsafe-swiftshader'] });
    const context = await browser.newContext({ baseURL: info.project.use.baseURL, viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    try {
      await instrument(page);
      await page.addInitScript(() => {
        const transitions: { event: string; persisted: boolean }[] = [];
        const token = crypto.randomUUID();
        for (const event of ['pagehide', 'pageshow']) window.addEventListener(event, value => transitions.push({ event, persisted: (value as PageTransitionEvent).persisted }));
        Object.assign(window, { readWorldNavigation: () => ({ token, transitions }) });
      });
      const navigation = () => page.evaluate(() => (window as unknown as { readWorldNavigation: () => { token: string; transitions: { event: string; persisted: boolean }[] } }).readWorldNavigation());
      await ready(page);
      await page.locator('[data-select-district="memory"]').click();
      await page.locator('[data-open-exhibit="memory"]').click();
      await page.waitForLoadState('networkidle');
      const before = await navigation();
      await page.goto('/work/knowledge-graph/');
      await page.goBack({ waitUntil: 'commit' });
      await expect(page).toHaveURL(/#memory\/exhibit$/);
      await expect.poll(async () => (await navigation()).transitions.some(event => event.event === 'pageshow' && event.persisted)).toBe(true);
      const after = await navigation();
      expect(after.token).toBe(before.token);
      expect(after.transitions).toContainEqual({ event: 'pagehide', persisted: true });
      await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-world-state', 'ready');
      await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-exhibit', 'memory');
      await expectMoving(page);
      await info.attach('actual-bfcache-events', { body: JSON.stringify({ before, after, gl: await probe(page) }), contentType: 'application/json' });
    } finally {
      await browser.close();
    }
  });
});
