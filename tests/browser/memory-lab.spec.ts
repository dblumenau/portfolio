import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import sample from '../../src/labs/memory/sample.json' with { type: 'json' };

test('all original labels are searchable, including unknown types and versions', async ({ page }) => {
  await page.goto('/labs/memory/');
  await expect(page.locator('[data-memory-lab]')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('[data-entity]:visible')).toHaveCount(sample.nodes.length);
  await page.getByLabel('Entity type', { exact: true }).selectOption('unknown');
  await expect(page.locator('[data-entity]:visible')).toHaveCount(2);
  await expect(page.locator('[data-entity]:visible')).toHaveText(['vueunknown', 'inertiaunknown']);
  await page.locator('[data-entity="vue"]').click();
  await expect(page.locator('[data-focus-title]')).toHaveText('vue');
  await expect(page.locator('[data-focus-meta]')).toContainText('unknown');
  await expect(page.locator('[data-connection-list] button')).toHaveCount(3);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByLabel('Search project or software').fill('laravel-12');
  await expect(page.locator('[data-entity]:visible')).toHaveCount(2);
  await page.getByLabel('Search project or software').fill('an-unknown-project');
  await expect(page.locator('[data-entity-empty]')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  for (const node of sample.nodes) {
    await page.getByLabel('Search project or software').fill(node.label);
    await expect(page.locator(`[data-entity="${node.label}"]`)).toBeVisible();
  }
});

test('a curation action changes both representations and undo restores the previous view', async ({ page }) => {
  await page.goto('/labs/memory/');
  await page.locator('[data-entity="panelforge-mcp"]').click();
  const relation = 'Inspect panelforge-mcp → built_with → typescript';
  const connection = page.locator('[data-connection-list]').getByRole('button', { name: relation, exact: true });
  await connection.click();
  await expect(page.locator('[data-subject]')).toHaveText('panelforge-mcp');
  await expect(page.locator('[data-object]')).toHaveText('typescript');
  await page.getByLabel('Search project or software').fill('mcp');
  await page.getByLabel('Entity type', { exact: true }).selectOption('project');
  const beforeGraph = await page.locator('[data-graph] button').evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')));
  await page.getByRole('button', { name: 'Set aside in this demo', exact: false }).click();
  await expect(page.locator('[data-sample-count]')).toHaveText('32 of 33 connections visible');
  await expect(connection).toHaveCount(0);
  await expect(page.locator('[data-graph]').getByRole('button', { name: relation, exact: true })).toHaveCount(0);
  await expect(page.locator('[data-receipt-list]')).toContainText('panelforge-mcp → built_with → typescript');
  await expect(page.locator('[data-receipt-list]')).toContainText('Reason: visitor practice');
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.locator('[data-entity="vue"]').click();
  await page.getByRole('button', { name: 'Undo last edit', exact: true }).click();
  await expect(page.locator('[data-focus-title]')).toHaveText('panelforge-mcp');
  await expect(connection).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Search project or software')).toHaveValue('mcp');
  await expect(page.getByLabel('Entity type', { exact: true })).toHaveValue('project');
  await expect(page.locator('[data-sample-count]')).toHaveText('33 of 33 connections visible');
  expect(await page.locator('[data-graph] button').evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')))).toEqual(beforeGraph);
  await expect(page.locator('[data-receipt-list]')).toContainText('Restored exact before-state');
  await expect(page.getByRole('button', { name: 'Undo last edit', exact: true })).toBeDisabled();
});

test('the guided path uses the sample and reset clears edits and filters', async ({ page }) => {
  await page.goto('/labs/memory/');
  await page.getByRole('button', { name: /02 Inspect what it means/ }).click();
  await expect(page.locator('[data-source-quote]')).toHaveText('“Laravel + Vue 3 + Inertia.js app”');
  await expect(page.locator('[data-source]')).toBeVisible();
  await page.getByRole('button', { name: /03 Set this connection aside/ }).click();
  await expect(page.locator('[data-edit-status]')).toContainText('Set aside in this demo');
  await expect(page.locator('[data-sample-count]')).toHaveText('32 of 33 connections visible');
  await page.getByLabel('Entity type', { exact: true }).selectOption('project');
  await page.getByLabel('Search project or software').fill('chat');
  await page.getByRole('button', { name: 'Reset sample', exact: true }).click();
  await expect(page.getByLabel('Search project or software')).toHaveValue('');
  await expect(page.getByLabel('Entity type', { exact: true })).toHaveValue('all');
  await expect(page.locator('[data-entity]:visible')).toHaveCount(31);
  await expect(page.locator('[data-sample-count]')).toHaveText('33 of 33 connections visible');
  await expect(page.locator('[data-receipt-list]')).toContainText('Reset to the exported sample');
  await page.reload();
  await expect(page.locator('[data-receipt-list]')).toContainText('No edits yet');
});

test('pagination and multiple undo operations preserve distinct versioned labels', async ({ page }) => {
  await page.goto('/labs/memory/');
  await page.getByRole('button', { name: 'Next connections', exact: true }).click();
  const before = await page.locator('[data-neighborhood-count]').textContent();
  const button = page.locator('[data-graph] button').first();
  const beforeLabel = await button.getAttribute('aria-label');
  await button.click();
  await page.getByRole('button', { name: 'Set aside in this demo', exact: false }).click();
  await page.locator('[data-entity="panelforge-chat-app"]').click();
  await page.getByRole('button', { name: 'Set aside in this demo', exact: false }).click();
  await expect(page.locator('[data-connection-empty]')).toBeVisible();
  await expect(page.locator('[data-sample-count]')).toHaveText('31 of 33 connections visible');
  await page.getByRole('button', { name: 'Undo last edit', exact: true }).click();
  await expect(page.locator('[data-focus-title]')).toHaveText('panelforge-chat-app');
  await page.getByRole('button', { name: 'Undo last edit', exact: true }).click();
  await expect(page.locator('[data-focus-title]')).toHaveText('panelforge');
  await expect(page.locator('[data-neighborhood-count]')).toHaveText(before!);
  await expect(page.locator('[data-graph]').getByRole('button', { name: beforeLabel!, exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-entity="vue-3"]')).toHaveCount(1);
  await expect(page.locator('[data-entity="vue-js"]')).toHaveCount(1);
});

test('a native keyboard path selects, sets aside and restores a connection', async ({ page }) => {
  await page.goto('/labs/memory/');
  const entity = page.locator('[data-entity="panelforge-mcp"]');
  await entity.focus();
  await page.keyboard.press('Enter');
  await expect(entity).toHaveAttribute('aria-pressed', 'true');
  const relation = page.locator('[data-graph] button').first();
  await relation.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-graph] button').first()).toBeFocused();
  await page.locator('[data-set-aside]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-sample-count]')).toHaveText('32 of 33 connections visible');
  await page.locator('[data-undo]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-sample-count]')).toHaveText('33 of 33 connections visible');
});

test('the real sample remains readable with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${test.info().project.use.baseURL}/labs/memory/`);
  await expect(page.locator('.ml-noscript li')).toHaveCount(33);
  await expect(page.locator('[data-entity]')).toHaveCount(31);
  await expect(page.getByRole('link', { name: 'Read the curation story', exact: false })).toBeVisible();
  await context.close();
});

