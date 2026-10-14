import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

test.use({ launchOptions: { args: ['--enable-unsafe-swiftshader'] } });
const captures = '/home/dblumenau/portfolio-project-2026-10-14/verification/world-exhibit';

async function ready(page: Page) {
  await page.goto('/world/');
  await page.locator('[data-world-stage]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-forge-world]')).toHaveAttribute('data-world-state', 'ready', { timeout: 20_000 });
}
async function fullyInViewport(page: Page, selector: string) {
  const rect = await page.locator(selector).boundingBox();
  expect(rect, selector).not.toBeNull();
  expect(rect!.y, `${selector} top`).toBeGreaterThanOrEqual(0);
  expect(rect!.y + rect!.height, `${selector} bottom`).toBeLessThanOrEqual(page.viewportSize()!.height);
}

test('390px touch selection exposes title, useful actions and close in the same viewport, with Back restoring the overview', async ({ browser }, info) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await ready(page);
  const strip = page.locator('.world-district-nav');
  await strip.scrollIntoViewIfNeeded();
  const button = page.locator('[data-select-district="memory"]');
  await button.scrollIntoViewIfNeeded();
  const priorScroll = await page.evaluate(() => scrollY);
  await mkdir(captures, { recursive: true });
  await page.screenshot({ path: `${captures}/phone-world-overview.png` });
  await button.tap();
  await expect(page).toHaveURL(/#memory$/);
  await fullyInViewport(page, '[data-district-detail="memory"] h2');
  await fullyInViewport(page, '[data-district-detail="memory"] [data-open-exhibit]');
  await fullyInViewport(page, '[data-district-detail="memory"] .world-detail-actions a[href="/labs/memory/"]');
  await fullyInViewport(page, '.world-close');
  expect((await page.locator('[data-world-viewport]').boundingBox())!.height).toBe(220);
  await mkdir(captures, { recursive: true });
  await page.screenshot({ path: `${captures}/phone-memory-selected.png` });
  await writeFile(`${captures}/phone-geometry.json`, JSON.stringify({
    viewport: page.viewportSize(),
    strip: await strip.boundingBox(),
    canvas: await page.locator('[data-world-viewport]').boundingBox(),
    title: await page.locator('[data-district-detail="memory"] h2').boundingBox(),
    action: await page.locator('[data-district-detail="memory"] [data-open-exhibit]').boundingBox(),
    close: await page.locator('.world-close').boundingBox(),
  }, null, 2));
  await info.attach('phone-memory-selected', { body: await page.screenshot(), contentType: 'image/png' });
  await page.goBack();
  await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-selected', '');
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(priorScroll, 0);
  await context.close();
});

test('390px keyboard selection reveals the same sheet and Escape returns focus to overview', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  await page.locator('[data-select-district="studio"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-district-detail="studio"] h2')).toBeFocused();
  await fullyInViewport(page, '[data-district-detail="studio"] h2');
  await fullyInViewport(page, '[data-district-detail="studio"] [data-open-exhibit]');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-world-inspector]')).toBeHidden();
  await expect(page.locator('[data-world-reset]').first()).toBeFocused();
  for (const id of ['engines', 'connections', 'memory', 'workbench', 'small-tools']) {
    await page.locator(`[data-select-district="${id}"]`).focus();
    await page.keyboard.press('Enter');
    await fullyInViewport(page, `[data-district-detail="${id}"] h2`);
    await fullyInViewport(page, `[data-district-detail="${id}"] .world-detail-actions .world-case-link`);
    await fullyInViewport(page, '.world-close');
  }
});

test('desktop exhibit gives genuine media a large stage, pauses the recording on return and preserves its district', async ({ page }, info) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await ready(page);
  await page.locator('[data-select-district="memory"]').click();
  const detail = page.locator('[data-district-detail="memory"]');
  const smallWidth = (await detail.locator('img').boundingBox())!.width;
  await detail.locator('[data-open-exhibit]').click();
  await expect(page).toHaveURL(/#memory\/exhibit$/);
  await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-exhibit', 'memory');
  await detail.locator('img').evaluate(async element => (element as HTMLImageElement).decode());
  expect((await detail.locator('img').boundingBox())!.width).toBeGreaterThan(smallWidth * 2);
  await fullyInViewport(page, '[data-close-exhibit]');
  await mkdir(captures, { recursive: true });
  await page.screenshot({ path: `${captures}/desktop-memory-exhibit.png` });
  await info.attach('desktop-memory-exhibit', { body: await page.screenshot(), contentType: 'image/png' });
  const video = detail.locator('video');
  await video.evaluate(element => (element as HTMLVideoElement).muted = true);
  await detail.locator('[data-play-recording]').click();
  await expect(video).toHaveAttribute('src', '/media/knowledge-graph-workflow.mp4');
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime)).toBeGreaterThan(.1);
  await page.locator('[data-close-exhibit]').click();
  await expect(page).toHaveURL(/#memory$/);
  await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-selected', 'memory');
  await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-exhibit', '');
  expect(await video.evaluate(element => (element as HTMLVideoElement).paused)).toBe(true);
  await expect(detail.locator('[data-open-exhibit]')).toBeFocused();
  await page.goBack();
  await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-exhibit', 'memory');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-exhibit', '');
  await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-selected', 'memory');
});

test('readable-map anchor navigation preserves selection and Back restores the district viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  await page.locator('[data-select-district="memory"]').click();
  const priorScroll = await page.evaluate(() => scrollY);
  await page.locator('a[href="#districts"]').first().evaluate(element => (element as HTMLAnchorElement).click());
  await expect(page).toHaveURL(/#districts$/);
  await expect.poll(() => page.locator('#districts').evaluate(element => element.getBoundingClientRect().top)).toBeLessThan(70);
  await expect(page.locator('[data-world-stage]')).toHaveAttribute('data-selected', 'memory');
  await page.goBack();
  await expect(page).toHaveURL(/#memory$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(priorScroll, 0);
});
