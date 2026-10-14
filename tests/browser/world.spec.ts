import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { districts, journey } from '../../src/world/data';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

test.use({ launchOptions: { args: ['--enable-unsafe-swiftshader'] } });
test.describe.configure({ mode: 'default' });

test('the Three.js chunk stays out of ordinary portfolio routes', async ({ page }) => {
  const assets = resolve(process.env.PORTFOLIO_DIST_ROOT ?? 'dist', '_astro');
  const chunks = (await readdir(assets)).filter(name => name.endsWith('.js'));
  const worldChunks: string[] = [];
  for (const name of chunks) if ((await readFile(resolve(assets, name), 'utf8')).includes('WebGLRenderer')) worldChunks.push(name);
  expect(worldChunks.length).toBeGreaterThan(0);
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  for (const route of ['/', '/features/', '/labs/memory/', '/work/knowledge-graph/']) {
    await page.goto(route);
    await page.locator('footer').scrollIntoViewIfNeeded();
  }
  expect(requests.filter(url => worldChunks.some(name => url.endsWith(`/${name}`)))).toEqual([]);
});

async function ready(page: Page, route = '/world/') {
  await page.goto(route);
  await page.locator('[data-world-stage]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-world-state', 'ready', { timeout: 20_000 });
  expect(await page.locator('[data-world-canvas]').evaluate(element => {
    const canvas = element as HTMLCanvasElement;
    const gl = canvas.getContext('webgl2');
    return canvas.width > 0 && canvas.height > 0 && gl !== null && !gl.isContextLost();
  })).toBe(true);
}

for (const width of [390, 834, 1440]) {
  test(`real WebGL world at ${width}px supports pins, media and readable accessible districts`, async ({ page }, info) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await ready(page);
    await expect(page.locator('[data-select-district]')).toHaveCount(6);
    await expect.poll(() => page.locator('[data-world-label]:visible').count()).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    let axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) }))).toEqual([]);
    await info.attach(`world-overview-${width}`, { body: await page.locator('[data-world-stage]').screenshot(), contentType: 'image/png' });
    for (const district of districts) {
      const button = page.locator(`[data-select-district="${district.id}"]`);
      await button.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-selected', district.id);
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('[data-select-district][aria-pressed="true"]')).toHaveCount(1);
      await expect(page).toHaveURL(new RegExp(`#${district.id}$`));
      const article = page.locator(`[data-district-detail="${district.id}"]`);
      await expect(article).toBeVisible();
      await expect(article.getByRole('heading', { level: 2 })).toHaveText(district.title);
      await expect(article.locator('.world-case-link')).toHaveAttribute('href', district.href);
      if (district.image) {
        await article.locator('img').evaluate(async element => { const image = element as HTMLImageElement; image.loading = 'eager'; await image.decode(); });
        expect(await article.locator('img').evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      axe = await new AxeBuilder({ page }).analyze();
      expect(axe.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })), district.id).toEqual([]);
    }
    expect(errors).toEqual([]);
  });
}

test('world deep links, browser history and responsive resize preserve selection', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page, '/world/#memory');
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-selected', 'memory');
  await page.locator('[data-select-district="engines"]').click();
  await expect(page).toHaveURL(/#engines$/);
  await page.goBack();
  await expect(page).toHaveURL(/#memory$/);
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-selected', 'memory');
  for (const width of [390, 834, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('[data-district-detail="memory"]')).toBeVisible();
    await expect.poll(() => page.locator('[data-world-canvas]').evaluate(element => {
      const canvas = element as HTMLCanvasElement;
      return Math.abs(canvas.width / Math.min(devicePixelRatio, 1.6) - canvas.getBoundingClientRect().width) < 2;
    })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.locator('[data-world-reset]').first().click();
  await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-selected', '');
  await expect(page).toHaveURL('/world/');
  await expect(page.locator('[data-world-inspector]')).toBeHidden();
});

test('the guided route visits all six districts and returns to overview', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  await page.locator('[data-start-tour]').click();
  for (const [index, step] of journey.entries()) {
    await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-selected', step.id);
    await expect(page.locator('[data-tour-step]')).toHaveText(`${String(index + 1).padStart(2, '0')} / 06`);
    await expect(page.locator('[data-tour-title]')).toHaveText(step.title);
    await expect(page.locator('[data-tour-prev]')).toBeEnabled({ enabled: index > 0 });
    await page.locator('[data-tour-next]').click();
  }
  await expect(page.locator('[data-world-tour]')).toBeHidden();
  await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-selected', '');
  await expect(page.locator('[data-world-announcement]')).toContainText('guided route is complete');
});

test('world recording loads actual graph media, captions and pauses on Escape', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page, '/world/#memory');
  const article = page.locator('[data-district-detail="memory"]');
  const video = article.locator('video');
  expect(await video.evaluate(element => (element as HTMLVideoElement).currentSrc)).toBe('');
  await video.evaluate(element => (element as HTMLVideoElement).muted = true);
  await article.locator('[data-play-recording]').click();
  await expect(video).toBeVisible();
  await expect(video).toHaveAttribute('src', '/media/knowledge-graph-workflow.mp4');
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime)).toBeGreaterThan(0.1);
  await expect.poll(() => video.locator('track').evaluate(element => (element as HTMLTrackElement).readyState)).toBe(2);
  expect(await video.locator('track').evaluate(element => (element as HTMLTrackElement).track.cues?.length ?? 0)).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-world-inspector]')).toBeHidden();
  expect(await video.evaluate(element => (element as HTMLVideoElement).paused)).toBe(true);
  await expect(page.locator('[data-world-reset]').first()).toBeFocused();
});

