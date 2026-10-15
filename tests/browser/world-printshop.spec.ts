import { test, expect, chromium, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';

test.use({ launchOptions: { args: ['--enable-unsafe-swiftshader'] } });
test.setTimeout(90_000);
const pullButton = (page: Page) => page.locator('.world-shop-pull');
async function ready(page: Page, hash = '#printshop') {
  await page.goto(`/world/${hash}`); await page.locator('[data-world-stage]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-preparation', 'ready', { timeout: 30_000 });
  await expect(pullButton(page)).toBeEnabled();
}
async function captureEncoding(page: Page) {
  await page.addInitScript(() => {
    const samples: { rgb: Uint8ClampedArray; width: number; height: number; blob: Blob }[] = [];
    Object.assign(window, { shopEncodingSamples: samples });
    const keep = async (canvas: HTMLCanvasElement | OffscreenCanvas, encode: () => Promise<Blob>) => {
      const context = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
      const rgb = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const blob = await encode(); samples.push({ rgb, width: canvas.width, height: canvas.height, blob }); return blob;
    };
    if (typeof OffscreenCanvas !== 'undefined') {
      const encode = OffscreenCanvas.prototype.convertToBlob;
      OffscreenCanvas.prototype.convertToBlob = function(options) { return keep(this, () => encode.call(this, options)); };
    }
    const encode = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
      void keep(this, () => new Promise<Blob>((resolve, reject) => encode.call(this, blob => blob ? resolve(blob) : reject(new Error('Encoding failed')), type, quality))).then(callback);
    };
  });
}
async function pull(page: Page, count: number) { await pullButton(page).click(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', String(count)); }
async function imageProof(page: Page, slot: number, sample: number) {
  const href = await page.locator(`[data-shop-slot="${slot}"] [data-shop-download]`).getAttribute('href');
  return page.evaluate(async ({ href, sample }) => {
    const expected = (window as unknown as { shopEncodingSamples: { rgb: Uint8ClampedArray; width: number; height: number; blob: Blob }[] }).shopEncodingSamples[sample]!;
    const response = await fetch(href!); const blob = await response.blob(); const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
    const context = canvas.getContext('2d')!; context.drawImage(bitmap, 0, 0); bitmap.close();
    const actual = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let mismatch = 0; const colors = new Set<number>();
    for (let index = 0; index < actual.length; index += 4) { if (actual[index] !== expected.rgb[index] || actual[index + 1] !== expected.rgb[index + 1] || actual[index + 2] !== expected.rgb[index + 2]) mismatch++; colors.add(actual[index]! << 16 | actual[index + 1]! << 8 | actual[index + 2]!); }
    const bytes = await blob.arrayBuffer(); const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('');
    const encoded = await expected.blob.arrayBuffer(); const expectedBytes = new Uint8Array(encoded);
    return { mismatch, width: canvas.width, height: canvas.height, colors: colors.size, hash, bytesEqual: new Uint8Array(bytes).every((value, index) => value === expectedBytes[index]), href };
  }, { href, sample });
}

test('real PNGs match their frozen RGB proofs and the first print survives edits, a second print and explicit replacement', async ({ page }, info) => {
  await captureEncoding(page); const requests: string[] = []; page.on('request', request => { if (request.url().startsWith('http')) { expect(request.method()).toBe('GET'); requests.push(request.url()); } });
  await ready(page); await page.locator('[data-shop-field="headline"]').fill('Mød mig i værkstedet');
  await page.locator('[data-shop-look="amber-pulse"]').click(); await expect(page.locator('[data-shop-draft-look]')).toContainText('Amber');
  await pull(page, 1); const first = await imageProof(page, 0, 0);
  expect(first).toMatchObject({ mismatch: 0, width: 1080, height: 1080, bytesEqual: true }); expect(first.colors).toBeGreaterThan(100);
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('[data-shop-slot="0"] [data-shop-download]').click()]);
  expect(download.suggestedFilename()).toBe('small-edition-print-1.png'); expect(createHash('sha256').update(await readFile((await download.path())!)).digest('hex')).toBe(first.hash);
  await page.locator('[data-shop-field="headline"]').fill('Plads til næste idé'); await page.locator('[data-shop-field="smallLine"]').fill('Æble, øer og åben himmel.');
  await page.locator('[data-shop-look="cyber-teal"]').click(); await page.locator('[data-shop-arrangement="center"]').click();
  await expect(page.locator('[data-shop-draft-look]')).toContainText('Teal'); await pull(page, 2);
  const second = await imageProof(page, 1, 1); expect(second.mismatch).toBe(0); expect(second.hash).not.toBe(first.hash);
  for (const slot of [1, 1, 0]) {
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator(`[data-shop-slot="${slot}"] [data-shop-download]`).click()]);
    expect(createHash('sha256').update(await readFile((await download.path())!)).digest('hex')).toBe(slot === 0 ? first.hash : second.hash);
  }
  expect((await imageProof(page, 0, 0)).hash).toBe(first.hash); await expect(pullButton(page)).toBeDisabled();
  await page.locator('[data-shop-replace-slot="1"]').click(); await page.locator('[data-shop-field="headline"]').fill('Et tredje aftryk, kun her');
  await pull(page, 2); await expect(page.locator('[data-shop-summary="1"]')).toContainText('Et tredje aftryk'); await expect.poll(async () => (await imageProof(page, 1, 2)).mismatch).toBe(0);
  expect((await imageProof(page, 0, 0)).hash).toBe(first.hash); expect((await imageProof(page, 1, 2)).hash).not.toBe(second.hash);
  expect(await page.evaluate(() => JSON.stringify(history.state))).not.toMatch(/Mød|værkstedet|næste|blob:/);
  expect(requests.some(url => /exportMp4|mp4-muxer/.test(url))).toBe(false);
  await info.attach('real-png-rgb-and-immutability', { body: JSON.stringify({ first, second }), contentType: 'application/json' });
});

