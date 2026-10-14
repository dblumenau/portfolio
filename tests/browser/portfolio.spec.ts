import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = ['/', '/work/panelforge/', '/work/connected-agents/', '/work/connected-tools/', '/work/knowledge-graph/', '/work/agent-workbench/', '/work/conference-notes/', '/about-the-demos/'];
const sizes = [{ name: 'phone', width: 390, height: 844 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'desktop', width: 1440, height: 1000 }];

async function loadImages(page: Page) {
  await page.evaluate(async () => {
    const images = [...document.querySelectorAll<HTMLImageElement>('img[src]')];
    images.forEach(image => image.loading = 'eager');
    await Promise.all(images.map(image => image.decode()));
    await document.fonts.ready;
  });
}

for (const size of sizes) for (const route of routes) {
  test(`${size.name}: ${route} has readable content, loaded images and no overflow`, async ({ page }) => {
    await page.setViewportSize(size);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.missing-media')).toHaveCount(0);
    await loadImages(page);
    expect(await page.locator('img[src]').evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
    const overflow = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    expect(overflow.document, JSON.stringify(overflow)).toBeLessThanOrEqual(size.width + 1);
    expect(overflow.body, JSON.stringify(overflow)).toBeLessThanOrEqual(size.width + 1);
    expect(errors).toEqual([]);
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(accessibility.violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
  });
}

test('navigation and contact links reach their destinations', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Selected work', exact: true }).click();
  await expect(page).toHaveURL(/\/#work$/);
  await page.getByRole('link', { name: /The story behind PanelForge/ }).click();
  await expect(page).toHaveURL('/work/panelforge/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A home for the work between ideas.');
  await page.getByRole('link', { name: 'The workflow', exact: true }).click();
  await expect(page).toHaveURL(/#the-workflow$/);
  await page.getByRole('link', { name: 'David Blumenau home' }).click();
  await expect(page).toHaveURL('/');
  await page.getByRole('link', { name: /Get in touch/ }).click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.getByRole('link', { name: 'Email me', exact: true })).toHaveAttribute('href', 'mailto:dblumenau@gmail.com');
});

for (const width of [390, 768, 820]) {
  test(`mobile menu at ${width}px supports keyboard, Escape, outside clicks and links`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
    const menu = page.locator('.mobile-menu');
    const summary = menu.locator('summary');
    await expect(summary).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeHidden();
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('open', '');
    await expect(menu.getByRole('link')).toHaveCount(await page.locator('.desktop-navigation a').count());
    expect(await menu.getByRole('link').count()).toBeGreaterThanOrEqual(5);
    await page.keyboard.press('Tab');
    await expect(menu.getByRole('link', { name: /Selected work/ })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).not.toHaveAttribute('open', '');
    await expect(summary).toBeFocused();
    await page.keyboard.press('Enter');
    await page.getByRole('heading', { level: 1 }).click({ position: { x: 4, y: 4 } });
    await expect(menu).not.toHaveAttribute('open', '');
    await summary.focus();
    await page.keyboard.press('Enter');
    const about = menu.getByRole('link', { name: /About/ });
    await about.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#approach$/);
    await expect(menu).not.toHaveAttribute('open', '');
    await summary.click();
    await menu.getByRole('link', { name: /Feature atlas/ }).click();
    await expect(page).toHaveURL('/features/');
    await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open', '');
  });
}

test('desktop navigation appears after the mobile-menu breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: 821, height: 900 });
  await page.goto('/');
  await expect(page.locator('.mobile-menu')).toBeHidden();
  expect(await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link').count()).toBeGreaterThanOrEqual(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('workbench paths support arrow keys, Home and End with one readable panel', async ({ page }) => {
  await page.goto('/work/agent-workbench/');
  const tabs = page.getByRole('tab', { name: /Set up a session|Carry a lesson forward/ });
  await expect(tabs).toHaveCount(2);
  await tabs.first().focus();
  for (const [key, index] of [['ArrowRight', 1], ['ArrowRight', 0], ['End', 1], ['Home', 0], ['ArrowLeft', 1]] as const) {
    await page.keyboard.press(key);
    await expect(tabs.nth(index)).toBeFocused();
    await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-bench-panel]:visible')).toHaveCount(1);
    await expect(page.locator('[data-bench-panel]:visible li')).toHaveCount(3);
  }
});

test('architecture tabs support arrows, Home and End with one selected panel', async ({ page }) => {
  await page.goto('/');
  const tabs = page.getByRole('tab');
  expect(await tabs.count()).toBeGreaterThanOrEqual(3);
  await tabs.first().focus();
  for (const [key, index] of [['ArrowRight', 1], ['End', 2], ['ArrowRight', 0], ['ArrowLeft', 2], ['Home', 0]] as const) {
    await page.keyboard.press(key);
    await expect(tabs.nth(index)).toBeFocused();
    await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveCount(1);
    await expect(page.locator('[role="tabpanel"]:visible')).toHaveCount(1);
    const panelId = await tabs.nth(index).getAttribute('aria-controls');
    await expect(page.locator(`#${panelId}`)).toBeVisible();
  }
});