test('clicking the rendered canvas selects a raycast district', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  const canvas = page.locator('[data-world-canvas]');
  const bounds = (await canvas.boundingBox())!;
  let point: { x: number; y: number } | undefined;
  for (let row = 2; row <= 8 && !point; row++) for (let column = 2; column <= 10; column++) {
    const x = bounds.x + bounds.width * column / 12;
    const y = bounds.y + bounds.height * row / 10;
    if (!(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.matches('[data-world-canvas]'), { x, y }))) continue;
    await page.mouse.move(x, y);
    if ((await canvas.evaluate(element => (element as HTMLElement).style.cursor)) === 'pointer') { point = { x, y }; break; }
  }
  expect(point, 'At least one visible district is selectable through the actual 3D canvas').toBeDefined();
  await page.mouse.click(point!.x, point!.y);
  await expect.poll(() => page.locator('[data-forge-world]').getAttribute('data-selected')).toMatch(/^(studio|engines|connections|memory|workbench|small-tools)$/);
  await expect(page.locator('[data-world-inspector]')).toBeVisible();
  const selected = await page.locator('[data-forge-world]').getAttribute('data-selected');
  await expect(page).toHaveURL(new RegExp(`#${selected}$`));
});

test('a projected district pin opens its matching story', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  const pin = page.locator('[data-world-label="memory"]');
  await expect(pin).toBeVisible();
  await pin.click();
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-selected', 'memory');
  await expect(page.locator('[data-district-detail="memory"]')).toBeVisible();
  await expect(page).toHaveURL(/#memory$/);
});

test('phone touch rotation and pinch zoom preserve the overview without accidental selection', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await ready(page, `${test.info().project.use.baseURL}/world/`);
  const canvas = page.locator('[data-world-canvas]');
  const bounds = (await canvas.boundingBox())!;
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  const positions = () => page.locator('[data-world-label]').evaluateAll(labels => labels.map(label => `${(label as HTMLElement).style.left}:${(label as HTMLElement).style.top}`).join('|'));
  const cdp = await context.newCDPSession(page);
  const beforeRotation = await positions();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: center.x - 40, y: center.y }] });
  for (let step = 1; step <= 5; step++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: center.x - 40 + step * 16, y: center.y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(positions).not.toBe(beforeRotation);
  await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-selected', '');
  const beforePinch = await positions();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, x: center.x - 30, y: center.y }, { id: 2, x: center.x + 30, y: center.y }] });
  for (let step = 1; step <= 5; step++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 1, x: center.x - 30 - step * 10, y: center.y }, { id: 2, x: center.x + 30 + step * 10, y: center.y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(positions).not.toBe(beforePinch);
  await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-selected', '');
  await context.close();
});

test('blocked WebGL leaves six readable districts and working story links', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof getContext>) {
      if (String(args[0]).includes('webgl')) return null;
      return getContext.apply(this, args);
    } as typeof getContext;
  });
  await page.goto('/world/');
  await page.locator('[data-world-stage]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-world-state', 'fallback');
  await expect(page.locator('[data-world-status]')).toContainText('complete readable map');
  await expect(page.locator('#districts .world-directory-card')).toHaveCount(6);
  const card = page.locator('#districts .world-directory-card').filter({ hasText: 'Memory observatory' });
  await card.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(card.getByRole('link', { name: /Relationships, with context/ })).toBeVisible();
  await card.locator('.world-case-link').click();
  await expect(page).toHaveURL('/work/knowledge-graph/');
});

test('world is readable with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${test.info().project.use.baseURL}/world/`);
  await expect(page.locator('[data-world-stage]')).toBeHidden();
  await expect(page.locator('#districts .world-directory-card')).toHaveCount(6);
  await page.locator('#districts .world-directory-card').first().locator('.world-case-link').click();
  await expect(page).toHaveURL('/work/panelforge/');
  await context.close();
});