test('empty headline cannot print placeholder words; HTML canvas fallback produces a real exact PNG', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'OffscreenCanvas', { configurable: true, value: undefined }); });
  await captureEncoding(page); await ready(page); await page.locator('[data-shop-field="headline"]').fill('   ');
  await expect(pullButton(page)).toBeDisabled(); await expect(pullButton(page)).toHaveText('Add a headline');
  const longHeadline = 'Æbleøer åbner idéer '.repeat(4).slice(0, 60);
  await page.locator('[data-shop-field="headline"]').fill(longHeadline); await page.locator('[data-shop-field="smallLine"]').fill(''); await pull(page, 1);
  await expect(page.locator('[data-shop-summary="0"]')).toContainText(longHeadline.trim());
  expect(await imageProof(page, 0, 0)).toMatchObject({ mismatch: 0, width: 1080, height: 1080, bytesEqual: true });
});

test('without World or shader WebGL, the native form and labelled simple-background PNG still work', async ({ page }) => {
  await page.addInitScript(() => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, ...args: Parameters<typeof original>) { return String(args[0]).includes('webgl') ? null : original.apply(this, args); } as typeof original; });
  await captureEncoding(page); await ready(page); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-world-state', 'fallback');
  await expect(page.locator('[data-shop-look-note]')).toContainText('Simple background on this device');
  await page.locator('[data-shop-field="headline"]').fill('En rigtig lille tryksag'); await pull(page, 1);
  expect(await imageProof(page, 0, 0)).toMatchObject({ mismatch: 0, width: 1080, height: 1080, bytesEqual: true });
  await page.locator('[data-shop-slot="0"] [data-shop-inspect]').click(); await expect(page.locator('[data-shop-proof]')).toBeVisible();
});

async function hashPrint(page: Page, slot: number) {
  const href = await page.locator(`[data-shop-slot="${slot}"] [data-shop-download]`).getAttribute('href');
  return page.evaluate(async href => [...new Uint8Array(await crypto.subtle.digest('SHA-256', await (await fetch(href!)).arrayBuffer()))].map(byte => byte.toString(16).padStart(2, '0')).join(''), href);
}
async function enterFromWorld(page: Page, hash = '#small-tools') {
  await page.goto(`/world/${hash}`); await page.locator('[data-world-stage]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-world-state', 'ready');
  await page.locator('[data-district-detail="small-tools"] [data-open-printshop]').click();
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-preparation', 'ready');
}

