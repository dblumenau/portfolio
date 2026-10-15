import { test, expect, chromium, type Page } from '@playwright/test';
import sharp from 'sharp';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const evidence = process.env.CONTINUITY_EVIDENCE_DIR ?? 'test-results/continuity';
test.use({ launchOptions: { args: ['--enable-unsafe-swiftshader'] } });
test.setTimeout(90_000);
const workspaceKey = 'portfolio.creative.v1';
async function world(page: Page) {
  await page.goto('/world/#printshop');
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-preparation', 'ready', { timeout: 30000 });
  await expect(page.locator('.world-shop-pull')).toBeEnabled();
}
async function pull(page: Page, count = 1) {
  await page.locator('.world-shop-pull').click();
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', String(count));
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-saved', 'true');
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-mode', 'rack');
}
async function hash(page: Page, slot = 0) {
  const href = await page.locator(`[data-shop-slot="${slot}"] [data-shop-download]`).getAttribute('href');
  return page.evaluate(async href => [...new Uint8Array(await crypto.subtle.digest('SHA-256', await (await fetch(href!)).arrayBuffer()))].map(n => n.toString(16).padStart(2, '0')).join(''), href);
}
async function pixels(page: Page, selector: string) { return Buffer.from(await page.locator(selector).evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL('image/png').split(',')[1]), 'base64'); }
async function studioReady(page: Page) { await expect(page.locator('[data-studio]')).toHaveAttribute('data-ready', 'true', { timeout: 30000 }); await expect(page.locator('[data-studio]')).toHaveAttribute('aria-busy', 'false'); }