test('screenshot size selection and enlarged dialog preserve focus', async ({ page }) => {
  await page.goto('/');
  const showcase = page.locator('[data-showcase]').first();
  const phone = showcase.getByRole('button', { name: 'Phone', exact: true });
  await phone.focus();
  await page.keyboard.press('Enter');
  await expect(phone).toHaveAttribute('aria-pressed', 'true');
  await expect(showcase.locator('[data-screen="desktop"]')).toBeHidden();
  const image = showcase.locator('[data-screen="mobile"] [data-zoom]');
  await image.focus();
  await page.keyboard.press('Enter');
  const dialog = showcase.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const close = dialog.getByRole('button', { name: 'Close enlarged screenshot' });
  await expect(close).toBeFocused();
  await page.keyboard.press('Tab');
  expect(await dialog.evaluate(element => document.activeElement === document.body || element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Shift+Tab');
  await expect(close).toBeFocused();
  await expect(dialog.locator('img')).toHaveAttribute('src', /panelforge-gallery-mobile\.webp$/);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(image).toBeFocused();
  await showcase.getByRole('button', { name: 'Desktop', exact: true }).click();
  await expect(showcase.locator('[data-screen="desktop"]')).toBeVisible();
});

test('recordings have working playback, captions, posters and text alternatives', async ({ page }) => {
  const observed = new Set<string>();
  for (const route of ['/', '/work/panelforge/', '/work/connected-agents/', '/work/knowledge-graph/', '/work/conference-notes/']) {
    await page.goto(route);
    const videos = page.locator('figure.video-demo video');
    expect(await videos.count()).toBeGreaterThanOrEqual(route === '/' ? 2 : 1);
    for (const video of await videos.all()) {
    observed.add((await video.locator('source').getAttribute('src'))!);
    await expect(video).toHaveAttribute('controls', '');
    await expect(video).toHaveAttribute('poster', /\.webp$/);
    const track = video.locator('track[kind="captions"]');
    await expect(track).toHaveCount(1);
    await expect(track).toHaveAttribute('srclang', 'en');
    await expect(track).toHaveAttribute('src', /\.vtt$/);
    await video.scrollIntoViewIfNeeded();
    await video.evaluate(async element => {
      const media = element as HTMLVideoElement;
      media.muted = true;
      media.load();
      await media.play();
    });
    await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime)).toBeGreaterThan(0.1);
    expect(await video.evaluate(element => Number.isFinite((element as HTMLVideoElement).duration) && (element as HTMLVideoElement).duration > 1)).toBe(true);
    await expect.poll(() => track.evaluate(element => (element as HTMLTrackElement).readyState)).toBe(2);
    expect(await track.evaluate(element => ((element as HTMLTrackElement).track.cues?.length ?? 0))).toBeGreaterThan(0);
    await video.evaluate(element => (element as HTMLVideoElement).pause());
    const figure = video.locator('..');
    await expect(figure.locator('figcaption')).not.toBeEmpty();
    const transcript = figure.locator('details');
    await transcript.locator('summary').click();
    await expect(transcript.locator('p').last()).toBeVisible();
    }
  }
  for (const name of ['kitforge', 'pencil-page', 'panelforge', 'apple-client', 'knowledge-graph', 'conference-notes']) expect(observed).toContain(`/media/${name}-workflow.mp4`);
});

test('reduced motion keeps navigation and interactive content usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('tab').last().click();
  await expect(page.getByRole('tab').last()).toHaveAttribute('aria-selected', 'true');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  expect(await page.locator('video').evaluateAll(videos => videos.every(video => !(video as HTMLVideoElement).autoplay))).toBe(true);
});

test('the Kitforge output showcase plays the actual square browser export', async ({ page }) => {
  await page.goto('/');
  const showcase = page.locator('[data-kitforge-output]');
  await expect(showcase).toBeVisible();
  const video = showcase.locator('video');
  await expect(video).toBeHidden();
  await showcase.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(video).toBeVisible();
  await expect(video.locator('source')).toHaveAttribute('src', '/media/kitforge-output.mp4');
  await expect(video).toHaveAttribute('controls', '');
  await video.scrollIntoViewIfNeeded();
  await video.evaluate(async element => {
    const media = element as HTMLVideoElement;
    media.muted = true;
    media.load();
    await media.play();
  });
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime)).toBeGreaterThan(0.1);
  expect(await video.evaluate(element => {
    const media = element as HTMLVideoElement;
    return { width: media.videoWidth, height: media.videoHeight, duration: media.duration };
  })).toEqual({ width: 1080, height: 1080, duration: 4 });
  const track = video.locator('track[kind="captions"]');
  await expect(track).toHaveAttribute('src', '/media/kitforge-output.vtt');
  await expect.poll(() => track.evaluate(element => (element as HTMLTrackElement).readyState)).toBe(2);
  expect(await track.evaluate(element => (element as HTMLTrackElement).track.cues?.length ?? 0)).toBeGreaterThan(0);
  await video.evaluate(element => (element as HTMLVideoElement).pause());
  await expect(showcase.locator('p')).toContainText('exported directly from the working application');
  await expect(showcase.getByRole('link', { name: /Download.*sample MP4/ })).toHaveAttribute('href', '/media/kitforge-output.mp4');
});

test('unknown routes show an accessible route home', async ({ page }) => {
  const response = await page.goto('/a-page-that-does-not-exist/');
  expect(response?.status()).toBe(404);
  await page.getByRole('link', { name: /Back to the work/ }).click();
  await expect(page).toHaveURL('/');
});