test('rapid looks discard a slow obsolete sample and keep one temporary shader context', async ({ page }, info) => {
  await page.addInitScript(() => {
    const original = window.createImageBitmap; let held = false;
    window.createImageBitmap = (async (...args: Parameters<typeof original>) => {
      const bitmap = await Reflect.apply(original, window, args);
      const canvas = args[0] as HTMLCanvasElement;
      if (!held && canvas instanceof HTMLCanvasElement && canvas.width === 512) { held = true; await new Promise<void>(resolve => Object.assign(window, { releaseShopSample: resolve })); }
      return bitmap;
    }) as typeof createImageBitmap;
    const contexts = new Set<WebGL2RenderingContext>(); let peak = 0;
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, ...args: Parameters<typeof get>) {
      const result = get.apply(this, args);
      if (args[0] === 'webgl2' && result && !this.matches('[data-world-canvas]')) { contexts.add(result as WebGL2RenderingContext); peak = Math.max(peak, [...contexts].filter(context => !context.isContextLost()).length); }
      return result;
    } as typeof get;
    Object.assign(window, { shopSamplerProbe: () => ({ peak, live: [...contexts].filter(context => !context.isContextLost()).length }) });
  });
  await page.goto('/world/#printshop'); await page.locator('[data-world-stage]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-preparation', 'sampling-look');
  await expect.poll(() => page.evaluate(() => typeof (window as unknown as { releaseShopSample?: unknown }).releaseShopSample)).toBe('function');
  for (const look of ['amber-pulse', 'cyber-teal', 'amber-pulse']) await page.locator(`[data-shop-look="${look}"]`).click();
  await expect(pullButton(page)).toBeDisabled();
  await page.evaluate(() => (window as unknown as { releaseShopSample: () => void }).releaseShopSample());
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-preparation', 'ready'); await expect(page.locator('[data-shop-draft-look]')).toContainText('Amber');
  const probe = await page.evaluate(() => (window as unknown as { shopSamplerProbe: () => { peak: number; live: number } }).shopSamplerProbe());
  expect(probe).toEqual({ peak: 1, live: 0 }); await pull(page, 1);
  await expect(page.locator('[data-shop-summary="0"]')).toContainText('Amber');
  await info.attach('serialized-obsolete-sampler', { body: JSON.stringify(probe), contentType: 'application/json' });
});

test('encoding failure and exit during a held replacement preserve both finished prints without late download', async ({ page }) => {
  await page.addInitScript(() => {
    const original = OffscreenCanvas.prototype.convertToBlob;
    OffscreenCanvas.prototype.convertToBlob = async function(options) {
      const plan = window as unknown as { failShopEncode?: boolean; holdShopEncode?: boolean; releaseShopEncode?: () => void; shopEncodeCalls?: number };
      plan.shopEncodeCalls = (plan.shopEncodeCalls ?? 0) + 1;
      if (plan.failShopEncode) { plan.failShopEncode = false; throw new Error('Injected encode failure'); }
      if (plan.holdShopEncode) { plan.holdShopEncode = false; await new Promise<void>(resolve => { plan.releaseShopEncode = resolve; }); }
      return original.call(this, options);
    };
  });
  let downloads = 0; page.on('download', () => downloads++);
  await ready(page); await pull(page, 1); await page.locator('[data-shop-field="headline"]').fill('Second original'); await pull(page, 2);
  const first = await hashPrint(page, 0), second = await hashPrint(page, 1);
  await page.locator('[data-shop-replace-slot="0"]').click();
  await page.evaluate(() => Object.assign(window, { failShopEncode: true })); await pullButton(page).click();
  await expect(page.locator('[data-shop-status]')).toContainText('could not be prepared');
  expect(await hashPrint(page, 0)).toBe(first); expect(await hashPrint(page, 1)).toBe(second);
  await page.evaluate(() => Object.assign(window, { holdShopEncode: true })); await pullButton(page).click();
  await expect.poll(() => page.evaluate(() => typeof (window as unknown as { releaseShopEncode?: unknown }).releaseShopEncode)).toBe('function');
  const calls = await page.evaluate(() => (window as unknown as { shopEncodeCalls: number }).shopEncodeCalls);
  await pullButton(page).dispatchEvent('click'); await pullButton(page).dispatchEvent('click');
  expect(await page.evaluate(() => (window as unknown as { shopEncodeCalls: number }).shopEncodeCalls)).toBe(calls);
  await page.locator('[data-shop-exit]').click(); await page.goBack(); await expect(page.locator('[data-shop-card]')).toBeVisible();
  await page.evaluate(() => (window as unknown as { releaseShopEncode: () => void }).releaseShopEncode());
  await expect(pullButton(page)).toBeEnabled(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '2');
  expect(await hashPrint(page, 0)).toBe(first); expect(await hashPrint(page, 1)).toBe(second); expect(downloads).toBe(0);
  await expect(page.locator('[data-shop-status]')).toContainText('Preparation stopped');
});

test('native keyboard and IME preserve focus and keep visitor words in local workspace storage', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await ready(page);
  const headline = page.locator('[data-shop-field="headline"]'); await headline.focus();
  const historyBefore = await page.evaluate(() => history.length);
  await headline.dispatchEvent('compositionstart'); await headline.fill('Mødested for idéer'); await expect(pullButton(page)).toBeDisabled();
  await page.keyboard.press('Escape'); await expect(page.locator('[data-shop-card]')).toBeVisible(); await expect(headline).toBeFocused();
  await headline.dispatchEvent('compositionend'); await expect(pullButton(page)).toBeEnabled();
  await page.setViewportSize({ width: 390, height: 500 }); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-keyboard', 'open');
  const before = await page.evaluate(() => scrollY); await headline.fill('Ærlighed, glæde og åbne døre');
  expect(await page.evaluate(() => history.length)).toBe(historyBefore); expect(await page.evaluate(() => scrollY)).toBe(before);
  expect(await page.evaluate(() => JSON.stringify(history.state) + location.href)).not.toMatch(/Ærlighed|døre|blob:/);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('portfolio.creative.v1')!).world.draft.headline)).toBe('Ærlighed, glæde og åbne døre');
  await page.locator('[data-shop-done]').click(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-keyboard', '');
  await page.setViewportSize({ width: 390, height: 844 }); await pull(page, 1);
});

