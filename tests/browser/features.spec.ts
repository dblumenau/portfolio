import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { features } from '../../src/data/features';

test('the catalogue combines filters, shares state and resets', async ({ page }) => {
  await page.goto('/features/');
  await expect(page.locator('.atlas-row:visible')).toHaveCount(features.length);
  await page.getByLabel('Area', { exact: true }).selectOption('Memory');
  await expect(page.locator('.atlas-row:visible')).toHaveCount(features.filter((feature) => feature.area === 'Memory').length);
  await page.getByLabel('Topic', { exact: true }).selectOption('Knowledge graph');
  await expect(page.locator('.atlas-row:visible')).toHaveCount(features.filter((feature) => feature.area === 'Memory' && feature.topics.includes('Knowledge graph')).length);
  await expect(page).toHaveURL(/area=Memory/);
  await page.reload();
  await expect(page.getByLabel('Topic', { exact: true })).toHaveValue('Knowledge graph');
  await page.getByLabel('Story date', { exact: true }).selectOption('2026-08');
  await expect(page.locator('.atlas-row:visible')).toHaveCount(features.filter((feature) => feature.area === 'Memory' && feature.topics.includes('Knowledge graph') && feature.date.startsWith('2026-08')).length);
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.atlas-row:visible')).toHaveCount(features.length);
  await expect(page).toHaveURL(/\/features\/$/);
  await page.getByLabel('Find a feature').fill('nothing-matches-this-clue');
  await expect(page.locator('[data-atlas-empty]')).toBeVisible();
  await expect(page.locator('[data-atlas-count]')).toHaveText(`0 feature stories of ${features.length}`);
});

test('all feature links resolve to distinct stories with evidence notes', async ({ request }) => {
  for (const feature of features) {
    const response = await request.get(`/features/${feature.slug}/`);
    expect(response.status(), feature.slug).toBe(200);
    const html = await response.text();
    expect(html).toContain(feature.title);
    expect(html).toContain('Source information sheet');
    expect(html).toContain(feature.slug === 'workspace-hierarchy' ? 'data-workspace-showcase' : feature.slug === 'shared-engine-surface' ? 'data-engine-contract' : 'explanatory exhibit');
    expect(html).not.toMatch(/conversation_id|\/home\/|conversations\/\d+/);
  }
});

test('exhibits and source sheets work through native keyboard controls', async ({ page }) => {
  await page.goto('/features/graph-curation/');
  const example = page.locator('.feature-example-choices summary').filter({ hasText: 'Inspect an inverse action' });
  await example.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Restore the recorded before-state' })).toBeVisible();
  await page.locator('.feature-sources summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Source areas' })).toBeVisible();
});

test('the catalogue and source notes remain readable without scripts', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${test.info().project.use.baseURL}/features/`);
  await expect(page.locator('.atlas-row:visible')).toHaveCount(features.length);
  await page.getByRole('link', { name: 'Read about FindThat' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Recover the detail you half remember.');
  await page.locator('.feature-sources summary').click();
  await expect(page.getByRole('heading', { name: 'Source areas' })).toBeVisible();
  await context.close();
});

for (const width of [390, 768, 1440]) {
  test(`atlas and feature story fit ${width}px and expose accessible controls`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/features/', '/features/knowledge-graph/']) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), path).toBe(true);
      const result = await new AxeBuilder({ page }).analyze();
      expect(result.violations.map((violation) => `${violation.id}: ${violation.description}`), path).toEqual([]);
    }
  });
}

test('image revisions retain their shared ancestor and an inspectable preferred sibling', async ({ page }) => {
  await page.goto('/features/branching-workbench/');
  await page.getByRole('button', { name: '02 / Warm terracotta' }).click();
  await expect(page.locator('[data-poster]')).toHaveClass(/poster-warm/);
  await expect(page.locator('[data-branch-receipt]')).toContainText('Both revisions retain the original brief and reference');
  await page.getByRole('button', { name: 'Mark this direction preferred' }).click();
  await expect(page.locator('[data-preference]')).toContainText('Preferred: warm terracotta');
  await page.getByRole('button', { name: '01 / Quiet blue' }).click();
  await expect(page.locator('[data-poster]')).not.toHaveClass(/poster-warm/);
  await expect(page.locator('[data-preference]')).toContainText('Preferred: warm terracotta');
});

test('gallery handoff keeps the same synthetic reference and resets explicitly', async ({ page }) => {
  await page.goto('/features/reference-to-chat/');
  await page.getByRole('button', { name: 'Send reference to chat' }).click();
  await expect(page.locator('[data-chip]')).toBeVisible();
  await expect(page.locator('[data-chip]')).toHaveText('Lantern poster · same reference');
  await expect(page.locator('[data-attachment]')).toContainText('attached to this request');
  await page.getByRole('button', { name: 'Reset handoff' }).click();
  await expect(page.locator('[data-chip]')).toBeHidden();
});

test('the policy exhibit recalculates exact grants when a profile changes', async ({ page }) => {
  await page.goto('/features/native-tool-boundary-profiles/');
  await page.getByRole('button', { name: 'Write a file' }).click();
  await expect(page.locator('[data-policy-result]')).toContainText('Denied: write_file');
  await page.getByRole('button', { name: 'Read + edit', exact: true }).click();
  await expect(page.locator('[data-policy-result]')).toContainText('Allowed: write_file');
  await page.getByRole('button', { name: 'Run a shell' }).click();
  await expect(page.locator('[data-policy-result]')).toContainText('Denied: run_shell');
  await page.getByRole('button', { name: 'Read a file' }).click();
  await expect(page.locator('[data-policy-result]')).toContainText('Allowed: read_file');
});

test('identical URLs cannot substitute for browser ownership', async ({ page }) => {
  await page.goto('/features/browser-handoff/');
  await page.getByRole('button', { name: /Tab 17/ }).click();
  await expect(page.locator('[data-tab-result]')).toContainText('belongs to Session A');
  await page.getByRole('button', { name: /Tab 24/ }).click();
  await expect(page.locator('[data-tab-result]')).toContainText('returns to Session B');
});

test('new exhibits offer a first-screen action, fit phones and have accessible controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const feature of features.filter((item) => item.id.startsWith('core-'))) {
    await page.goto(`/features/${feature.slug}/`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), feature.slug).toBe(true);
    const action = page.locator('.feature-early-actions a').first();
    const bounds = await action.boundingBox();
    expect(bounds && bounds.y + bounds.height < 844, feature.slug).toBe(true);
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations.map((violation) => violation.id), feature.slug).toEqual([]);
  }
});

test('synthetic exhibits explain their outcomes without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const slug of ['branching-workbench', 'reference-to-chat', 'native-tool-boundary-profiles', 'browser-handoff']) {
    await page.goto(`${test.info().project.use.baseURL}/features/${slug}/`);
    await expect(page.locator('.feature-exhibit noscript')).toBeVisible();
    await page.locator('.feature-example-choices summary').first().click();
    await expect(page.locator('.feature-example-choices details').first()).toHaveAttribute('open', '');
    await page.locator('.feature-sources summary').click();
    await expect(page.getByRole('heading', { name: 'Source areas' })).toBeVisible();
  }
  await context.close();
});

for (const width of [768, 1440]) {
  test(`interactive feature exhibits remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const slug of ['branching-workbench', 'reference-to-chat', 'native-tool-boundary-profiles', 'browser-handoff']) {
      await page.goto(`/features/${slug}/`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), slug).toBe(true);
      const result = await new AxeBuilder({ page }).analyze();
      expect(result.violations.map((violation) => violation.id), slug).toEqual([]);
    }
  });
}
