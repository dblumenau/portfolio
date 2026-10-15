import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const evidence = process.env.QUESTION_EVIDENCE_DIR ?? process.env.PORTFOLIO_TEST_ARTIFACTS ?? 'test-results/question';
// Chromium's tall captures can paint a fixed link that is outside the live viewport.
// Keep that unfocused, offscreen link absent from screenshots; keyboard tests retain it.
const captureStyle = '.skip-link:not(:focus) { visibility: hidden; }';
async function ready(page: import('@playwright/test').Page) {
  await page.goto('/labs/question/');
  await expect(page.locator('[data-question-lab]')).toHaveAttribute('data-ready', 'true');
}

test('recorded native choice resumes the same invocation without creating a live task', async ({ page }) => {
  const errors: string[] = [];
  const requests: { method: string; url: string }[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push({ method: request.method(), url: request.url() }));
  await ready(page);
  const lab = page.locator('[data-question-lab]');
  const next = lab.locator('[data-question-next]');
  await expect(lab.locator('[data-question-panel="0"]')).toContainText('fictional Lantern Makers workshop');
  await next.click();
  await expect(lab).toHaveAttribute('data-stage', '1');
  await expect(lab.locator('.ql-question-text')).toContainText('More customization has no recorded result here');
  await expect(next).toHaveText('Replay Quick setup');
  await expect(lab.getByRole('button', { name: 'More customization' })).toHaveCount(0);
  await next.click();
  await expect(lab).toHaveAttribute('data-stage', '2');
  await expect(lab.locator('.ql-answer')).toContainText('Quick setup');
  await next.click();
  await expect(lab).toHaveAttribute('data-stage', '3');
  await expect(lab.locator('.ql-result-title')).toHaveText('Chosen direction: Quick setup');
  await expect(lab.locator('.ql-result li')).toHaveCount(3);
  await expect(lab.locator('.ql-result')).toContainText('none of the actions in it ran');
  await expect(lab.locator('[data-question-status]')).toContainText('One invocation; 25 text events');
  await expect.poll(() => lab.locator('video').evaluate((video: HTMLVideoElement) => video.currentTime)).toBeCloseTo(18, 1);
  await next.click();
  await expect(lab).toHaveAttribute('data-stage', '0');
  await expect(lab.locator('[data-question-panel="3"]')).toBeHidden();
  // The authentic encoded segment begins at its first playable frame, not PTS zero.
  await expect.poll(() => lab.locator('video').evaluate((video: HTMLVideoElement) => video.currentTime)).toBeCloseTo(0.433008, 2);
  expect(await lab.locator('video').evaluate((video: HTMLVideoElement) => video.paused)).toBe(true);
  expect(errors).toEqual([]);
  expect(requests.every(request => request.method === 'GET')).toBe(true);
  expect(requests.every(request => request.url.startsWith(new URL(page.url()).origin))).toBe(true);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

for (const width of [390, 821, 1440]) {
  test(`question, result and authentic captures remain readable at ${width}`, async ({ page }) => {
    await mkdir(evidence, { recursive: true });
    await page.setViewportSize({ width, height: width === 390 ? 852 : 1000 });
    await ready(page);
    const lab = page.locator('[data-question-lab]');
    await lab.locator('[data-stage="1"]').click();
    await expect(lab.locator('.ql-question-text')).toContainText('Quick setup');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await lab.screenshot({ path: `${evidence}/question-${width}.png`, style: captureStyle });
    await lab.locator('[data-stage="3"]').click();
    await expect(lab.locator('.ql-result-title')).toBeVisible();
    const result = await new AxeBuilder({ page }).include('#main').analyze();
    expect(result.violations).toEqual([]);
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
    await lab.screenshot({ path: `${evidence}/result-${width}.png`, style: captureStyle });
    await page.locator('.ql-captures').screenshot({ path: `${evidence}/captures-${width}.png`, style: captureStyle });
    await page.screenshot({ path: `${evidence}/page-${width}.png`, fullPage: true, style: captureStyle });
    await expect(lab.locator('#ql-boundary')).toContainText('Isolated iPhone Simulator');
    await expect(lab.locator('#ql-boundary')).toContainText('local API shim');
    await expect(lab.locator('#ql-boundary')).toContainText('unreleased Claude-only');
    for (const name of ['question', 'selected', 'completed']) {
      await expect(page.locator(`.ql-capture-window[href="/media/question/${name}.png"]`)).toHaveAttribute('target', '_blank');
      await expect(page.locator(`.ql-capture-window[href="/media/question/${name}.png"]`)).toHaveAttribute('rel', 'noopener');
    }
  });
}

test('keyboard replay and the exact full-question answer map are available', async ({ page }) => {
  await ready(page);
  const lab = page.locator('[data-question-lab]');
  const next = lab.locator('[data-question-next]');
  await next.focus();
  for (let stage = 1; stage <= 3; stage++) {
    await page.keyboard.press(stage === 2 ? 'Space' : 'Enter');
    await expect(lab).toHaveAttribute('data-stage', String(stage));
    await expect(next).toBeFocused();
  }
  await page.locator('.ql-wire summary').focus();
  await page.keyboard.press('Enter');
  const payload = JSON.parse(await page.locator('.ql-wire pre code').innerText());
  expect(payload).toEqual({
    action: 'answer',
    answers: { 'Should I prioritize Quick setup or More customization for the Lantern Makers check-in?': 'Quick setup' },
  });
  await page.locator('.ql-method > summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.ql-method')).toContainText('unmodified released native app');
  await expect(page.locator('.ql-distinction')).toContainText('Permission');
  await expect(page.locator('.ql-distinction')).toContainText('Attention');
  await expect(page.locator('.ql-distinction')).toContainText('Steering');
});

test('public receipt shows the actual wire answer and reviewed artifact bytes', async ({ page }) => {
  await ready(page);
  const response = await page.request.get('/media/question/receipt.json');
  expect(response.ok()).toBe(true);
  const receipt = await response.json();
  const question = receipt.question.questions[0].question;
  expect(receipt).not.toHaveProperty('selected_answer');
  expect(receipt.ui_selection).toEqual({ Priority: 'Quick setup' });
  expect(receipt.ui_selection_explanation).toContain('not the answer map');
  expect(receipt.native_answer_payload).toEqual({ action: 'answer', answers: { [question]: 'Quick setup' } });
  expect(receipt.native_payload_matches_private_capture_verified).toBe(true);
  expect(receipt.same_request_id_verified).toBe(true);
  expect(receipt.same_stream_verified).toBe(true);
  expect(receipt.tool_result.same_tool_use_id_verified).toBe(true);
  expect(receipt.tool_result.content).toContain(`"${question}"="Quick setup"`);
  expect(receipt.tool_result.is_error).toBe(false);
  expect(receipt.invocations).toBe(1);
  expect(receipt.final_text.startsWith('Chosen direction: Quick setup')).toBe(true);
  expect(receipt.final_text.length).toBe(receipt.final_character_count);
  expect(receipt.source_patch_released).toBe(false);
  expect(receipt.plan_actions_executed).toBe(false);
  expect(receipt.engine_tools).toEqual(['AskUserQuestion']);
  expect(receipt.mcp_servers).toEqual([]);
  expect(JSON.stringify(receipt)).not.toMatch(/\/[\s]*(?:home|Users|root|mnt)\/|127\.0\.0\.1|localhost|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|access_token|refresh_token|api[_-]?key/i);
  for (const [original, target] of [['native-question-execution.mp4', 'execution.mp4'], ['02-question.png', 'question.png'], ['03-selected.png', 'selected.png'], ['04-completed.png', 'completed.png']]) {
    const media = await page.request.get(`/media/question/${target}`);
    expect(media.ok()).toBe(true);
    expect(createHash('sha256').update(await media.body()).digest('hex')).toBe(receipt.artifacts[original].sha256);
  }
});

test('actual native film plays and its readable disclosure captions fit the encoded duration', async ({ page }) => {
  await ready(page);
  const video = page.locator('.ql-film video');
  await video.scrollIntoViewIfNeeded();
  await video.evaluate(async (element: HTMLVideoElement) => { element.muted = true; await element.play(); });
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(.5);
  const media = await video.evaluate((element: HTMLVideoElement) => ({ duration: element.duration, width: element.videoWidth, height: element.videoHeight, error: element.error?.message ?? null }));
  expect(media.width).toBe(720); expect(media.height).toBe(1566); expect(media.duration).toBeCloseTo(22.133333, 2); expect(media.error).toBeNull();
  const captions = await (await page.request.get('/media/question/execution.vtt')).text();
  expect(captions).toContain('Local API shim and unreleased answer-key correction');
  expect(captions).toContain('automated participant');
  const time = (stamp: string) => stamp.split(':').reduce((value, part) => value * 60 + Number(part), 0);
  const cues = captions.trim().split('\n\n').slice(1).map(block => {
    const [range, ...lines] = block.split('\n');
    const [start, end] = range.split(' --> ').map(time);
    return { start, end, words: lines.join(' ').split(/\s+/).length };
  });
  expect(cues).toHaveLength(4);
  cues.forEach((cue, index) => {
    expect(cue.start).toBeLessThan(cue.end);
    expect(cue.end).toBeLessThanOrEqual(media.duration);
    expect(cue.words / (cue.end - cue.start)).toBeLessThanOrEqual(2.5);
    if (index) expect(cue.start).toBeGreaterThanOrEqual(cues[index - 1].end);
  });
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.textTracks[0]?.cues?.length ?? 0)).toBe(4);
  await video.evaluate((element: HTMLVideoElement) => { element.pause(); element.currentTime = 18; });
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeCloseTo(18, 1);
  await mkdir(evidence, { recursive: true });
  await writeFile(`${evidence}/playback.json`, JSON.stringify({ ...media, cues }, null, 2));
});

test('the actual answer, result and evidence remain readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 852 } });
  const page = await context.newPage();
  await page.goto('/labs/question/');
  await expect(page.locator('.ql-noscript')).toContainText('Chosen direction: Quick setup');
  await expect(page.locator('.ql-noscript li')).toHaveCount(3);
  await expect(page.locator('[data-question-next]')).toBeDisabled();
  await expect(page.locator('.ql-film video')).toHaveAttribute('controls', '');
  await page.locator('.ql-wire summary').click();
  await expect(page.locator('.ql-wire pre')).toContainText('"action": "answer"');
  await expect(page.locator('.ql-capture-grid figure')).toHaveCount(3);
  await expect(page.locator('a[href="/media/question/receipt.json"]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: `${evidence}/no-js-390.png`, fullPage: true, style: captureStyle });
  await context.close();
});