for (const origin of ['#small-tools', '#studio/exhibit', '#memory/exhibit']) test(`printshop history and experience switches preserve ${origin}`, async ({ page }) => {
  await page.goto(`/world/${origin}`); await page.locator('[data-world-stage]').scrollIntoViewIfNeeded(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-world-state', 'ready');
  await page.evaluate(() => { const root = document.querySelector<HTMLElement>('[data-forge-world]')!; const link = root.querySelector<HTMLElement>('[data-open-printshop]')!; link.click(); });
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-preparation', 'ready'); await pull(page, 1); const hash = await hashPrint(page, 0);
  await page.locator('[data-shop-slot="0"] [data-shop-inspect]').click(); await expect(page).toHaveURL(/#printshop\/print-1$/); await page.keyboard.press('Escape');
  await page.locator('[data-shop-exit]').click(); expect(new URL(page.url()).hash).toBe(origin);
  await page.goBack(); await expect(page.locator('[data-shop-proof]')).toBeVisible(); expect(await hashPrint(page, 0)).toBe(hash); await page.keyboard.press('Escape');
  await page.locator('[data-shop-exit]').click(); expect(new URL(page.url()).hash).toBe(origin);
  await page.goBack(); await expect(page.locator('[data-shop-proof]')).toBeVisible(); await page.keyboard.press('Escape'); await page.locator('[data-open-task]').click(); await expect(page.locator('[data-task-card]')).toBeVisible(); await expect(page.locator('[data-shop-card]')).toBeHidden();
  for (let i = 0; i < 3; i++) await page.locator('[data-task-primary]').click(); await page.keyboard.press('Escape'); expect(new URL(page.url()).hash).toBe(origin);
  await page.goBack(); await expect(page.locator('[data-task-card]')).toBeVisible(); await page.keyboard.press('Escape'); expect(new URL(page.url()).hash).toBe(origin);
});

test('a reloaded print-slot link restores the exact original PNG and inspector', async ({ page }) => {
  await ready(page); await pull(page, 1); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-saved', 'true'); const original = await hashPrint(page, 0);
  await page.locator('[data-shop-slot="0"] [data-shop-inspect]').click();
  await page.reload(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-preparation', 'ready');
  await expect(page.locator('[data-shop-missing]')).toBeHidden(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '1');
  await expect(page.locator('[data-shop-proof]')).toBeVisible(); expect(await hashPrint(page, 0)).toBe(original);
});

test('a print-slot URL in a fresh workspace cannot fabricate a finished print', async ({ page }) => {
  await ready(page, '#printshop/print-1');
  await expect(page.locator('[data-shop-missing]')).toBeVisible(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '0');
  await expect(page.locator('[data-shop-proof]')).toBeHidden();
});

test('World context loss leaves genuine native editing and PNGs usable and restores the same retained print', async ({ page }) => {
  await ready(page); await pull(page, 1); const first = await hashPrint(page, 0);
  await page.evaluate(() => { const gl = document.querySelector<HTMLCanvasElement>('[data-world-canvas]')!.getContext('webgl2')!; const extension = gl.getExtension('WEBGL_lose_context')!; Object.assign(window, { shopWorldLoss: extension }); extension.loseContext(); });
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-world-state', 'fallback');
  await page.locator('[data-shop-field="headline"]').fill('Printed while the miniature paused'); await pull(page, 2);
  expect(await hashPrint(page, 0)).toBe(first);
  await page.evaluate(() => (window as unknown as { shopWorldLoss: WEBGL_lose_context }).shopWorldLoss.restoreContext());
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-world-state', 'ready'); expect(await hashPrint(page, 0)).toBe(first);
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '2');
});

for (const [width, height] of [[390, 844], [834, 900], [900, 900], [1440, 680]]) test(`the working press fits ${width} by ${height}, preserves its exhibit origin and passes accessibility checks`, async ({ page }, info) => {
  await page.setViewportSize({ width, height }); await enterFromWorld(page, '#small-tools/exhibit');
  await expect(page.locator('[data-shop-field="headline"]')).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const primary = (await pullButton(page).boundingBox())!, exit = (await page.locator('[data-shop-exit]').boundingBox())!;
  expect(primary.y + primary.height).toBeLessThanOrEqual(height); expect(exit.y).toBeGreaterThanOrEqual(0);
  expect(await pullButton(page).evaluate(element => { const box = element.getBoundingClientRect(); return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)); })).toBe(true);
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-draw-calls', /\d+/);
  const bounds = await page.locator('[data-shop-overlay]').evaluate(overlay => {
    const viewport = document.querySelector('[data-world-viewport]')!.getBoundingClientRect();
    return [...overlay.querySelectorAll<HTMLElement>('[data-shop-anchor]')].map(element => { const box = element.getBoundingClientRect(); return { name: element.dataset.shopAnchor, left: box.left, right: box.right, top: box.top, bottom: box.bottom, fits: box.left >= viewport.left - 1 && box.right <= viewport.right + 1 && box.top >= viewport.top - 1 && box.bottom <= viewport.bottom + 1 }; });
  });
  expect(bounds.filter(label => !label.fits)).toEqual([]);
  const collisions = bounds.flatMap((box, index) => bounds.slice(index + 1).filter(other => Math.min(box.right, other.right) > Math.max(box.left, other.left) && Math.min(box.bottom, other.bottom) > Math.max(box.top, other.top)).map(other => [box.name, other.name]));
  expect(collisions).toEqual([]);
  let axe = await new AxeBuilder({ page }).analyze(); expect(axe.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
  await info.attach(`printshop-compose-${width}`, { body: await page.screenshot(), contentType: 'image/png' });
  await page.locator('[data-shop-field="headline"]').fill('Something worth keeping'); await pull(page, 1);
  await page.locator('[data-shop-slot="0"] [data-shop-inspect]').click(); await expect(page.locator('[data-shop-proof]')).toBeVisible();
  axe = await new AxeBuilder({ page }).analyze(); expect(axe.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
  await info.attach(`printshop-proof-${width}`, { body: await page.screenshot(), contentType: 'image/png' });
  await page.keyboard.press('Escape'); await expect(page.locator('[data-shop-slot="0"] [data-shop-inspect]')).toBeFocused();
  await page.locator('[data-shop-exit]').click(); await expect(page).toHaveURL(/#small-tools\/exhibit$/);
});

test('Studio shaders load only on printshop intent and no MP4 codec is requested by the press', async ({ page }, info) => {
  const assetRoot = resolve(process.env.PORTFOLIO_DIST_ROOT ?? 'dist', '_astro');
  const files = await readdir(assetRoot), shaders: string[] = [], codecs: string[] = [];
  for (const name of files.filter(name => name.endsWith('.js'))) { const text = await readFile(resolve(assetRoot, name), 'utf8'); if (text.includes('snoise') && text.includes('u_colorTint')) shaders.push(name); if (name.startsWith('exportMp4.')) codecs.push(name); }
  expect(shaders.length).toBeGreaterThan(0); expect(codecs.length).toBeGreaterThan(0);
  const requests: string[] = []; page.on('request', request => requests.push(request.url()));
  for (const path of ['/', '/world/']) { await page.goto(path); await page.locator('footer').scrollIntoViewIfNeeded(); }
  await page.locator('[data-select-district="small-tools"]').click(); await page.locator('[data-open-task]').click();
  for (let index = 0; index < 3; index++) await page.locator('[data-task-primary]').click();
  expect(requests.filter(url => shaders.some(name => url.endsWith(`/${name}`)))).toEqual([]);
  await page.locator('[data-task-exit]').click(); await page.locator('[data-district-detail="small-tools"] [data-open-printshop]').click();
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-preparation', 'ready');
  expect(requests.some(url => shaders.some(name => url.endsWith(`/${name}`)))).toBe(true);
  expect(requests.some(url => codecs.some(name => url.endsWith(`/${name}`)))).toBe(false);
  await info.attach('printshop-intent-network', { body: JSON.stringify({ shaders, codecs, requests }), contentType: 'application/json' });
});

test('the physical press carries a frozen sheet while the next draft can change', async ({ page }, info) => {
  await ready(page);
  const root = resolve(process.env.PORTFOLIO_DIST_ROOT ?? 'dist', '_astro'); let sceneName = '';
  for (const name of (await readdir(root)).filter(name => /^scene\..*\.js$/.test(name))) if ((await readFile(resolve(root, name), 'utf8')).includes('printshop-travelling-print')) sceneName = name;
  expect(sceneName).not.toBe('');
  await page.evaluate(async url => {
    const { buildPrintshop } = await import(url);
    const draft = document.querySelector('[data-shop-draft]');
    const probe = buildPrintshop({ draft, version: 0, prints: [null, null] });
    const prototype = Object.getPrototypeOf(probe.scene), original = prototype.onBeforeRender;
    const frames: { visible: boolean; x: number; y: number; frozen: boolean }[] = [];
    prototype.onBeforeRender = function(this: typeof probe.scene, ...args: Parameters<typeof original>) {
      const sheet = this.getObjectByName('printshop-travelling-print');
      if (sheet) frames.push({ visible: sheet.visible, x: sheet.position.x, y: sheet.position.y, frozen: sheet.material.map?.image !== draft && sheet.material.map?.image?.width === 1080 });
      return original.apply(this, args);
    };
    probe.dispose(); Object.assign(window, { printshopMotionFrames: () => frames.slice() });
  }, `/_astro/${sceneName}`);
  await pull(page, 1); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-mode', 'pressing');
  await page.locator('[data-shop-field="headline"]').fill('A different next draft');
  await page.waitForTimeout(450);
  const frames = await page.evaluate(() => (window as unknown as { printshopMotionFrames: () => { visible: boolean; x: number; frozen: boolean }[] }).printshopMotionFrames());
  const moving = frames.filter(frame => frame.visible); expect(moving.length).toBeGreaterThan(0); expect(moving.every(frame => frame.frozen)).toBe(true); expect(moving.some(frame => frame.x > 0 && frame.x < 4.8)).toBe(true);
  await info.attach('press-motion-poses', { body: JSON.stringify(moving), contentType: 'application/json' });
  await info.attach('press-in-motion', { body: await page.screenshot(), contentType: 'image/png' });
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-mode', 'rack');
  await expect(page.locator('[data-shop-summary="0"]')).toContainText('Make room for ideas');
  await expect(page.locator('[data-shop-field="headline"]')).toHaveValue('A different next draft');
});

test('no-JavaScript World keeps the printshop explanation and direct Studio route', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL: test.info().project.use.baseURL }); const page = await context.newPage();
  await page.goto('/world/'); await expect(page.locator('[data-world-stage]')).toBeHidden();
  await page.locator('.world-shop-readable summary').click(); await expect(page.locator('.world-shop-readable')).toContainText('The interactive press needs JavaScript');
  await expect(page.locator('.world-shop-readable a[href="/labs/studio/"]')).toBeVisible(); await expect(page.locator('#districts .world-directory-card')).toHaveCount(6); await context.close();
});

