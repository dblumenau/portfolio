import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const route = '/work/panelforge/#image-revision';
const media = '/media/image-revision/';
const originalHash = '30a1dc254b749affc24493d9ed9ddef9ea55da983287db274a39f7386b406fb4';
const revisionHash = '0a88b6ca8c77d834a580d289a95024f246258149054a9e47e33a99cae1eb9ea6';

async function expectView(page: import('@playwright/test').Page, view: 'original' | 'revision' | 'both') {
  const comparison = page.locator('[data-image-revision]');
  await expect(comparison.locator(`input[value="${view}"]`)).toBeChecked();
  if (view === 'revision') await expect(comparison.locator('.revision-original')).toBeHidden();
  else await expect(comparison.locator('.revision-original')).toBeVisible();
  if (view === 'original') await expect(comparison.locator('.revision-result')).toBeHidden();
  else await expect(comparison.locator('.revision-result')).toBeVisible();
}

test('the real comparison sits before the case prose and changes images with native keyboard controls', async ({ page }) => {
  await page.goto(route);
  const section = page.locator('[data-image-revision]');
  expect(await section.evaluate(element => ({ before: element.previousElementSibling?.className, after: element.nextElementSibling?.id }))).toEqual({ before: 'case-nav wrap', after: 'the-problem' });
  await expectView(page, 'both');
  await section.getByRole('radio', { name: 'Both images' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expectView(page, 'revision');
  await expect(section.getByRole('radio', { name: 'Revision', exact: true })).toBeFocused();
  await expect(section.locator('.revision-result img')).toHaveAttribute('src', `${media}revision-preview-960.webp`);
  await expect(section.getByRole('link', { name: 'Download the revision JPEG' })).toHaveAttribute('href', `${media}revision.jpg`);
  await page.keyboard.press('ArrowLeft');
  await expectView(page, 'original');
  await expect(section.locator('.revision-original img')).toHaveAttribute('src', `${media}original-preview-960.webp`);
  await expect(section.getByRole('link', { name: 'Download the original JPEG' })).toHaveAttribute('href', `${media}original.jpg`);
  expect(await section.getByRole('radio', { name: 'Original', exact: true }).evaluate(element => getComputedStyle(element.closest('label')!).outlineStyle)).toBe('solid');
  await page.keyboard.press('ArrowRight');
  await expectView(page, 'revision');
  await section.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(section.locator('details')).toHaveAttribute('open', '');
  await page.keyboard.press('Tab');
  await expect(section.getByRole('link', { name: 'Open the full gallery detail capture' })).toBeFocused();
});

for (const width of [390, 768, 1440]) {
  test(`comparison and expanded evidence are readable and accessible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(route);
    const section = page.locator('[data-image-revision]');
    for (const name of ['Original', 'Revision', 'Both images']) {
      await section.getByRole('radio', { name, exact: true }).check();
      const image = section.locator('.revision-images figure:visible img').first();
      await expect(image).toBeVisible();
      await image.evaluate((element: HTMLImageElement) => element.decode());
      expect(await image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0 && /-preview-(480|960|1264)\.webp$/.test(element.currentSrc))).toBe(true);
    }
    await section.locator('summary').click();
    await section.locator('.revision-evidence img').evaluateAll(async images => { await Promise.all(images.map(image => (image as HTMLImageElement).decode())); });
    const geometry = await section.evaluate(element => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      smallText: [...element.querySelectorAll('p, figcaption, label, legend, summary, a')].filter(item => Number.parseFloat(getComputedStyle(item).fontSize) < 14).map(item => item.textContent),
      smallTargets: [...element.querySelectorAll('label, summary, a')].filter(item => item.getBoundingClientRect().height < 44).map(item => item.textContent),
    }));
    expect(geometry).toEqual({ overflow: false, smallText: [], smallTargets: [] });
    const axe = await new AxeBuilder({ page }).include('[data-image-revision]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(axe.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
    expect(errors).toEqual([]);
    await section.screenshot({ path: test.info().outputPath(`comparison-${width}.png`) });
  });
}

test('touch users can select an entire image without dragging', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto(route);
  await page.locator('[data-image-revision] label').filter({ hasText: /^Revision$/ }).tap();
  await expectView(page, 'revision');
  await page.locator('[data-image-revision] label').filter({ hasText: /^Original$/ }).tap();
  await expectView(page, 'original');
  await context.close();
});

test('comparison and native evidence details remain useful without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(route);
  await expectView(page, 'both');
  await page.getByRole('radio', { name: 'Original', exact: true }).check();
  await expectView(page, 'original');
  await page.getByRole('radio', { name: 'Revision', exact: true }).focus();
  await page.keyboard.press('Space');
  await expectView(page, 'revision');
  await page.locator('.revision-evidence summary').click();
  await expect(page.getByRole('link', { name: 'Read the file and reference checks' })).toBeVisible();
  await expect(page.locator('.revision-evidence')).toContainText('separate conversations');
  await context.close();
});

test('published JPEG bytes and explicit equality checks match the actual controlled run', async ({ request }) => {
  const response = await request.get(`${media}receipt.json`);
  expect(response.status()).toBe(200);
  const receipt = await response.json();
  expect(receipt.reference_checks).toEqual({ revision_parent_equals_original: true, revision_root_equals_original: true, ordered_references_equal_original_only: true, original_children_include_revision: true, source_conversations_are_different: true });
  expect(receipt.generation_calls).toBe(2);
  expect(receipt.completed_jobs).toBe(2);
  expect(receipt.outputs_per_job).toEqual([1, 1]);
  expect(receipt.file_checks.original_sha256_before_revision).toBe(originalHash);
  expect(receipt.file_checks.original_sha256_after_revision).toBe(originalHash);
  expect(receipt.file_checks.public_original_equals_downloaded_original).toBe(true);
  expect(receipt.file_checks.public_revision_equals_downloaded_revision).toBe(true);
  expect(receipt.visual_acceptance.pixel_perfect_preservation_established).toBe(false);
  for (const [name, hash] of [['original.jpg', originalHash], ['revision.jpg', revisionHash]]) {
    const asset = await request.get(`${media}${name}`);
    expect(asset.status()).toBe(200);
    expect(createHash('sha256').update(await asset.body()).digest('hex')).toBe(hash);
  }
  expect(receipt.file_checks.public_original_sha256).toBe(originalHash);
  expect(receipt.file_checks.public_revision_sha256).toBe(revisionHash);
  const text = await response.text();
  expect(text).not.toMatch(/(?:https?:|\/home\/|localhost|source_conversation_id|job_id|message_id|\b4337[23]\b|\b2073[78]\b|\b3808621\b)/);
  const fragment = JSON.parse(await readFile(new URL('../../src/showcases/image-revision/media-provenance.fragment.json', import.meta.url), 'utf8'));
  expect(fragment.assets).toHaveLength(5);
  for (const entry of fragment.assets) {
    const asset = await request.get(`/media/${entry.file}`);
    expect(asset.status(), entry.file).toBe(200);
    expect(createHash('sha256').update(await asset.body()).digest('hex'), entry.file).toBe(entry.sha256);
  }
});

test('review interactions use only local static GET assets and no account or generation endpoints', async ({ page, baseURL }) => {
  const unexpected: string[] = [];
  page.on('request', request => { if (request.method() !== 'GET' || new URL(request.url()).origin !== new URL(baseURL!).origin || /\/api\/|generate_image|\/image-jobs/.test(request.url())) unexpected.push(`${request.method()} ${request.url()}`); });
  await page.goto(route);
  const section = page.locator('[data-image-revision]');
  for (const name of ['Original', 'Revision', 'Both images']) await section.getByRole('radio', { name, exact: true }).check();
  await section.locator('summary').click();
  await section.locator('.revision-evidence img').evaluateAll(async images => { await Promise.all(images.map(image => (image as HTMLImageElement).decode())); });
  await section.getByRole('link', { name: 'Read the file and reference checks' }).click();
  await expect(page).toHaveURL(new RegExp(`${media}receipt.json$`));
  expect(unexpected).toEqual([]);
});

test('the showcase belongs to the existing PanelForge case only', async ({ request }) => {
  for (const slug of ['panelforge', 'connected-agents', 'connected-tools', 'knowledge-graph', 'agent-workbench', 'conference-notes']) {
    const response = await request.get(`/work/${slug}/`);
    expect(response.status()).toBe(200);
    expect((await response.text()).includes('data-image-revision')).toBe(slug === 'panelforge');
  }
});
