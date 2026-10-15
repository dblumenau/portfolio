import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const media = '/media/overview/';
const trigger = (page: Page) => page.locator('[data-overview-trigger]');
const dialog = (page: Page) => page.locator('[data-overview-dialog]');
const video = (page: Page) => page.locator('video[data-overview-video]');
const hashes = {
  'selected-work-overview.mp4': '323da5988a2c6c680d1b979a2b1df59262f123ef23549746ec183b0cbde5cd87',
  'selected-work-poster.jpg': 'c3ad1903abf0b02f86adc25d5c5bd14806fdaaedbb9b2e2d9bbcb67d9e36037c',
  'selected-work-overview.vtt': '432c99b4afed7ce15d7dbdd285cf4ec63639a631f16094b7f8eea98de6cb5634',
  'selected-work-text-alternative.txt': '1d4eb713e47a0b4c10ec5b038ed2a09f5e4cadec7fcef636ea834ec971baedfb',
};

async function open(page: Page) {
  await trigger(page).click();
  await expect(dialog(page)).toBeVisible();
  await expect.poll(() => video(page).evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(3);
}

test('the optional tour requests no overview media until intent and remains paused when opened', async ({ page, baseURL }) => {
  const mediaRequests: string[] = [];
  const unexpected: string[] = [];
  page.on('request', request => {
    if (request.url().includes(media)) mediaRequests.push(request.url());
    if (request.method() !== 'GET' || new URL(request.url()).origin !== new URL(baseURL!).origin || /\/api\//.test(request.url())) unexpected.push(`${request.method()} ${request.url()}`);
  });
  await page.goto('/');
  await expect(trigger(page)).toHaveAttribute('aria-haspopup', 'dialog');
  await page.evaluate(() => document.fonts.ready);
  expect(mediaRequests).toEqual([]);
  expect(await video(page).evaluate((element: HTMLVideoElement) => ({ src: element.getAttribute('src'), poster: element.getAttribute('poster'), track: element.querySelector('track')?.getAttribute('src') }))).toEqual({ src: null, poster: null, track: null });
  await open(page);
  expect(await dialog(page).evaluate(element => element.matches(':modal'))).toBe(true);
  await expect(dialog(page).getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  expect(await video(page).evaluate((element: HTMLVideoElement) => ({ paused: element.paused, time: element.currentTime, autoplay: element.autoplay, controls: element.controls, inline: element.playsInline, duration: element.duration }))).toEqual({ paused: true, time: 0, autoplay: false, controls: true, inline: true, duration: 78.2 });
  await expect.poll(() => video(page).evaluate((element: HTMLVideoElement) => element.textTracks[0]?.cues?.length)).toBe(17);
  for (const name of ['selected-work-overview.mp4', 'selected-work-poster.jpg', 'selected-work-overview.vtt']) expect(mediaRequests.some(url => url.endsWith(name))).toBe(true);
  await dialog(page).locator('summary').click();
  await expect(dialog(page)).toContainText('build 121');
  await expect(dialog(page)).toContainText('build 128');
  await expect(dialog(page)).toContainText('automated Computer Use');
  expect(unexpected).toEqual([]);
});

test('native keyboard playback and seeking work, while closing and Escape pause and restore focus', async ({ page }) => {
  await page.goto('/'); await open(page);
  await video(page).focus(); await page.keyboard.press('Space');
  await expect.poll(() => video(page).evaluate((element: HTMLVideoElement) => element.paused)).toBe(false);
  await expect.poll(() => video(page).evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(.1);
  const before = await video(page).evaluate((element: HTMLVideoElement) => element.currentTime);
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => video(page).evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(before + 4);
  await video(page).evaluate((element: HTMLVideoElement) => { element.currentTime = 35.5; });
  await expect.poll(() => video(page).evaluate((element: HTMLVideoElement) => !element.seeking && element.readyState >= 2 && element.currentTime >= 35.5)).toBe(true);
  await dialog(page).getByRole('button', { name: 'Close', exact: true }).click();
  await expect(dialog(page)).not.toBeVisible(); await expect(trigger(page)).toBeFocused();
  expect(await video(page).evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  await open(page); await video(page).focus(); await page.keyboard.press('Space');
  await expect.poll(() => video(page).evaluate((element: HTMLVideoElement) => element.paused)).toBe(false);
  await page.keyboard.press('Escape');
  await expect(dialog(page)).not.toBeVisible(); await expect(trigger(page)).toBeFocused();
  expect(await video(page).evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
});

test('the native modal contains keyboard focus and pauses during actual page navigation', async ({ page }) => {
  await page.goto('/'); await open(page);
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    expect(await dialog(page).evaluate(element => element.contains(document.activeElement) || (!document.hasFocus() && document.activeElement === document.body))).toBe(true);
  }
  await trigger(page).evaluate(element => element.focus());
  expect(await trigger(page).evaluate(element => document.activeElement === element)).toBe(false);
  await video(page).focus(); await page.keyboard.press('Space');
  await expect.poll(() => video(page).evaluate((element: HTMLVideoElement) => element.paused)).toBe(false);
  await page.evaluate(() => window.addEventListener('pagehide', () => {
    sessionStorage.setItem('overview-navigation-probe', JSON.stringify({ paused: document.querySelector<HTMLVideoElement>('[data-overview-video]')?.paused, open: document.querySelector<HTMLDialogElement>('[data-overview-dialog]')?.open, overflow: document.body.style.overflow }));
  }, { once: true }));
  await page.goto('/about-the-demos/');
  const state = await page.evaluate(() => {
    const value = JSON.parse(sessionStorage.getItem('overview-navigation-probe') ?? 'null');
    sessionStorage.removeItem('overview-navigation-probe'); return value;
  });
  expect(state).toEqual({ paused: true, open: false, overflow: '' });
  await page.goBack();
  await expect(dialog(page)).not.toBeVisible();
  expect(await video(page).evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
});

for (const width of [390, 834, 1440]) {
  test(`tour and reachable close fit at ${width}px with accessible content`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('/'); await page.evaluate(() => document.fonts.ready);
    if (width === 390) {
      for (const name of ['Make a print', 'Recover an answer']) {
        const entry = page.locator('.hero-experiments').getByRole('link', { name: new RegExp(name) });
        const box = await entry.boundingBox();
        expect(box).not.toBeNull(); expect(box!.y).toBeGreaterThan(0); expect(box!.y + box!.height).toBeLessThanOrEqual(844);
      }
      await page.screenshot({ path: test.info().outputPath('homepage-390.png') });
    }
    await open(page);
    const geometry = await dialog(page).evaluate(element => {
      const box = element.getBoundingClientRect(); const film = element.querySelector('video')!.getBoundingClientRect(); const close = element.querySelector('[data-overview-close]')!.getBoundingClientRect();
      return { within: box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight, videoWithin: film.left >= box.left && film.right <= box.right && film.height > 100, closeWithin: close.top >= 0 && close.bottom <= innerHeight, overflow: element.scrollWidth > element.clientWidth || document.documentElement.scrollWidth > innerWidth };
    });
    expect(geometry).toEqual({ within: true, videoWithin: true, closeWithin: true, overflow: false });
    await dialog(page).locator('summary').click();
    await dialog(page).evaluate(element => { element.scrollTop = element.scrollHeight; });
    const close = await dialog(page).getByRole('button', { name: 'Close', exact: true }).boundingBox();
    expect(close!.y).toBeGreaterThanOrEqual(0); expect(close!.y + close!.height).toBeLessThanOrEqual(width === 390 ? 844 : 1000);
    const axe = await new AxeBuilder({ page }).include('[data-overview-dialog]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(axe.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
    await dialog(page).screenshot({ path: test.info().outputPath(`overview-${width}.png`) });
    expect(errors).toEqual([]);
  });
}

test('the direct film and text alternative remain useful without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage(); await page.goto('/');
  await expect(page.getByRole('link', { name: 'Read the tour', exact: true })).toBeVisible();
  await expect(trigger(page)).toHaveAttribute('href', `${media}selected-work-overview.mp4`);
  await expect(trigger(page)).not.toHaveAttribute('aria-haspopup');
  await trigger(page).click();
  await expect(page).toHaveURL(new RegExp(`${media}selected-work-overview.mp4$`));
  await page.goBack(); await page.getByRole('link', { name: 'Read the tour', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${media}selected-work-text-alternative.txt$`));
  await expect(page.locator('body')).toContainText('Automated Intel Computer Helper');
  await expect(page.locator('body')).toContainText('DAVID BLUMENAU — SELECTED WORK');
  await context.close();
});

test('the four published bytes match the approved film and exact provenance fragment', async ({ request }) => {
  const fragment = JSON.parse(await readFile(new URL('../../src/showcases/overview/media-provenance.fragment.json', import.meta.url), 'utf8'));
  expect(fragment.assets).toHaveLength(4);
  for (const [name, hash] of Object.entries(hashes)) {
    const response = await request.get(media + name); expect(response.status()).toBe(200);
    const bytes = await response.body(); expect(createHash('sha256').update(bytes).digest('hex')).toBe(hash);
    const asset = fragment.assets.find((item: { file: string }) => item.file === `overview/${name}`);
    expect(asset.sha256).toBe(hash); expect(asset.bytes).toBe(bytes.length);
  }
});