test('actual BFCache returns the retained draft, two prints and their original URLs', async ({}, info) => {
  const browser = await chromium.launch({ channel: 'chromium', ignoreDefaultArgs: ['--disable-back-forward-cache'], args: ['--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ baseURL: info.project.use.baseURL });
    await page.addInitScript(() => { const token = crypto.randomUUID(); let persisted = false; window.addEventListener('pageshow', event => { persisted ||= event.persisted; }); Object.assign(window, { printshopNavigation: () => ({ token, persisted }) }); });
    await ready(page); await pull(page, 1); await page.locator('[data-shop-field="headline"]').fill('Keep this second draft'); await pull(page, 2); await page.waitForTimeout(1000); await page.waitForLoadState('networkidle');
    const before = await page.evaluate(() => (window as unknown as { printshopNavigation: () => { token: string } }).printshopNavigation()); const hash = await hashPrint(page, 0);
    await page.goto('/about-the-demos/'); await page.goBack({ waitUntil: 'commit' });
    await expect.poll(() => page.evaluate(() => (window as unknown as { printshopNavigation: () => { persisted: boolean } }).printshopNavigation().persisted)).toBe(true);
    expect((await page.evaluate(() => (window as unknown as { printshopNavigation: () => { token: string } }).printshopNavigation())).token).toBe(before.token);
    await expect(page.locator('[data-shop-field="headline"]')).toHaveValue('Keep this second draft'); expect(await hashPrint(page, 0)).toBe(hash); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '2');
  } finally { await browser.close(); }
});

async function resourceProbe(page: Page) {
  await page.addInitScript(() => {
    const bitmaps = new Set<ImageBitmap>(), urls = new Set<string>(), surfaces = new Set<HTMLCanvasElement | OffscreenCanvas>(), contexts = new Set<WebGL2RenderingContext>();
    const buffers = new Set<object>(), textures = new Set<object>(); let peakShader = 0, peakBitmaps = 0, peakSurfaces = 0, peakUrls = 0, shopDraws = 0;
    const ownedListeners = new Map<EventTarget, Map<string, Set<EventListenerOrEventListenerObject>>>();
    const tracked = (target: EventTarget) => target === window || target === document || target === window.visualViewport || target instanceof Element && Boolean(target.closest('[data-forge-world]'));
    const add = EventTarget.prototype.addEventListener, remove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function(type, callback, options) {
      if (callback && tracked(this)) { if (!ownedListeners.has(this)) ownedListeners.set(this, new Map()); const types = ownedListeners.get(this)!; if (!types.has(type)) types.set(type, new Set()); const callbacks = types.get(type)!; callbacks.add(callback); const signal = typeof options === 'object' ? options.signal : undefined; if (signal) add.call(signal, 'abort', () => callbacks.delete(callback), { once: true }); }
      return add.call(this, type, callback, options);
    };
    EventTarget.prototype.removeEventListener = function(type, callback, options) { if (callback) ownedListeners.get(this)?.get(type)?.delete(callback); return remove.call(this, type, callback, options); };
    const bitmap = window.createImageBitmap, close = ImageBitmap.prototype.close;
    window.createImageBitmap = (async (...args: Parameters<typeof bitmap>) => { const image = await Reflect.apply(bitmap, window, args); bitmaps.add(image); peakBitmaps = Math.max(peakBitmaps, bitmaps.size); return image; }) as typeof createImageBitmap;
    ImageBitmap.prototype.close = function() { bitmaps.delete(this); return close.call(this); };
    const createURL = URL.createObjectURL, revokeURL = URL.revokeObjectURL;
    URL.createObjectURL = function(object) { const url = createURL.call(this, object); urls.add(url); peakUrls = Math.max(peakUrls, urls.size); return url; };
    URL.revokeObjectURL = function(url) { urls.delete(url); return revokeURL.call(this, url); };
    const glPrototype = WebGL2RenderingContext.prototype;
    const own = (gl: WebGL2RenderingContext) => gl.canvas instanceof HTMLCanvasElement && gl.canvas.matches('[data-world-canvas]');
    for (const kind of ['Buffer', 'Texture'] as const) {
      const objects = kind === 'Buffer' ? buffers : textures, createName = `create${kind}` as 'createBuffer' | 'createTexture', deleteName = `delete${kind}` as 'deleteBuffer' | 'deleteTexture';
      const create = glPrototype[createName], remove = glPrototype[deleteName];
      Object.defineProperty(glPrototype, createName, { configurable: true, value: function(this: WebGL2RenderingContext) { const object = Reflect.apply(create, this, []); if (object && own(this)) objects.add(object); return object; } });
      Object.defineProperty(glPrototype, deleteName, { configurable: true, value: function(this: WebGL2RenderingContext, object: object) { if (own(this)) objects.delete(object); return Reflect.apply(remove, this, [object]); } });
    }
    for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced'] as const) {
      const original = glPrototype[name]; Object.defineProperty(glPrototype, name, { configurable: true, value: function(this: WebGL2RenderingContext, ...args: unknown[]) { if (own(this) && document.querySelector<HTMLElement>('[data-forge-world]')?.dataset.experience === 'printshop') shopDraws++; return Reflect.apply(original, this, args); } });
    }
    const surfaceCount = () => [...surfaces].filter(canvas => canvas.width === 1080 && canvas.height === 1080).length;
    const htmlContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, ...args: Parameters<typeof htmlContext>) {
      const context = htmlContext.apply(this, args);
      if (args[0] === '2d' && this.width === 1080 && this.height === 1080) surfaces.add(this);
      if (args[0] === 'webgl2' && context) { contexts.add(context as WebGL2RenderingContext); peakShader = Math.max(peakShader, [...contexts].filter(gl => !own(gl) && !gl.isContextLost()).length); }
      peakSurfaces = Math.max(peakSurfaces, surfaceCount()); return context;
    } as typeof htmlContext;
    if (typeof OffscreenCanvas !== 'undefined') {
      const offscreenContext = OffscreenCanvas.prototype.getContext;
      OffscreenCanvas.prototype.getContext = function(this: OffscreenCanvas, ...args: Parameters<typeof offscreenContext>) { const context = offscreenContext.apply(this, args); if (args[0] === '2d' && this.width === 1080 && this.height === 1080) surfaces.add(this); peakSurfaces = Math.max(peakSurfaces, surfaceCount()); return context; } as typeof offscreenContext;
    }
    document.addEventListener('webglcontextlost', event => { if ((event.target as Element).matches?.('[data-world-canvas]')) { buffers.clear(); textures.clear(); } }, true);
    Object.assign(window, { readPrintshopResources: () => ({ bitmaps: bitmaps.size, urls: urls.size, surfaces: surfaceCount(), shaderContexts: [...contexts].filter(gl => !own(gl) && !gl.isContextLost()).length, worldContexts: [...contexts].filter(gl => own(gl) && !gl.isContextLost()).length, buffers: [...contexts].some(gl => own(gl) && !gl.isContextLost()) ? buffers.size : 0, textures: [...contexts].some(gl => own(gl) && !gl.isContextLost()) ? textures.size : 0, listeners: [...ownedListeners.values()].reduce((sum, types) => sum + [...types.values()].reduce((count, callbacks) => count + callbacks.size, 0), 0), shopDraws, peakShader, peakBitmaps, peakSurfaces, peakUrls }) });
  });
}
type Resources = { bitmaps: number; urls: number; surfaces: number; shaderContexts: number; worldContexts: number; buffers: number; textures: number; listeners: number; shopDraws: number; peakShader: number; peakBitmaps: number; peakSurfaces: number; peakUrls: number };
const resources = (page: Page) => page.evaluate(() => (window as unknown as { readPrintshopResources: () => Resources }).readPrintshopResources());

