import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const evidence = process.env.BRANCH_EVIDENCE_DIR ?? process.env.PORTFOLIO_TEST_ARTIFACTS ?? 'test-results/branches';
async function ready(page: import('@playwright/test').Page) {
  await page.goto('/labs/branches/');
  await expect(page.locator('[data-branch-lab]')).toHaveAttribute('data-ready', 'true');
}

test('reference, revisions, comparison and preference replay retain the original', async ({ page }) => {
  const errors: string[] = []; const requests: { url: string; method: string }[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push({ url: request.url(), method: request.method() }));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await ready(page);
  const lab = page.locator('[data-branch-lab]');
  const next = lab.locator('[data-next]');
  await expect(lab.locator('[data-gallery]')).toBeVisible();
  await next.click();
  await expect(lab).toHaveAttribute('data-phase', '1');
  await expect(lab.locator('[data-shared-image]')).toBeVisible();
  await expect(lab.locator('[data-count]')).toHaveText('1 direction retained');
  await next.click();
  await expect(lab).toHaveAttribute('data-phase', '2');
  await expect(lab.locator('[data-result="bold"]')).toContainText('Enlarge the title');
  await lab.locator('[data-branch="balanced"]').click();
  await expect(lab.locator('[data-result="balanced"]')).toContainText('balanced title treatment');
  await expect(lab.locator('[data-original-proof]')).toHaveText('All 4 rows unchanged');
  await next.click();
  await expect(lab.locator('[data-result="quiet"]')).toContainText('Reduce the title size');
  await expect(lab.locator('[data-count]')).toHaveText('3 directions retained');
  await next.click();
  await expect(lab.locator('[data-results]')).toHaveClass(/is-comparing/);
  await expect(lab.locator('[data-result]:visible')).toHaveCount(2);
  await lab.locator('[data-prefer]').click();
  await expect(lab).toHaveAttribute('data-phase', '5');
  await expect(lab.locator('[data-branch="quiet"] [data-preferred-badge]')).toBeVisible();
  await lab.locator('[data-branch="balanced"]').click();
  await expect(lab.locator('[data-result="balanced"]')).toContainText('accent restrained');
  await expect(lab.locator('[data-branch="quiet"] [data-preferred-badge]')).toBeVisible();
  await next.click();
  await expect(lab.locator('[data-gallery]')).toBeVisible();
  await expect(lab.locator('[data-workspace]')).toBeHidden();
  await expect.poll(() => page.locator('.bl-traveller').count()).toBe(0);
  expect(errors).toEqual([]);
  expect(requests.every(request => request.method === 'GET')).toBe(true);
  expect(requests.every(request => request.url.startsWith(new URL(page.url()).origin))).toBe(true);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

for (const width of [390, 821, 1440]) {
  test(`branch comparison fits and passes accessibility checks at ${width}`, async ({ page }) => {
    await mkdir(evidence, { recursive: true });
    await page.setViewportSize({ width, height: width === 390 ? 852 : 1000 });
    await ready(page);
    const lab = page.locator('[data-branch-lab]');
    await lab.locator('[data-step="4"]').click();
    await expect(lab.locator('[data-result="bold"]')).toBeVisible();
    await expect(lab.locator('[data-result="quiet"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await lab.locator('[data-prefer]').click();
    await expect(lab.locator('[data-choice-status]')).toContainText('All three directions');
    const axe = await new AxeBuilder({ page }).include('[data-branch-lab]').analyze();
    expect(axe.violations).toEqual([]);
    await lab.locator('[data-step="4"]').click();
    await page.waitForTimeout(700);
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
    await page.screenshot({ path: `${evidence}/branches-${width}.png`, fullPage: true });
    await lab.screenshot({ path: `${evidence}/branches-lab-${width}.png` });
  });
}

test('the replay works from the keyboard and exposes its source receipt', async ({ page }) => {
  await ready(page);
  const lab = page.locator('[data-branch-lab]');
  const next = lab.locator('[data-next]');
  await next.focus();
  for (let phase = 1; phase <= 4; phase++) {
    await page.keyboard.press('Enter');
    await expect(lab).toHaveAttribute('data-phase', String(phase));
    await expect(next).toBeFocused();
  }
  await lab.locator('[data-prefer]').focus();
  await page.keyboard.press('Space');
  await expect(lab).toHaveAttribute('data-phase', '5');
  await lab.locator('.bl-inspect summary').focus();
  await page.keyboard.press('Enter');
  await expect(lab.locator('.bl-inspect')).toHaveAttribute('open', '');
  await expect(lab.locator('table')).toContainText('Message #3');
  await expect(lab.locator('dl')).toContainText('unreleased');
  const response = await page.request.get('/media/branches/receipt.json');
  expect(response.ok()).toBe(true);
  const receipt = await response.json();
  expect(receipt.observations.originalRowsByteIdentical).toBe(true);
  expect(receipt.originalRows.sha256Before).toBe(receipt.originalRows.sha256After);
  expect(receipt.fixture.inferencePerformed).toBe(false);
  expect(receipt.source.comparisonPatchReleased).toBe(false);
  expect(JSON.stringify(receipt)).not.toMatch(/\/(?:home|Users|root|mnt)\/|127\.0\.0\.1|localhost|archiveIntent|session_uuid|api[_-]?key/i);
});

test('actual captures change with their adjacent unreleased-patch disclosure', async ({ page }) => {
  await ready(page);
  const captures = page.locator('[data-branch-captures]');
  for (const name of ['original-retained', 'comparison', 'reference-handoff']) {
    await captures.locator(`[data-capture="${name}"]`).click();
    await expect(captures.locator('[data-capture-image]')).toHaveAttribute('src', `/media/branches/${name}.webp`);
    await expect(captures.locator(`[data-capture="${name}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect(captures.locator('[data-capture-open]')).toHaveAttribute('href', `/media/branches/${name}.webp`);
  }
  await expect(captures.locator('.bl-patch-note')).toContainText('unreleased');
  await expect(captures.locator('.bl-patch-note')).toContainText('fixture answers');
});

test('the actual edited film decodes, plays, seeks and provides captions', async ({ page }) => {
  await ready(page);
  const video = page.locator('.bl-film video');
  await video.scrollIntoViewIfNeeded();
  await video.evaluate(async (element: HTMLVideoElement) => { element.muted = true; await element.play(); });
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(.5);
  expect(await video.evaluate((element: HTMLVideoElement) => element.videoWidth)).toBe(1440);
  expect(await video.evaluate((element: HTMLVideoElement) => element.videoHeight)).toBe(1000);
  expect(await video.evaluate((element: HTMLVideoElement) => element.duration)).toBeCloseTo(26.92, 1);
  await video.evaluate((element: HTMLVideoElement) => { element.pause(); element.currentTime = 22; });
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeCloseTo(22, 1);
  await expect(video.locator('track')).toHaveAttribute('src', '/media/branches/execution.vtt');
  const captions = await page.request.get('/media/branches/execution.vtt');
  expect((await captions.text())).toContain('unreleased local fix');
  await expect(page.locator('#bl-film-caption')).toContainText('loading intervals removed');
  await expect(page.locator('.bl-film .bl-patch-note')).toContainText('unreleased');
  await expect(page.locator('.bl-film .bl-patch-note')).toContainText('905cceef4');
  await mkdir(evidence, { recursive: true });
  await writeFile(`${evidence}/playback.json`, JSON.stringify(await video.evaluate((element: HTMLVideoElement) => ({ duration: element.duration, videoWidth: element.videoWidth, videoHeight: element.videoHeight, soughtTo: element.currentTime, paused: element.paused, error: element.error?.message ?? null })), null, 2));
});

test('the recorded outcome and evidence remain available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/labs/branches/');
  await expect(page.locator('.bl-noscript')).toContainText('original four messages remained unchanged');
  await expect(page.locator('.bl-inspect a')).toHaveAttribute('href', '/media/branches/receipt.json');
  await expect(page.locator('.bl-film video')).toHaveAttribute('controls', '');
  await expect(page.locator('[data-next]')).toBeDisabled();
  await context.close();
});
