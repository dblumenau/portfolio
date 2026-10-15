import { test, expect, type Page, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import media from '../../src/showcases/listening-plan/media-provenance.fragment.json' with { type: 'json' };

const selector = '[data-listening-plan]';
async function openFilm(page: Page) {
  await page.locator(`${selector} > details > summary`).click();
  const video = page.locator(`${selector} video`);
  await expect(video).toBeVisible();
  return video;
}
async function nativePlay(video: Locator) {
  await video.scrollIntoViewIfNeeded();
  const box = (await video.boundingBox())!;
  await video.click({ position: { x: 30, y: box.height - 48 } });
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(.2);
}

test('actual plans and adjacent fixture disclosure follow the retained player recordings', async ({ page }) => {
  await page.goto('/labs/listening/');
  const plan = page.locator(selector);
  await expect(plan.getByRole('heading', { name: 'Choose what comes next.' })).toBeVisible();
  for (const text of ['26:20', '29:45', 'Saved choice: Mark complete.', 'Cedar completed; Harbor active.']) await expect(plan).toContainText(text);
  const scope = plan.locator('.lp-scope');
  await expect(scope).toBeVisible();
  await expect(scope).toContainText(/isolated test copy.*unreleased interface fix.*Fictional study history and question.*example chapter durations/s);
  await expect(scope).toContainText('No audio was played in this recorded plan check.');
  await expect(scope).toContainText(/Six completed days were prefilled.*day 7.*one correct answer.*one authored question.*not learning or retention.*usual 20-question pool/s);
  expect(await page.evaluate(() => {
    const plan = document.querySelector('[data-listening-plan]')!;
    return {
      afterRecordings: !!(document.querySelector('.ll-recordings')!.compareDocumentPosition(plan) & Node.DOCUMENT_POSITION_FOLLOWING),
      beforeNotes: !!(plan.compareDocumentPosition(document.querySelector('.ll-provenance')!) & Node.DOCUMENT_POSITION_FOLLOWING),
    };
  })).toEqual({ afterRecordings: true, beforeNotes: true });
  await expect(plan.locator('[data-plan-recording]')).not.toHaveAttribute('open');
  await expect(plan.locator('video')).toHaveAttribute('preload', 'none');
  await expect(plan.locator('video')).not.toHaveAttribute('autoplay');
  expect(await plan.locator('video').evaluate((v: HTMLVideoElement) => ({ paused: v.paused, time: v.currentTime }))).toEqual({ paused: true, time: 0 });
});

test('native film controls opt in, load captions, pause on close and resume at the same position', async ({ page }) => {
  await page.goto('/labs/listening/');
  const video = await openFilm(page);
  await nativePlay(video);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.textTracks[0]?.cues?.length)).toBe(4);
  expect(await video.evaluate((v: HTMLVideoElement) => v.textTracks[0].mode)).toBe('showing');
  await page.locator(`${selector} > details > summary`).click();
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  const stopped = await video.evaluate((v: HTMLVideoElement) => v.currentTime);
  await page.waitForTimeout(250);
  expect(await video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeCloseTo(stopped, 2);
  await openFilm(page);
  expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await nativePlay(video);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(stopped + .2);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
});

test('closing the new disclosure does not pause the retained listening player', async ({ page }) => {
  await page.goto('/labs/listening/');
  await expect(page.locator('[data-listening-player]')).toBeVisible();
  const audio = page.locator('[data-listening-audio]');
  await audio.evaluate((a: HTMLAudioElement) => { a.muted = true; });
  await page.getByRole('button', { name: 'Play story', exact: true }).click();
  await expect.poll(() => audio.evaluate((a: HTMLAudioElement) => a.currentTime)).toBeGreaterThan(.2);
  await openFilm(page);
  const before = await audio.evaluate((a: HTMLAudioElement) => a.currentTime);
  await page.locator(`${selector} > details > summary`).click();
  expect(await audio.evaluate((a: HTMLAudioElement) => a.paused)).toBe(false);
  await expect.poll(() => audio.evaluate((a: HTMLAudioElement) => a.currentTime)).toBeGreaterThan(before + .1);
  await page.getByRole('button', { name: 'Pause story', exact: true }).click();
});