test('ten edition cycles keep bounded contexts, bitmaps, canvases, URLs, textures and listeners; suspension and teardown release work', async ({ page }, info) => {
  test.setTimeout(120_000); await resourceProbe(page); await page.goto('/world/'); await page.locator('[data-world-stage]').scrollIntoViewIfNeeded(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-world-state', 'ready'); await page.waitForLoadState('networkidle'); await page.waitForTimeout(250); const mapBaseline = await resources(page); await page.evaluate(() => document.querySelector<HTMLElement>('[data-open-printshop]')!.click()); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-preparation', 'ready'); await pull(page, 1); await page.locator('[data-shop-field="headline"]').fill('Print two'); await pull(page, 2); await page.waitForTimeout(1100);
  const initial = await resources(page), cycles: Resources[] = []; expect(initial.textures - mapBaseline.textures).toBe(3);
  for (let index = 0; index < 10; index++) {
    const slot = (index % 2) as 0 | 1;
    await page.locator(`[data-shop-replace-slot="${slot}"]`).click(); await page.locator('[data-shop-field="headline"]').fill(`Edition ${index + 1}, kept here`);
    await page.locator(`[data-shop-look="${index % 2 ? 'amber-pulse' : 'cyber-teal'}"]`).click(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-preparation', 'ready');
    await pull(page, 2); await expect(page.locator(`[data-shop-summary="${slot}"]`)).toContainText(`Edition ${index + 1}`); await page.waitForTimeout(1000);
    await page.locator('[data-shop-exit]').click(); const before = await resources(page); await page.waitForTimeout(150); expect((await resources(page)).shopDraws).toBe(before.shopDraws);
    await page.goBack(); await expect(page.locator('[data-shop-card]')).toBeVisible(); await page.waitForTimeout(100);
    const current = await resources(page); expect(current.urls).toBe(2); expect(current.bitmaps).toBe(1); expect(current.surfaces).toBe(3); expect(current.shaderContexts).toBe(0); expect(current.worldContexts).toBe(1); expect(current.buffers).toBe(initial.buffers); expect(current.textures).toBe(initial.textures); expect(current.listeners).toBe(initial.listeners); cycles.push(current);
  }
  expect(Math.max(...cycles.map(value => value.peakShader))).toBe(1); expect(Math.max(...cycles.map(value => value.peakBitmaps))).toBeLessThanOrEqual(2); expect(Math.max(...cycles.map(value => value.peakSurfaces))).toBeLessThanOrEqual(4); expect(Math.max(...cycles.map(value => value.peakUrls))).toBeLessThanOrEqual(3);
  const calls = await page.locator('[data-forge-world]').evaluate(element => ({ calls: Number((element as HTMLElement).dataset.shopDrawCalls), triangles: Number((element as HTMLElement).dataset.shopTriangles) })); expect(calls.calls).toBeLessThan(60); expect(calls.triangles).toBeLessThan(10_000);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); }); const hidden = await resources(page); await page.waitForTimeout(250); expect((await resources(page)).shopDraws).toBe(hidden.shopDraws);
  await page.evaluate(() => { Reflect.deleteProperty(document, 'hidden'); document.dispatchEvent(new Event('visibilitychange')); });
  await page.locator('footer').scrollIntoViewIfNeeded(); await page.waitForTimeout(200); const offscreen = await resources(page); await page.locator('[data-shop-field="headline"]').evaluate(element => { const input = element as HTMLInputElement; input.value = 'Updated away from the miniature'; input.dispatchEvent(new Event('input', { bubbles: true })); }); await page.waitForTimeout(200); expect((await resources(page)).shopDraws).toBe(offscreen.shopDraws);
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))); await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '2');
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false }))); await expect.poll(async () => (await resources(page)).bitmaps).toBe(0);
  const disposed = await resources(page); expect(disposed.urls).toBe(0); expect(disposed.surfaces).toBe(0); expect(disposed.shaderContexts).toBe(0); expect(disposed.worldContexts).toBe(0); expect(disposed.buffers).toBe(0); expect(disposed.textures).toBe(0);
  await info.attach('printshop-software-resource-envelope', { body: JSON.stringify({ mapBaseline, initial, cycles, calls, hidden, offscreen, disposed }), contentType: 'application/json' });
});