for (const width of [390, 1440]) test(`a kept print and unfinished draft travel as separate editable copies at ${width}px`, async ({ page }, info) => {
  await mkdir(evidence, { recursive: true });
  await page.setViewportSize({ width, height: 900 });
  const requests: string[] = [], errors: string[] = []; page.on('request', r => requests.push(r.url())); page.on('pageerror', e => errors.push(e.message));
  await world(page);
  await page.locator('[data-shop-field="headline"]').fill('Keep this first edition');
  await page.locator('[data-shop-field="smallLine"]').fill('');
  await page.locator('[data-shop-look="cyber-teal"]').click();
  await page.locator('[data-shop-arrangement="center"]').click();
  await expect(page.locator('[data-shop-draft-look]')).toContainText('Teal');
  const before = await pixels(page, '[data-shop-draft]'); await pull(page);
  const originalHash = await hash(page);
  await page.locator('[data-shop-field="headline"]').fill('The next draft is different');
  await page.locator('[data-shop-field="smallLine"]').fill('Still waiting on the press');
  await page.locator('[data-shop-continue="0"]').click();
  await studioReady(page);
  await expect(page.locator('[data-copy-title]')).toHaveText('A copy of Print 1');
  await expect(page.locator('[data-studio]')).toHaveAttribute('data-background-mode', 'raw-still');
  await expect(page.locator('[data-action="play"]')).toBeDisabled();
  await expect(page.locator('[data-control="headline"]')).toHaveValue('Keep this first edition');
  await expect(page.locator('[data-control="prefix"]')).toHaveValue('A SMALL EDITION');
  await expect(page.locator('[data-control="name"]')).toHaveValue('');
  await expect(page.locator('[data-control="detail"]')).toHaveValue('');
  for (const field of ['event', 'name', 'detail']) await expect(page.locator(`[data-visible="${field}"]`)).not.toBeChecked();
  const importedPNG = await pixels(page, '[data-canvas]');
  await writeFile(`${evidence}/world-reference-${width}.png`, before); await writeFile(`${evidence}/studio-import-${width}.png`, importedPNG);
  const reference = await sharp(before).removeAlpha().raw().toBuffer(), imported = await sharp(importedPNG).removeAlpha().raw().toBuffer();
  expect(Buffer.compare(reference, imported)).toBe(0);
  await page.screenshot({ path: `${evidence}/imported-${width}.png`, fullPage: true });
  await page.locator('[data-control="headline"]').fill('A changed Studio copy');
  await page.locator('[data-control="font"]').selectOption('serif');
  await page.locator('[data-control="scale"]').fill('112');
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('[data-action="png"]').click()]);
  expect(download.suggestedFilename()).toBe('studio-print.png');
  await page.locator('[data-back-prints]').click();
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '1');
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-preparation', 'ready');
  await expect(page.locator('[data-shop-continue="0"]')).toBeFocused();
  await expect(page.locator('[data-shop-field="headline"]')).toHaveValue('The next draft is different');
  await expect(page.locator('[data-shop-field="smallLine"]')).toHaveValue('Still waiting on the press');
  expect(await hash(page)).toBe(originalHash);
  await page.reload();
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '1');
  expect(await hash(page)).toBe(originalHash);
  await page.locator('[data-shop-continue="draft"]').click();
  await studioReady(page);
  await expect(page.locator('[data-import-choice]')).toBeVisible();
  await expect(page.locator('[data-control="headline"]')).toHaveValue('A changed Studio copy');
  await page.locator('[data-action="keep-draft"]').click();
  await expect(page.locator('[data-control="headline"]')).toHaveValue('A changed Studio copy');
  await page.locator('[data-back-prints]').click();
  await expect(page.locator('[data-shop-continue="draft"]')).toBeFocused();
  await page.locator('[data-shop-continue="draft"]').focus(); await page.keyboard.press('Enter');
  await studioReady(page);
  await page.locator('[data-action="open-copy"]').click(); await studioReady(page);
  await expect(page.locator('[data-copy-title]')).toHaveText('A copy of your World draft');
  await expect(page.locator('[data-control="headline"]')).toHaveValue('The next draft is different');
  await expect(page.locator('[data-visible="event"]')).toBeChecked();
  await expect(page.locator('[data-action="previous-draft"]')).toBeVisible();
  await page.reload(); await studioReady(page);
  await expect(page.locator('[data-control="headline"]')).toHaveValue('The next draft is different');
  await page.locator('[data-action="previous-draft"]').click(); await studioReady(page);
  await expect(page.locator('[data-control="headline"]')).toHaveValue('A changed Studio copy');
  await expect(page.locator('[data-control="font"]')).toHaveValue('serif');
  await expect(page.locator('[data-control="scale"]')).toHaveValue('112');
  const priorStill = await pixels(page, '[data-canvas]');
  await page.locator('[data-action="animate"]').click(); await studioReady(page);
  await expect(page.locator('[data-studio]')).toHaveAttribute('data-background-mode', 'loop-frame');
  await expect(page.locator('[data-action="play"]')).toBeEnabled();
  await page.locator('[data-control="time"]').fill('0');
  expect((await pixels(page, '[data-canvas]')).equals(priorStill)).toBe(false);
  await page.reload(); await studioReady(page);
  await expect(page.locator('[data-studio]')).toHaveAttribute('data-background-mode', 'loop-frame');
  await expect(page.locator('[data-control="time"]')).toHaveValue('0');
  await page.locator('[data-back-prints]').click();
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '1');
  expect(await hash(page)).toBe(originalHash);
  await page.screenshot({ path: `${evidence}/returned-${width}.png`, fullPage: true });
  const origin = new URL(page.url()).origin;
  expect(requests.filter(url => /^https?:/.test(url) && !url.startsWith(origin))).toEqual([]);
  expect(requests.some(url => /Keep.this|changed.Studio|next.draft/.test(url))).toBe(false);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const proof = { width, originalHash, rgbMismatch: 0, ordinaryURLsContainWords: false, outboundRequests: [], errors };
  await writeFile(`${evidence}/journey-${width}.json`, JSON.stringify(proof, null, 2)); await info.attach('journey', { body: JSON.stringify(proof), contentType: 'application/json' });
});

test('two original PNG slots, explicit replacement, Back/Forward and a cloned tab keep independent bytes', async ({ page, context }) => {
  await world(page); await page.locator('[data-shop-field="headline"]').fill('First original'); await pull(page);
  const first = await hash(page); await page.locator('[data-shop-field="headline"]').fill('Second original'); await pull(page, 2); const second = await hash(page, 1);
  await expect(page.locator('.world-shop-pull')).toBeDisabled();
  const popupPromise = page.waitForEvent('popup'); await page.evaluate(() => window.open('/world/#printshop', '_blank')); const clone = await popupPromise;
  await expect(clone.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '2'); expect(await hash(clone)).toBe(first);
  await clone.locator('[data-shop-reset-confirm] summary').click(); await clone.locator('[data-shop-reset]').click();
  await expect(clone.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '0');
  await page.locator('[data-shop-replace-slot="1"]').click(); await page.locator('[data-shop-field="headline"]').fill('Replacement only'); await pull(page, 2);
  expect(await hash(page)).toBe(first); expect(await hash(page, 1)).not.toBe(second);
  await page.locator('[data-shop-continue="0"]').click(); await studioReady(page);
  await page.goBack(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '2'); expect(await hash(page)).toBe(first);
  await page.goForward(); await studioReady(page); await expect(page.locator('[data-control="headline"]')).toHaveValue('First original');
  await clone.reload(); await expect(clone.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '0');
  const fresh = await context.newPage(); await world(fresh); await expect(fresh.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '0'); await fresh.close(); await clone.close();
});

