import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const route = '/work/connected-tools/#which-platform';
const media = '/media/transit/';
const commit = '20d2d1c3ddc0378cdf7d5da54f00cfa6bcd91df9';
const choiceNames = ['IC 123 Changed platform', 'Re 5432 Cancelled service', 'ZZ 99999 No matching train'];

async function expectOutcome(page: import('@playwright/test').Page, outcome: string) {
  const section = page.locator('[data-transit-showcase]');
  await expect(section.locator(`input[value="${outcome}"]`)).toBeChecked();
  await expect(section.locator(`[data-transit-outcome="${outcome}"]`)).toBeVisible();
  await expect(section.locator('[data-transit-outcome]:visible')).toHaveCount(1);
}

test('native keyboard choices reveal the recorded delay, cancellation and no-match answers', async ({ page }) => {
  await page.goto(route);
  const section = page.locator('[data-transit-showcase]');
  expect(await section.evaluate(element => ({ before: element.previousElementSibling?.className, after: element.nextElementSibling?.id }))).toEqual({ before: 'case-nav wrap', after: 'the-problem' });
  await expectOutcome(page, 'changed');
  await expect(section.locator('.transit-changed')).toContainText('Changed from 3');
  await expect(section.locator('.transit-changed')).toContainText('14:32');
  await expect(section.locator('.transit-changed')).toContainText('14:39');
  await expect(section.locator('.transit-changed')).toContainText('Delayed 7 minutes');
  await section.getByRole('radio', { name: choiceNames[0], exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expectOutcome(page, 'cancelled');
  await expect(section.getByRole('radio', { name: choiceNames[1], exact: true })).toBeFocused();
  await expect(section.locator('.transit-cancelled')).toContainText('Cancelled');
  await expect(section.locator('.transit-cancelled')).not.toContainText('on time');
  expect(await section.getByRole('radio', { name: choiceNames[1], exact: true }).evaluate(element => getComputedStyle(element.closest('label')!).outlineStyle)).toBe('solid');
  await page.keyboard.press('ArrowRight');
  await expectOutcome(page, 'missing');
  await expect(section.locator('.transit-missing')).toContainText('No matching train on the board');
  await expect(section.locator('.transit-alternatives li')).toHaveText(['IC 123', 'A', 'Re 5432', 'B', 'L 45']);
  await section.locator('.transit-evidence > summary').focus();
  await page.keyboard.press('Enter');
  await expect(section.locator('.transit-evidence')).toHaveAttribute('open', '');
  await page.keyboard.press('Tab');
  await expect(section.locator('.transit-board summary')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(section.locator('.transit-board pre')).toBeVisible();
});

for (const width of [390, 768, 1440]) {
  test(`recorded outcomes and evidence are readable and accessible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(route);
    const section = page.locator('[data-transit-showcase]');
    for (const [index, outcome] of ['changed', 'cancelled', 'missing'].entries()) {
      await section.getByRole('radio', { name: choiceNames[index], exact: true }).check();
      await expectOutcome(page, outcome);
      const geometry = await section.evaluate(element => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        smallText: [...element.querySelectorAll('p, span, label, legend, summary, a, h4, li, pre')].filter(item => item.getBoundingClientRect().height > 0 && Number.parseFloat(getComputedStyle(item).fontSize) < 14).map(item => item.textContent),
        smallTargets: [...element.querySelectorAll('label, summary, a')].filter(item => item.getBoundingClientRect().height > 0 && item.getBoundingClientRect().height < 44).map(item => item.textContent),
      }));
      expect(geometry).toEqual({ overflow: false, smallText: [], smallTargets: [] });
    }
    await section.getByRole('radio', { name: choiceNames[0], exact: true }).check();
    await section.screenshot({ path: test.info().outputPath(`transit-${width}.png`) });
    await section.locator('.transit-evidence > summary').click();
    await section.locator('.transit-board summary').click();
    expect(await section.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    const axe = await new AxeBuilder({ page }).include('[data-transit-showcase]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(axe.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('native choices and evidence stay useful without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(route);
    await expectOutcome(page, 'changed');
    await page.getByRole('radio', { name: choiceNames[1], exact: true }).check();
    await expectOutcome(page, 'cancelled');
    await page.getByRole('radio', { name: choiceNames[2], exact: true }).focus();
    await page.keyboard.press('Space');
    await expectOutcome(page, 'missing');
    await page.locator('.transit-evidence > summary').click();
    await page.locator('.transit-board summary').click();
    await expect(page.locator('.transit-board pre')).toContainText('14:40 (on time)');
    await expect(page.locator('.transit-board pre')).toContainText('**CANCELLED**');
    await expect(page.getByRole('link', { name: 'Read the exact returned text' })).toBeVisible();
  } finally { await context.close(); }
});

test('touch targets select the recorded answers without a drag or script', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  try {
    const page = await context.newPage(); await page.goto(route);
    await page.locator('.transit-choices label').filter({ hasText: 'Cancelled service' }).tap();
    await expectOutcome(page, 'cancelled');
    await page.locator('.transit-choices label').filter({ hasText: 'No matching train' }).tap();
    await expectOutcome(page, 'missing');
  } finally { await context.close(); }
});

test('concise public receipts retain exact selected calls, relative source hashes and documented limits', async ({ request }) => {
  const response = await request.get(`${media}receipt.json`); expect(response.status()).toBe(200);
  const receipt = await response.json();
  expect(receipt.sample_date).toBe('2026-05-24');
  expect(receipt.source.commit).toBe(commit);
  expect(receipt.source.tag).toBe('v0.2.4');
  expect(receipt.source.advertised_server_version).toBe('0.1.0');
  const recorded = JSON.parse(await readFile(new URL('../../src/showcases/transit/recorded-lookups.json', import.meta.url), 'utf8'));
  expect(receipt.calls).toEqual(Object.values(recorded));
  expect(receipt.calls.map((call: { id: string }) => call.id)).toEqual(['departure-board', 'changed-platform', 'cancelled-service', 'unmatched-service']);
  expect(receipt.limits.join(' ')).toContain('no trip response');
  expect(receipt.presentation.cancellation).toContain('on-time timestamp');
  for (const entry of receipt.source.files) { expect(entry.path).not.toMatch(/^\//); expect(entry.sha256).toMatch(/^[a-f0-9]{64}$/); }
  const text = await response.text();
  expect(text).not.toMatch(/\/home\/|localhost|REJSEPLANEN_API_KEY|exactSource|originalWire|constructedWire|loaderSource|process\.env|192\.0\.2\./);
  expect(Buffer.byteLength(text)).toBeLessThan(15000);
  const transcript = await request.get(`${media}transcript.txt`); expect(transcript.status()).toBe(200);
  const transcriptText = await transcript.text();
  for (const call of receipt.calls) expect(transcriptText).toContain(call.returned.content[0].text);
  const fragment = JSON.parse(await readFile(new URL('../../src/showcases/transit/media-provenance.fragment.json', import.meta.url), 'utf8'));
  expect(fragment.assets).toHaveLength(2);
  for (const entry of fragment.assets) {
    const asset = await request.get(`/media/${entry.file}`); expect(asset.status()).toBe(200);
    expect(createHash('sha256').update(await asset.body()).digest('hex')).toBe(entry.sha256);
    expect((await asset.body()).length).toBe(entry.bytes);
  }
});

test('the recorded choices make no API requests and belong only to Connected tools', async ({ page, request, baseURL }) => {
  const unexpected: string[] = [];
  page.on('request', item => { if (item.method() !== 'GET' || new URL(item.url()).origin !== new URL(baseURL!).origin || /\/api\//.test(item.url())) unexpected.push(`${item.method()} ${item.url()}`); });
  await page.goto(route);
  const section = page.locator('[data-transit-showcase]');
  await expect(section).toContainText('Sample data · 24 May 2026');
  await expect(section).toContainText('not current travel information');
  expect(await section.locator('script').count()).toBe(0);
  for (const name of choiceNames) await section.getByRole('radio', { name, exact: true }).check();
  await section.locator('.transit-evidence > summary').click();
  await section.getByRole('link', { name: 'Read the exact returned text' }).click();
  await expect(page).toHaveURL(new RegExp(`${media}transcript.txt$`));
  expect(unexpected).toEqual([]);
  for (const slug of ['panelforge', 'connected-agents', 'connected-tools', 'knowledge-graph', 'agent-workbench', 'conference-notes']) {
    const response = await request.get(`/work/${slug}/`); expect(response.status()).toBe(200);
    expect((await response.text()).includes('data-transit-showcase')).toBe(slug === 'connected-tools');
  }
});