for (const width of [390, 834, 1440]) {
  test(`the lab fits ${width}px and keeps readable accessible interactions`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/labs/memory/');
    await expect(page.locator('[data-memory-lab]')).toHaveAttribute('data-ready', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('[data-graph] button')).toHaveCount(width <= 600 ? 4 : 8);
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations.map((violation) => `${violation.id}: ${violation.description}`)).toEqual([]);
  });
}


test('phone selection, inspection and undo stay beside the chosen relationship', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/labs/memory/');
  await page.getByLabel('Choose an entity', { exact: true }).selectOption('laravel');
  const relation = page.locator('[data-graph]').getByRole('button', { name: 'Inspect panelforge → built_with → laravel', exact: true });
  await relation.click();
  await expect(page.locator('[data-selection-tuple]')).toHaveText('panelforge → built_with → laravel');
  await expect(page.locator('.ml-connection-details')).not.toHaveAttribute('open');
  await expect.poll(async () => page.locator('.ml-selection-actions').evaluate(element => { const box = element.getBoundingClientRect(); return box.top >= 0 && box.bottom <= innerHeight; })).toBe(true);
  await page.locator('[data-map-inspect]').click();
  await expect(page.locator('[data-source-quote]')).toContainText('panel-forge Laravel codebase');
  await expect(page.locator('#ml-inspector-title')).toBeFocused();
  await expect(page.locator('[data-object]')).toHaveText('laravel');
  await page.locator('[data-return-map]').click();
  await expect(page.locator('[data-map-inspect]')).toBeFocused();
  await page.locator('[data-map-edit]').click();
  await expect(page.locator('[data-inline-receipt]')).toContainText('Set aside: panelforge → built_with → laravel');
  await expect(page.locator('[data-inline-undo]')).toBeFocused();
  await expect.poll(async () => page.locator('[data-inline-undo]').evaluate(element => { const box = element.getBoundingClientRect(); return box.top >= 0 && box.bottom <= innerHeight; })).toBe(true);
  await page.locator('[data-inline-undo]').click();
  await expect(page.locator('[data-focus-select]')).toHaveValue('laravel');
  await expect(page.locator('[data-sample-count]')).toHaveText('33 of 33 connections visible');
  await expect(page.locator('[data-inline-receipt]')).toContainText('Restored: panelforge → built_with → laravel');
  await expect(page.locator('[data-map-edit]')).toBeFocused();
});

test('guide inspection preserves a visitor-selected tuple and filters', async ({ page }) => {
  await page.goto('/labs/memory/');
  await page.locator('[data-entity="panelforge-mcp"]').click();
  await page.getByLabel('Search project or software').fill('mcp');
  const tuple = await page.locator('[data-selection-tuple]').textContent();
  await page.locator('[data-guide="inspect"]').click();
  await expect(page.locator('[data-selection-tuple]')).toHaveText(tuple!);
  await expect(page.getByLabel('Search project or software')).toHaveValue('mcp');
  await expect(page.locator('[data-focus-title]')).toHaveText('panelforge-mcp');
  await page.locator('[data-guide="edit"]').click();
  await expect(page.locator('[data-inline-receipt]')).toContainText(tuple!);
  await page.locator('[data-inline-undo]').click();
  await expect(page.locator('[data-selection-tuple]')).toHaveText(tuple!);
});