test('fallback import preserves its own still even where WebGL becomes available', async ({ page }) => {
  await page.addInitScript(() => { if (location.pathname !== '/world/') return; const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, ...args: Parameters<typeof original>) { return String(args[0]).includes('webgl') ? null : original.apply(this, args); } as typeof original; });
  await world(page); await page.locator('[data-shop-field="headline"]').fill('A fallback to keep'); const reference = await pixels(page, '[data-shop-draft]'); await pull(page); const original = await hash(page);
  await page.locator('[data-shop-continue="0"]').click(); await studioReady(page);
  await expect(page.locator('[data-studio]')).toHaveAttribute('data-background-mode', 'fallback');
  expect(Buffer.compare(await sharp(reference).removeAlpha().raw().toBuffer(), await sharp(await pixels(page, '[data-canvas]')).removeAlpha().raw().toBuffer())).toBe(0);
  await page.reload(); await studioReady(page); await expect(page.locator('[data-studio]')).toHaveAttribute('data-background-mode', 'fallback');
  await page.locator('[data-back-prints]').click(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '1'); expect(await hash(page)).toBe(original);
});

for (const failure of ['session', 'png']) test(`${failure} storage failure is honest and exact PNG downloads still work`, async ({ page }) => {
  await page.addInitScript(failure => { if (failure === 'session') Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); }; else IDBFactory.prototype.open = () => { throw new DOMException('Denied', 'SecurityError'); }; }, failure);
  await world(page); await page.locator('.world-shop-pull').click(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '1'); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-saved', 'false');
  await expect(page.locator('[data-shop-storage]')).toContainText('Not saved for return');
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('[data-shop-slot="0"] [data-shop-download]').click()]); expect(download.suggestedFilename()).toBe('small-edition-print-1.png');
  if (failure === 'session') { await page.locator('[data-shop-continue="0"]').click(); await expect(page).toHaveURL(/\/world\//); await expect(page.locator('[data-shop-status]')).toContainText('could not be saved'); }
});

test('all Studio words, visibility, typography, composition and chosen loop frame restore locally', async ({ page }) => {
  await page.goto('/labs/studio/'); await studioReady(page);
  for (const [field, value] of Object.entries({ prefix: 'OUR OWN', headline: 'Full Studio document', event: 'An occasion', name: 'A complete name', detail: 'A detail worth keeping' })) await page.locator(`[data-control="${field}"]`).fill(value);
  await page.locator('[data-visible="event"]').uncheck(); await page.locator('[data-visible="detail"]').uncheck();
  await page.locator('[data-control="ink"]').fill('#ffccaa'); await page.locator('[data-control="font"]').selectOption('mono'); await page.locator('[data-control="scale"]').fill('87'); await page.locator('[data-composition="corner"]').click(); await page.locator('[data-control="time"]').fill('1729');
  const before = await pixels(page, '[data-canvas]'); await page.reload(); await studioReady(page);
  expect(Buffer.compare(await sharp(before).removeAlpha().raw().toBuffer(), await sharp(await pixels(page, '[data-canvas]')).removeAlpha().raw().toBuffer())).toBe(0);
  await expect(page.locator('[data-control="time"]')).toHaveValue('1729'); await expect(page.locator('[data-visible="event"]')).not.toBeChecked(); await expect(page.locator('[data-visible="detail"]')).not.toBeChecked(); await expect(page.locator('[data-composition="corner"]')).toHaveAttribute('aria-pressed', 'true');
  const saved = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)!), workspaceKey); expect(saved.studio.recipe.background).toMatchObject({ mode: 'loop-frame', frame: 27, time: 1729, size: 512, fps: 16, durationMs: 4000, blendMs: 1000 });
  const results = await new AxeBuilder({ page }).include('[data-studio]').analyze(); expect(results.violations).toEqual([]);
});

