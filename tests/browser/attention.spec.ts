import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const evidence = process.env.ATTENTION_EVIDENCE_DIR ?? process.env.PORTFOLIO_TEST_ARTIFACTS ?? 'test-results/attention';
const sourceHash = '0c8468b4b98dd0d57f9737e8f9a3e81eb8fe44642290d042524bca9f60125976';
const reviewedFilmHash = '4a863d88a4a4e2278c5544e5d962a22ddcda793b1b894f55b9a718d6e82254e1';
const captureStyle = '.skip-link:not(:focus) { visibility: hidden; }';
async function ready(page: import('@playwright/test').Page) {
  await page.goto('/labs/attention/');
  await expect(page.locator('[data-attention-lab]')).toHaveAttribute('data-ready', 'true');
}

// These controls navigate one real recorded outcome. They must not submit a new choice.
test('chapters seek the actual film while the complete same-task narrative remains readable', async ({ page }) => {
  const errors: string[] = [];
  const requests: { method: string; url: string }[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push({ method: request.method(), url: request.url() }));
  await ready(page);
  const lab = page.locator('[data-attention-lab]');
  const video = lab.locator('video');
  await expect(video).toHaveAttribute('preload', 'none');
  await expect(video).not.toHaveAttribute('autoplay');
  await expect(page.locator('.at-sequence li')).toHaveCount(4);
  await expect(page.locator('.at-sequence')).toContainText('That same task creates index.html');
  await expect(page.locator('#at-participant')).toContainText('layout selection is automated');
  for (const [index, time] of [0, 7, 14, 28, 35.5, 41].entries()) {
    await lab.locator(`[data-attention-chapter="${index}"]`).click();
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeCloseTo(time, 1);
    expect(await video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
    await expect(lab.locator(`[data-attention-chapter="${index}"]`)).toHaveAttribute('aria-current', 'step');
  }
  await expect(page.locator('[data-attention-status]')).toContainText('separate five-second recording');
  await expect(page.getByRole('button', { name: /^Schedule first$/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Session cards$/ })).toHaveCount(0);
  await expect(page.locator('.at-distinction')).toContainText('external shared Attention MCP');
  await expect(page.locator('.at-distinction a')).toHaveAttribute('href', '/labs/question/');
  expect(errors).toEqual([]);
  expect(requests.length).toBeGreaterThan(5);
  const origin = new URL(page.url()).origin;
  expect(requests.every(request => request.method === 'GET' && new URL(request.url).origin === origin)).toBe(true);
  expect(requests.some(request => /\/(?:api|mcp|decision|respond)(?:\/|$)/.test(new URL(request.url).pathname))).toBe(false);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

for (const width of [390, 821, 1440]) {
  test(`actual film, readable text and genuine result captures fit ${width}px`, async ({ page }) => {
    await mkdir(evidence, { recursive: true });
    await page.setViewportSize({ width, height: width === 390 ? 852 : 1000 });
    await ready(page);
    await expect(page.locator('.at-film video')).toBeVisible();
    await expect(page.locator('.at-sequence li').first()).toContainText('Codex reaches a decision');
    await expect(page.locator('.at-choice')).toContainText('[Portfolio demo] Which layout should I build for Lantern Makers?');
    await expect(page.locator('.at-output')).toContainText('The same file at 390 px');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390) expect(await page.locator('.at-sequence li p').first().evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
    await page.locator('[data-attention-chapter="4"]').click();
    const video = page.locator('.at-film video');
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeCloseTo(35.5, 1);
    const frame = (await video.boundingBox())!;
    expect(frame.y).toBeGreaterThanOrEqual(0);
    expect(frame.y + frame.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    const result = await new AxeBuilder({ page }).include('#main').analyze();
    expect(result.violations).toEqual([]);
    for (const file of ['question.png', 'answered.png', 'workshop-desktop.png', 'workshop-phone.png']) {
      const link = page.locator(`a[href="/media/attention/${file}"]`).first();
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener');
    }
    await page.screenshot({ path: `${evidence}/attention-${width}.png`, fullPage: true, style: captureStyle });
    await page.locator('.at-lab').screenshot({ path: `${evidence}/film-${width}.png`, style: captureStyle });
    await page.locator('.at-output').screenshot({ path: `${evidence}/output-${width}.png`, style: captureStyle });
  });
}

test('keyboard chapter navigation and native details retain focus and disclose the limits', async ({ page }) => {
  await ready(page);
  const chapter = page.locator('[data-attention-chapter="2"]');
  await chapter.focus();
  await page.keyboard.press('Enter');
  await expect(chapter).toBeFocused();
  await expect(chapter).toHaveAttribute('aria-current', 'step');
  await expect.poll(() => page.locator('video').evaluate((element: HTMLVideoElement) => element.currentTime)).toBeCloseTo(14, 1);
  const latest = page.locator('[data-attention-chapter="5"]');
  await latest.focus();
  await page.keyboard.press('Space');
  await expect(latest).toBeFocused();
  await expect(latest).toHaveAttribute('aria-current', 'step');
  await page.locator('.at-method > summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.at-method')).toHaveAttribute('open', '');
  await expect(page.locator('.at-method')).toContainText('Provider acceptance does not establish arrival on every device');
  await expect(page.locator('.at-method')).toContainText('Production session_id is blank');
  await expect(page.locator('.at-method')).toContainText('mac-v1.1.8 / build121');
  await expect(page.locator('.at-method')).toContainText('mac-v1.1.14 / build128');
  await expect(page.locator('.at-method')).toContainText('generic “CLAUDE’S QUESTION” label');
  expect(await page.evaluate(() => document.querySelector('form, iframe, [contenteditable="true"]'))).toBeNull();
});

test('public receipt preserves the actual return, same-task checks and reviewed media bytes', async ({ page }) => {
  await ready(page);
  const response = await page.request.get('/media/attention/receipt.json');
  expect(response.ok()).toBe(true);
  const receipt = await response.json();
  expect(receipt.actual_tool_result).toEqual({ status: 'answered', route: 'remote', answers: [{ otherText: null, questionId: 'workshop-layout', selectedOptionIds: ['cards'] }] });
  expect(receipt.native_selection_participant).toBe('Automated Computer Use through Intel Computer Helper');
  expect(receipt.same_task_proof.original_cli_task_started_count).toBe(1);
  expect(receipt.same_task_proof.original_cli_task_completed_count).toBe(1);
  expect(receipt.same_task_proof.actual_attention_layout_call_count).toBe(1);
  expect(receipt.same_task_proof.exact_owned_pane_matches_durable_request).toBe(true);
  expect(receipt.same_task_proof.production_session_id_present).toBe(false);
  expect(receipt.same_task_proof.actual_returned_option_matches_built_layout).toBe(true);
  expect(receipt.runtime.live_native_build).toBe('121');
  expect(receipt.runtime.post_upgrade_build).toBe('128');
  expect(receipt.apns.status_codes).toHaveLength(10);
  expect(receipt.apns.status_codes.every((code: number) => code === 200)).toBe(true);
  expect(receipt.apns.interpretation).toContain('Provider acceptance only');
  expect(receipt.actual_file.sha256).toBe(sourceHash);
  expect(receipt.artifacts['execution.mp4'].sha256).toBe(reviewedFilmHash);
  expect(receipt.exhibit.film_editing.privacy).toContain('No terminal text is replaced');
  expect(JSON.stringify(receipt)).not.toMatch(/\/(?:home|Users|root|mnt)\/|127\.0\.0\.1|localhost|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|access_token|refresh_token|api[_-]?key|installation_hash/i);
  for (const [file, info] of Object.entries(receipt.artifacts) as [string, { sha256: string; bytes: number }][]) {
    const asset = await page.request.get(`/media/attention/${file}`);
    expect(asset.ok(), file).toBe(true);
    const body = await asset.body();
    expect(body.length, file).toBe(info.bytes);
    expect(createHash('sha256').update(body).digest('hex'), file).toBe(info.sha256);
  }
});

test('download preserves the harmless original HTML bytes as text, without executing a new route', async ({ page }) => {
  await ready(page);
  const response = await page.request.get('/media/attention/workshop-source.txt');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toMatch(/^text\/plain/);
  const raw = await response.body();
  expect(createHash('sha256').update(raw).digest('hex')).toBe(sourceHash);
  const html = raw.toString('utf8');
  expect(html).not.toMatch(/<\s*(?:script|iframe|object|embed|form|base|link)\b|\bon\w+\s*=|@import|url\s*\(|(?:https?:\/\/|javascript:|\/home\/|\/Users\/|localhost|127\.0\.0\.1)/i);
  expect(html).toContain('Chosen layout: Session cards');
  expect(html).toContain('Built after your native answer');
  expect(html.match(/<article /g)).toHaveLength(3);
  const link = page.getByRole('link', { name: 'Download the actual page' });
  await expect(link).toHaveAttribute('download', 'lantern-workshop.html');
  const downloadEvent = page.waitForEvent('download');
  await link.click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('lantern-workshop.html');
  const path = await download.path();
  expect(path).not.toBeNull();
  expect(createHash('sha256').update(await readFile(path!)).digest('hex')).toBe(sourceHash);
  expect(new URL(page.url()).pathname).toBe('/labs/attention/');
});

test('authentic film decodes and readable captions fit all three disclosed segments', async ({ page }) => {
  await ready(page);
  const video = page.locator('video');
  await video.scrollIntoViewIfNeeded();
  await video.evaluate(async (element: HTMLVideoElement) => { element.muted = true; await element.play(); });
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(.5);
  const media = await video.evaluate((element: HTMLVideoElement) => ({ duration: element.duration, width: element.videoWidth, height: element.videoHeight, error: element.error?.message ?? null }));
  expect(media.width).toBe(1920); expect(media.height).toBe(1080); expect(media.duration).toBeCloseTo(46, 2); expect(media.error).toBeNull();
  await video.evaluate((element: HTMLVideoElement) => element.pause());
  const captions = await (await page.request.get('/media/attention/execution.vtt')).text();
  expect(captions).toContain('Intel Computer Helper');
  expect(captions).toContain('post-upgrade observation');
  const time = (stamp: string) => stamp.split(':').reduce((value, part) => value * 60 + Number(part), 0);
  const cues = captions.trim().split('\n\n').slice(1).map(block => {
    const [range, ...lines] = block.split('\n');
    const [start, end] = range.split(' --> ').map(time);
    return { start, end, words: lines.join(' ').split(/\s+/).length };
  });
  expect(cues).toHaveLength(7);
  cues.forEach((cue, index) => {
    expect(cue.start).toBeLessThan(cue.end);
    expect(cue.end).toBeLessThanOrEqual(media.duration);
    expect(cue.words / (cue.end - cue.start)).toBeLessThanOrEqual(2.5);
    if (index) expect(cue.start).toBeGreaterThanOrEqual(cues[index - 1].end);
  });
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.textTracks[0]?.cues?.length ?? 0)).toBe(7);
  await expect(page.locator('#at-film-caption')).toContainText('six seconds');
  await expect(page.locator('#at-film-caption')).toContainText('five-second');
  await mkdir(evidence, { recursive: true });
  await writeFile(`${evidence}/playback.json`, JSON.stringify({ ...media, cues }, null, 2));
});

test('the complete outcome, native media and artifact download work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 852 } });
  const page = await context.newPage();
  await page.goto('/labs/attention/');
  await expect(page.locator('.at-nojs')).toBeVisible();
  await expect(page.locator('[data-attention-chapter="0"]')).toBeDisabled();
  await expect(page.locator('video')).toHaveAttribute('controls', '');
  await expect(page.locator('.at-sequence li')).toHaveCount(4);
  await expect(page.locator('.at-sequence')).toContainText('That same task creates index.html');
  await expect(page.locator('.at-terminal-quote')).toContainText('You selected “Session cards.”');
  await expect(page.locator('.at-result-images figure')).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'Download the actual page' })).toHaveAttribute('href', '/media/attention/workshop-source.txt');
  await page.locator('.at-method summary').click();
  await expect(page.locator('.at-method')).toContainText('Production session_id is blank');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: `${evidence}/no-js-390.png`, fullPage: true, style: captureStyle });
  await context.close();
});
