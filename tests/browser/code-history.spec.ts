import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const route = '/work/panelforge/#code-history';
const media = '/media/code-history/';
const choices = ['Week', 'Peek', 'Transcript'];

async function expectFrame(page: import('@playwright/test').Page, id: string) {
  const section = page.locator('[data-code-history-showcase]');
  await expect(section.locator(`input[value="${id}"]`)).toBeChecked();
  await expect(section.locator('[data-history-frame]:visible')).toHaveCount(1);
  const image = section.locator(`[data-history-frame="${id}"] img`);
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth === 1440)).toBe(true);
}

test('native choices reveal actual captures and sit between workflow and decisions', async ({ page }) => {
  await page.goto(route);
  const section = page.locator('[data-code-history-showcase]');
  expect(await section.evaluate(element => {
    const sections = [...element.parentElement!.querySelectorAll(':scope > section')];
    const index = sections.indexOf(element);
    return { before: sections[index - 1]?.id, after: sections[index + 1]?.id };
  })).toEqual({ before: 'the-workflow', after: 'the-decisions' });
  await expect(section.getByRole('heading', { name: /Find the work.*behind a change/ })).toBeVisible();
  await expectFrame(page, 'week');
  await section.getByRole('radio', { name: 'Week', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expectFrame(page, 'peek');
  await expect(section.getByRole('radio', { name: 'Peek', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expectFrame(page, 'transcript');
  expect(await section.getByRole('radio', { name: 'Transcript', exact: true }).evaluate(element => getComputedStyle(element.closest('label')!).outlineStyle)).toBe('solid');
  await section.getByRole('link', { name: 'Open full-size Transcript capture' }).click();
  await expect(page).toHaveURL(new RegExp(`${media}transcript.png$`));
  await page.goBack();
  await expect(section).toBeVisible();
});

for (const width of [390, 834, 1440]) {
  test(`captures, disclosure and native controls remain readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(route);
    const section = page.locator('[data-code-history-showcase]');
    for (const choice of choices) {
      await section.getByRole('radio', { name: choice, exact: true }).check();
      await expectFrame(page, choice.toLowerCase());
    }
    await section.locator('.history-method > summary').click();
    await expect(section.locator('.history-method')).toContainText('Login and view preferences can write separate state');
    const geometry = await section.evaluate(element => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      smallText: [...element.querySelectorAll('p, figcaption, label, legend, summary, a')].filter(item => Number.parseFloat(getComputedStyle(item).fontSize) < 14).map(item => item.textContent),
      smallTargets: [...element.querySelectorAll('label, summary, a')].filter(item => getComputedStyle(item).display !== 'none' && item.getBoundingClientRect().width > 0 && item.getBoundingClientRect().height < 44).map(item => item.textContent),
    }));
    expect(geometry).toEqual({ overflow: false, smallText: [], smallTargets: [] });
    const axe = await new AxeBuilder({ page }).include('[data-code-history-showcase]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(axe.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
    expect(errors).toEqual([]);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await section.screenshot({ path: test.info().outputPath(`code-history-${width}.png`) });
  });
}

test('native image choices, enlargement and evidence work without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(route);
  const section = page.locator('[data-code-history-showcase]');
  await expectFrame(page, 'week');
  await section.getByRole('radio', { name: 'Peek', exact: true }).check();
  await expectFrame(page, 'peek');
  await section.getByRole('link', { name: 'Open full-size Peek capture' }).click();
  await expect(page).toHaveURL(new RegExp(`${media}peek.png$`));
  await page.goBack();
  await section.locator('.history-film > summary').click();
  await expect(section.locator('video')).toBeVisible();
  await section.locator('.history-method > summary').click();
  await expect(section.getByRole('link', { name: 'Read the concise source and file receipt' })).toBeVisible();
  await context.close();
});

test('optional film has native playback, seeking and six correctly bounded scene captions', async ({ page }) => {
  await page.goto(route);
  const section = page.locator('[data-code-history-showcase]');
  const video = section.locator('video');
  await expect(video).toHaveAttribute('controls', '');
  await expect(video).toHaveAttribute('preload', 'none');
  await expect(video).not.toHaveAttribute('autoplay', '');
  await expect(video.locator('track')).toHaveAttribute('default', '');
  await section.locator('.history-film > summary').click();
  await video.focus();
  await page.keyboard.press('Space');
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => !element.paused && element.currentTime > 0)).toBe(true);
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.duration)).toBeCloseTo(25.04, 2);
  await video.evaluate((element: HTMLVideoElement) => { element.pause(); element.currentTime = 18; element.textTracks[0].mode = 'hidden'; });
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.textTracks[0].cues?.length ?? 0)).toBe(6);
  const cues = await video.evaluate((element: HTMLVideoElement) => [...(element.textTracks[0].cues ?? [])].map(cue => ({ start: cue.startTime, end: cue.endTime, text: (cue as VTTCue).text })));
  expect(cues.at(-1)?.end).toBe(25.04);
  expect(cues.at(-1)?.start).toBe(17.4);
  expect(cues[4].text).toBe('Transcript: read the imported conversation across the full pane');
  expect(cues.some(cue => /no composer/.test(cue.text))).toBe(false);
  expect(await video.evaluate((element: HTMLVideoElement) => Math.abs(element.currentTime - 18) < 0.1)).toBe(true);
  await video.focus(); await page.keyboard.press('Space');
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(false);
  await section.locator('.history-film > summary').click();
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
});

test('six published candidate files match their hashes and concise synthetic receipt', async ({ request }) => {
  const fragment = JSON.parse(await readFile(new URL('../../src/showcases/code-history/media-provenance.fragment.json', import.meta.url), 'utf8'));
  expect(fragment.assets).toHaveLength(6);
  for (const entry of fragment.assets) {
    const response = await request.get(`/media/${entry.file}`);
    expect(response.status(), entry.file).toBe(200);
    expect(createHash('sha256').update(await response.body()).digest('hex'), entry.file).toBe(entry.sha256);
    expect((await response.body()).length, entry.file).toBe(entry.bytes);
  }
  const response = await request.get(`${media}receipt.json`);
  const receipt = await response.json();
  expect(receipt.counts).toEqual({ sessions: 4, canonicalEvents: 29, turns: 5, humanPrompts: 5, mirroredMessages: 10, summaries: 4, analysisRows: 0 });
  expect(receipt.source.unreleasedUiFix.addedLines).toBe(2);
  expect(receipt.preservingArchive.canonicalBytesAndRowsUnchanged).toBe(true);
  expect(receipt.media.film.durationSeconds).toBe(25.04);
  expect(receipt.media.film.finalCaptionEndSeconds).toBe(25.04);
  expect(receipt.media.film.reloadCaptionStartSeconds).toBe(17.4);
  expect(receipt.responses.map((item: { status: number }) => item.status)).toEqual([401, 403, 422, 201, 201, 201, 201, 200]);
  expect(await response.text()).not.toMatch(/\/home\/|localhost|127\.0\.0\.1|DB_PASSWORD|auth-state|archive@example|previews\/|runtime-env|production.*\d.*sessions/i);
});

test('the static section calls no app, account, generation or external endpoint', async ({ page, baseURL }) => {
  const unexpected: string[] = [];
  await page.route('**/*', route => {
    const request = route.request();
    if (request.method() !== 'GET' || new URL(request.url()).origin !== new URL(baseURL!).origin || /\/api\/|narrate|import-jsonl/.test(request.url())) { unexpected.push(`${request.method()} ${request.url()}`); return route.abort(); }
    return route.continue();
  });
  await page.goto(route);
  const section = page.locator('[data-code-history-showcase]');
  for (const choice of choices) await section.getByRole('radio', { name: choice, exact: true }).check();
  await section.locator('.history-method > summary').click();
  await section.getByRole('link', { name: 'Read the concise source and file receipt' }).click();
  await expect(page).toHaveURL(new RegExp(`${media}receipt.json$`));
  expect(unexpected).toEqual([]);
});

test('Code History belongs only to the existing PanelForge case', async ({ request }) => {
  for (const slug of ['panelforge', 'connected-agents', 'connected-tools', 'knowledge-graph', 'agent-workbench', 'conference-notes']) {
    const response = await request.get(`/work/${slug}/`);
    expect(response.status()).toBe(200);
    expect((await response.text()).includes('data-code-history-showcase')).toBe(slug === 'panelforge');
  }
  expect((await request.get('/labs/code-history/')).status()).toBe(404);
});