async function holdPNGWrite(page: Page) {
  await page.addInitScript(() => {
    if (location.pathname !== '/world/' || sessionStorage.getItem('continuity-held')) return;
    const original = IDBFactory.prototype.open;
    IDBFactory.prototype.open = function(...args: Parameters<typeof original>) {
      sessionStorage.setItem('continuity-held', 'yes');
      const request = original.apply(this, args);
      Object.defineProperty(request, 'onsuccess', { set(callback: (event: Event) => void) { request.addEventListener('success', event => { Object.assign(window, { finishPNGSave: () => callback.call(request, event) }); }); } });
      return request;
    };
  });
}

test('a pending PNG is not claimed saved and an ordinary Studio link waits for its completed bytes', async ({ page }) => {
  await holdPNGWrite(page); await world(page); await page.locator('[data-shop-field="headline"]').fill('A completed write');
  await page.locator('.world-shop-pull').click(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '1');
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-saved', 'saving'); const original = await hash(page);
  await page.locator('.world-shop-card > .world-shop-studio-link').click(); await expect(page).toHaveURL(/\/world\//);
  await expect(page.locator('[data-shop-status]')).toContainText('Finishing the local PNG save');
  await page.evaluate(() => (window as unknown as { finishPNGSave: () => void }).finishPNGSave()); await studioReady(page);
  await page.locator('[data-back-prints]').click(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '1'); expect(await hash(page)).toBe(original);
});

test('reset during a pending PNG write cannot resurrect a cleared rack', async ({ page }) => {
  await holdPNGWrite(page); await world(page); await page.locator('.world-shop-pull').click(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-saved', 'saving');
  await page.locator('[data-shop-reset-confirm] summary').click(); await page.locator('[data-shop-reset]').click();
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '0');
  await page.evaluate(() => (window as unknown as { finishPNGSave: () => void }).finishPNGSave());
  await expect(page.locator('.world-shop-pull')).toBeEnabled();
  await page.reload(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-preparation', 'ready'); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '0');
});

test('the shared PNG budget refuses growth without deleting another workspace', async ({ page }) => {
  await world(page);
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('portfolio-creative-v1', 1); request.onupgradeneeded = () => request.result.createObjectStore('pngs', { keyPath: 'key' }); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise<void>((resolve, reject) => { const tx = db.transaction('pngs', 'readwrite'); tx.objectStore('pngs').put({ key: 'another-workspace', blob: new Blob([new Uint8Array(24 * 1024 * 1024)], { type: 'image/png' }), expires: Date.now() + 3600000 }); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); db.close();
  });
  await page.locator('.world-shop-pull').click(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '1'); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-saved', 'false');
  await expect(page.locator('[data-shop-storage]')).toContainText('Not saved for return');
  const size = await page.evaluate(async () => { const db = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('portfolio-creative-v1', 1); request.onsuccess = () => resolve(request.result); }); const size = await new Promise<number>(resolve => { const request = db.transaction('pngs').objectStore('pngs').get('another-workspace'); request.onsuccess = () => resolve(request.result.blob.size); }); db.close(); return size; });
  expect(size).toBe(24 * 1024 * 1024);
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('[data-shop-slot="0"] [data-shop-download]').click()]); expect(download.suggestedFilename()).toBe('small-edition-print-1.png');
});

test('phone touch and reduced motion keep the handoff paused and return focus to the original print', async ({ browser }, info) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce', baseURL: info.project.use.baseURL });
  try {
    const page = await context.newPage(); await world(page); await page.locator('[data-shop-field="headline"]').fill('A print made by touch');
    await page.locator('[data-shop-look="cyber-teal"]').tap(); await expect(page.locator('[data-shop-draft-look]')).toContainText('Teal');
    await page.locator('.world-shop-pull').tap(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '1'); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-saved', 'true');
    const original = await hash(page); await page.locator('[data-shop-continue="0"]').tap(); await studioReady(page);
    await expect(page.locator('[data-studio]')).toHaveAttribute('data-background-mode', 'raw-still'); await expect(page.locator('[data-action="play"]')).toHaveAttribute('aria-pressed', 'false');
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('[data-action="png"]').tap()]); expect(download.suggestedFilename()).toBe('studio-print.png');
    await page.locator('[data-back-prints]').tap(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '1');
    await expect(page.locator('[data-shop-continue="0"]')).toBeFocused(); expect(await hash(page)).toBe(original);
    await mkdir(evidence, { recursive: true }); await page.screenshot({ path: `${evidence}/touch-return-390.png`, fullPage: true });
  } finally { await context.close(); }
});