for (const viewport of [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 1000 }]) {
  test(`plans, scope and native film fit at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('/labs/listening/');
    await page.locator(selector).scrollIntoViewIfNeeded();
    const geometry = await page.locator(selector).evaluate(el => ({ width: innerWidth, document: document.documentElement.scrollWidth, bounds: el.getBoundingClientRect().toJSON(), cards: [...el.querySelectorAll('.lp-plans article')].map(x => x.getBoundingClientRect().toJSON()), fonts: [...el.querySelectorAll('.lp-scope p,.lp-phase')].map(x => parseFloat(getComputedStyle(x).fontSize)) }));
    expect(geometry.document).toBeLessThanOrEqual(viewport.width + 1);
    expect(geometry.bounds.width).toBeLessThanOrEqual(viewport.width);
    expect(geometry.fonts.every(size => size >= 15)).toBe(true);
    if (viewport.width <= 390) expect(geometry.cards[1].top).toBeGreaterThan(geometry.cards[0].bottom - 1);
    else expect(geometry.cards[0].top).toBe(geometry.cards[1].top);
    await page.locator(selector).screenshot({ path: test.info().outputPath(`plan-${viewport.width}.png`) });
    const video = await openFilm(page); await nativePlay(video);
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.textTracks[0]?.cues?.length)).toBe(4);
    await page.screenshot({ path: test.info().outputPath(`native-film-${viewport.width}.png`) });
    const axe = await new AxeBuilder({ page }).include(selector).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(axe.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('without JavaScript native plans, scope, film and receipt remain available', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage(); await page.goto('/labs/listening/');
    await expect(page.locator(selector)).toContainText('Saved choice: Mark complete.');
    await expect(page.locator(`${selector} .lp-scope`)).toContainText('unreleased interface fix');
    const video = await openFilm(page); await nativePlay(video);
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.textTracks[0]?.cues?.length)).toBe(4);
    await page.locator(selector).screenshot({ path: test.info().outputPath('no-js-plan.png') });
    await expect(page.locator(`${selector} .lp-receipt`)).toHaveAttribute('href', '/media/listening-plan/receipt.json');
    await expect(page.locator('.ll-fallback audio')).toHaveAttribute('controls', '');
  } finally { await context.close(); }
});

test('selected receipt and media hashes are exact, public-safe and read-only', async ({ page, request, baseURL }) => {
  const mutations: string[] = [], external: string[] = [];
  page.on('request', r => { if (!['GET','HEAD'].includes(r.method())) mutations.push(r.method()); if (new URL(r.url()).origin !== new URL(baseURL!).origin) external.push(r.url()); });
  await page.addInitScript(() => { (window as any).__planStorage = []; const original = Storage.prototype.setItem; Storage.prototype.setItem = function(k,v) { (window as any).__planStorage.push(k); return original.call(this,k,v); }; });
  await page.goto('/labs/listening/'); await openFilm(page);
  for (const asset of media.assets) {
    const response = await request.get('/media/' + asset.file); expect(response.status()).toBe(200);
    expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(asset.sha256);
    expect(createHash('sha256').update(readFileSync('public/media/' + asset.file)).digest('hex')).toBe(asset.sha256);
  }
  const receipt = await (await request.get('/media/listening-plan/receipt.json')).json();
  expect(receipt.source.original_revision).toBe('5c925b1de588f1f668648774925d8cca5efbcf39');
  expect(receipt.observed.saved_choice).toBe('Mark complete');
  expect(receipt.observed.next_chapter).toMatchObject({ title: 'Harbor', active_day: 0, week: 1, plays: 5, planned_seconds: 1785 });
  expect(receipt.inputs.actual_listening).toBe(false); expect(receipt.inputs.normal_twenty_question_pool_used).toBe(false);
  expect(JSON.stringify(receipt)).not.toMatch(/\/home\/|\/Users\/|127\.0\.0\.1|localhost|fixture-|progress\.db|session_id|Bearer|access_token|https?:\/\//i);
  expect(await page.locator(selector).innerText()).not.toMatch(/\/home\/|127\.0\.0\.1|fixture-|progress\.db|session_id/);
  expect(mutations).toEqual([]); expect(external).toEqual([]);
  expect(await page.evaluate(() => (window as any).__planStorage)).toEqual([]);
});
