import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import execution from '../../src/labs/curation/execution.json' with { type: 'json' };

const evidence = process.env.CURATION_EVIDENCE_DIR ?? process.env.PORTFOLIO_TEST_ARTIFACTS ?? 'test-results/curation';
async function ready(page: import('@playwright/test').Page) {
  await page.goto('/labs/curation/');
  await expect(page.locator('[data-curation-lab]')).toHaveAttribute('data-ready', 'true');
}
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('recorded merge and inverse change two identity fields while both controls stay identical', async ({ page }) => {
  const errors: string[] = []; const requests: { url: string; method: string }[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push({ url: request.url(), method: request.method() }));
  await ready(page);
  const lab = page.locator('[data-curation-lab]');
  const controls = await lab.locator('[data-control]').allTextContents();
  const originalURL = page.url();
  await lab.locator('[data-next]').click();
  await expect(lab).toHaveAttribute('data-stage', 'merged');
  await expect(lab.locator('[data-identity]')).toHaveText(['slate tablet', 'slate tablet']);
  await expect(lab.locator('[data-stage-status]')).toContainText('affected=2');
  expect(await lab.locator('[data-control]').allTextContents()).toEqual(controls);
  await lab.locator('[data-next]').click();
  await expect(lab).toHaveAttribute('data-stage', 'restored');
  await expect(lab.locator('[data-identity]')).toHaveText(['slate pad', 'slate pad']);
  await expect(lab.locator('[data-stage-status]')).toContainText('reverted=2, not_invertible=0');
  expect(await lab.locator('[data-control]').allTextContents()).toEqual(controls);
  await lab.locator('[data-next]').click();
  await expect(lab).toHaveAttribute('data-stage', 'before');
  expect(page.url()).toBe(originalURL);
  expect(errors).toEqual([]);
  expect(requests.every(request => request.method === 'GET')).toBe(true);
  expect(requests.every(request => request.url.startsWith(new URL(page.url()).origin))).toBe(true);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

test('sources, forward audit and inverse audit can be inspected independently of the stage', async ({ page }) => {
  await ready(page);
  const lab = page.locator('[data-curation-lab]');
  const source = lab.locator('[data-triple="1"] .cl-source').first();
  await source.locator(':scope > summary').click();
  await expect(source).toContainText('Mira uses Slate Pad for studio notes.');
  await source.locator('.cl-hash summary').click();
  await expect(source).toContainText(execution.fixtures[0].source.conversationFullRowHashes.before);
  await lab.locator('[data-audit="inverse"] > summary').click();
  await lab.locator('[data-audit="forward"] > summary').click();
  await expect(lab.locator('[data-audit="inverse"]')).toHaveAttribute('open', '');
  await expect(lab.locator('[data-audit="forward"]')).toHaveAttribute('open', '');
  await expect(lab.locator('[data-audit="forward"] .cl-audit-body')).toContainText('source=mcp');
  await expect(lab.locator('[data-audit="inverse"] .cl-audit-body')).toContainText('reverted=2');
  await expect(lab).toHaveAttribute('data-stage', 'before');
  await lab.locator('[data-stage-button="restored"]').click();
  await expect(source).toHaveAttribute('open', '');
  await expect(lab.locator('[data-audit="forward"]')).toHaveAttribute('open', '');
  await expect(lab.locator('[data-row-hash]').first()).toHaveText(execution.fixtures[0].states.restored.fullRowSha256);
});

test('keyboard actions retain focus and the method and related stories remain reachable', async ({ page }) => {
  await ready(page);
  const lab = page.locator('[data-curation-lab]');
  const next = lab.locator('[data-next]');
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(lab).toHaveAttribute('data-stage', 'merged');
  await expect(next).toBeFocused();
  await page.keyboard.press('Space');
  await expect(lab).toHaveAttribute('data-stage', 'restored');
  await expect(next).toBeFocused();
  const before = lab.locator('[data-stage-button="before"]');
  await before.focus(); await page.keyboard.press('Enter');
  await expect(before).toBeFocused();
  await expect(lab).toHaveAttribute('data-stage', 'before');
  await lab.locator('[data-stage-button=merged]').click();
  await lab.locator('[data-open-audits]').click();
  await expect(page).toHaveURL(/#cl-audit-title$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/labs\/curation\/$/);
  await expect(lab).toHaveAttribute('data-stage', 'merged');
  await lab.locator('.cl-method > summary').focus(); await page.keyboard.press('Enter');
  await expect(lab.locator('.cl-method')).toHaveAttribute('open', '');
  await expect(lab.locator('.cl-method')).toContainText('no compare-and-swap');
  await expect(page.getByRole('link', { name: 'Explore the Memory Lab illustration' })).toHaveAttribute('href', '/labs/memory/');
  await expect(page.getByRole('link', { name: 'Read the knowledge-graph story' })).toHaveAttribute('href', '/work/knowledge-graph/');
});

for (const width of [390, 768, 1440]) test(`curation is readable and accessible at ${width}px with action and result close together`, async ({ page }) => {
  await mkdir(evidence, { recursive: true });
  await page.setViewportSize({ width, height: 960 });
  await ready(page);
  const lab = page.locator('[data-curation-lab]');
  await lab.locator('[data-stage-button="merged"]').click();
  if (width === 390) {
    await lab.locator('[data-next]').scrollIntoViewIfNeeded();
    const action = await lab.locator('[data-next]').boundingBox();
    const result = await lab.locator('[data-triple="1"] [data-identity]').boundingBox();
    expect(result!.y - (action!.y + action!.height)).toBeLessThan(235);
    const primarySize = await lab.locator('[data-next]').evaluate(button => ({ font: parseFloat(getComputedStyle(button).fontSize), height: button.getBoundingClientRect().height }));
    expect(primarySize.font).toBeGreaterThanOrEqual(14); expect(primarySize.height).toBeGreaterThanOrEqual(44);
  }
  await lab.locator('[data-open-audits]').click();
  await lab.locator('[data-triple="1"] .cl-source > summary').first().click();
  await lab.locator('[data-triple="1"] .cl-hash > summary').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: `${evidence}/curation-${width}-sources-audits.png`, fullPage: true });
  await lab.locator('[data-stage-button="restored"]').click();
  expect((await new AxeBuilder({ page }).include('[data-curation-lab]').analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('without JavaScript the original, all sources, completed result and both audits remain readable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 960 } });
  const page = await context.newPage();
  await page.goto('/labs/curation/');
  await expect(page.locator('[data-next]')).toBeDisabled();
  await expect(page.locator('[data-stage-button="merged"]')).toBeDisabled();
  await expect(page.locator('.cl-nojs')).toContainText('immediate batch inverse restored both identity fields');
  await page.locator('[data-triple="1"] .cl-source > summary').first().click();
  await expect(page.locator('[data-triple="1"]')).toContainText('Mira uses Slate Pad');
  await page.locator('[data-audit="forward"] > summary').click();
  await page.locator('[data-audit="inverse"] > summary').click();
  await expect(page.locator('[data-audit="forward"] .cl-audit-action')).toHaveCount(2);
  await expect(page.locator('[data-audit="inverse"] .cl-audit-action')).toHaveCount(2);
  await page.locator('.cl-method > summary').click();
  await expect(page.getByRole('link', { name: 'Download the curated execution receipt' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});

test('public receipt preserves exact synthetic responses, identity/control/source hashes and source revision', async ({ request }) => {
  const response = await request.get('/media/curation/receipt.json');
  expect(response.ok()).toBe(true);
  const raw = await response.text();
  expect(raw).not.toMatch(/\/(?:home|Users|root|mnt)\/|127\.0\.0\.1|localhost|portfolio-project-|"authorization"\s*:|Bearer\s+[a-zA-Z0-9]|api[_-]?key|access_token|session_uuid/i);
  const receipt = JSON.parse(raw);
  expect(receipt).toEqual(execution);
  expect(receipt.source.revision).toBe('93881d2eca613fde498e0933405cee3a07220a4c');
  const expectedSource = {
    'app/Http/Controllers/Api/McpKnowledgeWriteController.php': '66decb33edc4742af68d81ce01320b2d94481baaf0ece9e87e8ec258056bb0c9',
    'app/Services/KnowledgeCurationService.php': '8870e6efc25d43a5d3c73c0e585fddf26ba576cef44593b53fc19f074184c483',
  };
  for (const [path, sha] of Object.entries(expectedSource)) expect(receipt.source.files.find((file: { path: string }) => file.path === path).sha256).toBe(sha);
  for (const record of receipt.requests) {
    expect(record.responseStatus).toBe(200);
    expect(createHash('sha256').update(record.responseRawBody).digest('hex')).toBe(record.responseBodySha256);
    expect(JSON.parse(record.responseRawBody)).toEqual(record.response);
  }
  for (const [index, fixture] of receipt.fixtures.entries()) {
    for (const stage of ['before', 'merged', 'restored']) {
      expect(digest(fixture.states[stage].row)).toBe(fixture.states[stage].fullRowSha256);
      expect(fixture.states[stage].row.conversation_id).toBe(fixture.source.conversationId);
      expect(fixture.source.conversationFullRowHashes[stage]).toBe(fixture.source.conversationFullRowHashes.before);
      expect(fixture.source.messageFullRowHashes[stage]).toBe(fixture.source.messageFullRowHashes.before);
    }
    if (index > 1) {
      expect(fixture.states.before).toEqual(fixture.states.merged);
      expect(fixture.states.before).toEqual(fixture.states.restored);
    } else {
      const field = index === 0 ? 'object' : 'subject';
      expect(fixture.states.merged.row[field]).toBe('slate tablet');
      expect(fixture.states.restored.row[field]).toBe(fixture.states.before.row[field]);
      expect(fixture.states.restored.fullRowSha256).not.toBe(fixture.states.before.fullRowSha256);
    }
  }
  const merge = receipt.requests.find((record: { label: string }) => record.label === 'type-scoped merge');
  expect(merge.json.entity_type).toBe('product'); expect(merge.response.affected).toBe(2);
  const inverse = receipt.requests.find((record: { label: string }) => record.label === 'revert latest identity batch');
  expect(inverse.response).toMatchObject({ reverted: 2, not_invertible: 0 });
  expect(receipt.inverseCorrelation).toHaveLength(2);
});

test('the captured state is labeled as a portfolio replay and its full-size PNG loads', async ({ page, request }) => {
  await ready(page);
  const capture = page.locator('.cl-capture');
  await capture.locator('summary').click();
  await expect(capture.locator('figcaption')).toContainText('not a shipped PanelForge screen');
  const image = capture.locator('img');
  await image.scrollIntoViewIfNeeded();
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth)).toBe(1328);
  expect(await image.evaluate((element: HTMLImageElement) => element.naturalHeight)).toBe(1526);
  await expect(capture.getByRole('link', { name: 'Open the full-size replay capture' })).toHaveAttribute('href', '/media/curation/recorded-merge.png');
  const png = await request.get('/media/curation/recorded-merge.png');
  expect(png.ok()).toBe(true);
  expect((await png.body()).byteLength).toBe(163322);
});