test('an unfinished draft travels without a rack and returns focus to its own continuation link', async ({ page }) => {
  await world(page); await page.locator('[data-shop-field="headline"]').fill('An unfinished direction'); await page.locator('[data-shop-field="smallLine"]').fill('Not a pulled print');
  await page.locator('[data-shop-continue="draft"]').click(); await studioReady(page);
  await expect(page.locator('[data-copy-title]')).toHaveText('A copy of your World draft'); await expect(page.locator('[data-control="headline"]')).toHaveValue('An unfinished direction');
  await page.locator('[data-back-prints]').click(); await expect(page.locator('[data-shop-continue="draft"]')).toBeFocused();
  await expect(page.locator('[data-shop-field="headline"]')).toHaveValue('An unfinished direction'); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '0');
});

test('a fallback print keeps its sample identity when the next draft changes during PNG encoding', async ({ page }) => {
  await page.addInitScript(() => {
    if (location.pathname !== '/world/') return;
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(this: HTMLCanvasElement, ...args: Parameters<typeof get>) { return String(args[0]).includes('webgl') && !(window as unknown as { allowShader?: boolean }).allowShader ? null : get.apply(this, args); } as typeof get;
    const convert = OffscreenCanvas.prototype.convertToBlob;
    OffscreenCanvas.prototype.convertToBlob = async function(options) { await new Promise<void>(resolve => Object.assign(window, { finishEncoding: resolve })); return convert.call(this, options); };
  });
  await world(page); const reference = await pixels(page, '[data-shop-draft]'); await page.locator('.world-shop-pull').click();
  await page.evaluate(() => Object.assign(window, { allowShader: true })); await page.locator('[data-shop-look="cyber-teal"]').click();
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-fallback', 'false');
  await page.evaluate(() => (window as unknown as { finishEncoding: () => void }).finishEncoding());
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-saved', 'true'); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '1');
  await page.locator('[data-shop-continue="0"]').click(); await studioReady(page); await expect(page.locator('[data-studio]')).toHaveAttribute('data-background-mode', 'fallback');
  expect(Buffer.compare(await sharp(reference).removeAlpha().raw().toBuffer(), await sharp(await pixels(page, '[data-canvas]')).removeAlpha().raw().toBuffer())).toBe(0);
});

test('a temporary PNG restore failure preserves its saved record for a later reload', async ({ page }) => {
  await world(page); await pull(page); const original = await hash(page);
  await page.evaluate(() => sessionStorage.setItem('deny-png-once', 'yes'));
  await page.addInitScript(() => { if (sessionStorage.getItem('deny-png-once')) IDBFactory.prototype.open = () => { throw new DOMException('Denied', 'SecurityError'); }; });
  await page.reload(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-preparation', 'ready');
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-saved', 'false'); await expect(page.locator('.world-shop-pull')).toBeDisabled();
  const kept = await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)!).world.prints[0].blobKey, workspaceKey); expect(kept).not.toBe('');
  await page.evaluate(() => sessionStorage.removeItem('deny-png-once')); await page.reload(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '1'); expect(await hash(page)).toBe(original);
});

test('older BFCache documents reopen the current tab workspace instead of overwriting newer work', async ({}, info) => {
  const browser = await chromium.launch({ channel: 'chromium', ignoreDefaultArgs: ['--disable-back-forward-cache'], args: ['--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ baseURL: info.project.use.baseURL });
    await page.addInitScript(() => window.addEventListener('pageshow', event => { if (event.persisted) { const returns = JSON.parse(sessionStorage.getItem('continuity-bfcache-returns') ?? '[]'); returns.push(location.pathname); sessionStorage.setItem('continuity-bfcache-returns', JSON.stringify(returns)); } }));
    await page.goto('/labs/studio/'); await studioReady(page); await page.locator('[data-control="headline"]').fill('First Studio history entry'); await page.locator('[data-control="time"]').fill('0');
    await page.locator('[data-back-prints]').click(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-preparation', 'ready');
    await page.locator('[data-shop-continue="draft"]').click(); await studioReady(page); await page.locator('[data-action="open-copy"]').click(); await studioReady(page);
    await page.locator('[data-control="headline"]').fill('The latest Studio work'); await page.locator('[data-back-prints]').click(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-preparation', 'ready');
    await page.locator('[data-shop-field="headline"]').fill('The latest World work');
    await page.goBack({ waitUntil: 'commit' }); await studioReady(page); await expect(page.locator('[data-control="headline"]')).toHaveValue('The latest Studio work');
    await page.goBack({ waitUntil: 'commit' }); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-preparation', 'ready'); await expect(page.locator('[data-shop-field="headline"]')).toHaveValue('The latest World work');
    await page.goBack({ waitUntil: 'commit' }); await studioReady(page); await expect(page.locator('[data-control="headline"]')).toHaveValue('The latest Studio work');
    const returns = await page.evaluate(() => JSON.parse(sessionStorage.getItem('continuity-bfcache-returns') ?? '[]'));
    expect(returns).toContain('/world/'); expect(returns).toContain('/labs/studio/');
  } finally { await browser.close(); }
});

for (const outcome of ['resolve', 'reject'] as const) test(`reset during restored PNG decode ignores a late ${outcome} and keeps new work`, async ({ page }, info) => {
  await page.addInitScript(() => {
    const original = window.createImageBitmap, createURL = URL.createObjectURL, revokeURL = URL.revokeObjectURL;
    const urls = new Set<string>(); let decoded = 0;
    Object.assign(window, { restoredPNGURLs: () => [...urls] });
    URL.createObjectURL = function(object) { const url = createURL.call(this, object); if (object instanceof Blob && object.type === 'image/png') urls.add(url); return url; };
    URL.revokeObjectURL = function(url) { urls.delete(url); return revokeURL.call(this, url); };
    window.createImageBitmap = (async (...args: Parameters<typeof original>) => {
      const image = await Reflect.apply(original, window, args);
      if (args[0] instanceof Blob && args[0].type === 'image/png' && sessionStorage.getItem('hold-restored-PNG-decode') && ++decoded === 2) {
        Object.assign(window, { heldRestoreBitmap: image });
        try { await new Promise<void>((resolve, reject) => Object.assign(window, { finishRestoreDecode: (outcome: string) => outcome === 'resolve' ? resolve() : reject(new Error('Held decode failed')) })); }
        catch (error) { image.close(); throw error; }
      }
      return image;
    }) as typeof createImageBitmap;
  });
  await world(page); await page.locator('[data-shop-field="headline"]').fill('First print explicitly cleared'); await pull(page);
  await page.locator('[data-shop-field="headline"]').fill('Second print explicitly cleared'); await pull(page, 2);
  await page.evaluate(() => sessionStorage.setItem('hold-restored-PNG-decode', 'yes')); await page.reload();
  await page.waitForFunction(() => typeof (window as unknown as { finishRestoreDecode?: unknown }).finishRestoreDecode === 'function');
  const liveURLs = () => page.evaluate(() => (window as unknown as { restoredPNGURLs: () => string[] }).restoredPNGURLs());
  expect(await liveURLs()).toHaveLength(1);
  await page.locator('[data-shop-reset-confirm] summary').click(); await page.locator('[data-shop-reset]').click();
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '0'); expect(await liveURLs()).toHaveLength(0);
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-preparation', 'ready'); await expect(page.locator('.world-shop-pull')).toBeEnabled();
  await page.locator('[data-shop-field="headline"]').fill('New work after the reset'); await pull(page);
  const newHash = await hash(page), before = await page.evaluate(key => ({ workspace: sessionStorage.getItem(key), status: document.querySelector('[data-shop-status]')!.textContent, storage: document.querySelector('[data-shop-storage]')!.textContent }), workspaceKey);
  const newURLs = await liveURLs(); expect(newURLs).toHaveLength(1);
  await page.evaluate(outcome => { sessionStorage.removeItem('hold-restored-PNG-decode'); (window as unknown as { finishRestoreDecode: (outcome: string) => void }).finishRestoreDecode(outcome); }, outcome);
  await expect.poll(() => page.evaluate(() => (window as unknown as { heldRestoreBitmap: ImageBitmap }).heldRestoreBitmap.width)).toBe(0);
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '1'); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-saved', 'true'); await expect(page.locator('.world-shop-pull')).toBeEnabled();
  const after = await page.evaluate(key => ({ workspace: sessionStorage.getItem(key), status: document.querySelector('[data-shop-status]')!.textContent, storage: document.querySelector('[data-shop-storage]')!.textContent }), workspaceKey);
  expect(after).toEqual(before); expect(await liveURLs()).toEqual(newURLs); expect(await hash(page)).toBe(newHash);
  await page.reload(); await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-shop-prints', '1'); expect(await hash(page)).toBe(newHash);
  await expect(page.locator('[data-shop-summary="0"]')).toContainText('New work after the reset'); await expect(page.locator('[data-shop-slot="1"]')).toBeHidden();
  await info.attach('restore-reset-race', { body: JSON.stringify({ outcome, newHash, before, after, discardedBitmapWidth: 0, oldURLsReleased: true }), contentType: 'application/json' });
});
