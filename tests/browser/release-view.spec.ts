import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const checkpoint = {
  period: 'custom', project: 'panel-forge', kind: 'patch', query: 'web-v10.20.95',
  from: '2026-10-12', to: '2026-10-12',
};
async function expectCheckpoint(page: Page) {
  for (const [name, value] of Object.entries(checkpoint)) await expect(page.locator(`[name="${name}"]`)).toHaveValue(value);
  await expect(page.locator('[data-release-status]')).toHaveText('1 of 30 reviewed milestones match');
  await expect(page.locator('[data-milestone]:visible')).toHaveCount(1);
  await expect(page.locator('[data-milestone="session-peek"]')).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('[data-release-focus] h3')).toHaveText('Read the story before opening the session');
  expect(new URL(page.url()).hash).toBe('#milestone-session-peek');
}

for (const width of [390, 1440]) test(`a copied release investigation restores in a fresh context, reload and browser Back at ${width}px`, async ({ page, context, browser }) => {
  await page.setViewportSize({ width, height: 1000 });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/releases/?campaign=review#milestone-one-gallery');
  await page.locator('[name="project"]').selectOption(checkpoint.project);
  await page.locator('[name="kind"]').selectOption(checkpoint.kind);
  await page.locator('[name="from"]').fill(checkpoint.from);
  await page.locator('[name="to"]').fill(checkpoint.to);
  await page.locator('[name="query"]').fill(checkpoint.query);
  await expectCheckpoint(page);
  await page.locator('[data-release-copy]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-release-copy-status]')).toHaveText('View link copied.');
  await expect(page.locator('[data-release-copy]')).toBeFocused();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(page.url());
  expect(new URL(copied).searchParams.get('campaign')).toBe('review');

  const recipient = await browser.newContext({ viewport: { width, height: 1000 } });
  try {
    const shared = await recipient.newPage();
    const requests: string[] = [];
    shared.on('request', request => requests.push(request.url()));
    await shared.goto(copied);
    await expectCheckpoint(shared);
    expect(requests.some(url => url.includes('/inventory'))).toBe(false);
    await expect(shared.locator('[data-release-inventory]')).not.toHaveAttribute('open');
    await shared.locator('[data-release-inventory] summary').click();
    await expect(shared.locator('[data-tag-rows] tr')).toHaveCount(1);
    await expect(shared.locator('[data-tag-rows]')).toContainText('web-v10.20.95');
    await expect(shared.locator('[data-tag-rows]')).toContainText('773f0fa38');
    await expect(shared.locator('[data-tag-rows]')).toContainText('PanelForge');
    await shared.reload();
    await expectCheckpoint(shared);
    await shared.locator('[data-release-focus] .release-story-link').click();
    await expect(shared).toHaveURL(/\/work\/panelforge\/#code-history$/);
    await shared.goBack();
    await expectCheckpoint(shared);
    if (width === 390) {
      const marker = shared.locator('[data-milestone="session-peek"]');
      await marker.focus();await shared.keyboard.press('Enter');
      await expect(shared.locator('[data-release-focus]')).toBeFocused();
      await shared.getByRole('button', { name: 'Back to the growth map' }).click();
      await expect(marker).toBeFocused();
    }
    expect(await shared.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await shared.locator('[data-release-focus]').evaluate(node => Promise.all(node.getAnimations().map(animation => animation.finished)));
    expect((await new AxeBuilder({ page: shared }).analyze()).violations).toEqual([]);
  } finally { await recipient.close(); }
});

test('explicit filters win over conflicting hashes and browser history restores the view', async ({ page }) => {
  await page.goto('/releases/?project=panel-forge&kind=patch&query=web-v10.20.95&from=2026-10-12&to=2026-10-12#milestone-one-gallery');
  await expectCheckpoint(page);
  await page.evaluate(() => { location.hash = 'milestone-one-gallery'; });
  await expectCheckpoint(page);
  await page.evaluate(() => { history.pushState(null, '', '/releases/?period=origins#milestone-one-gallery'); });
  await page.goBack();
  await expectCheckpoint(page);
  await page.goto('/releases/#milestone-one-gallery');
  await expect(page.locator('[data-release-focus] h3')).toHaveText('Put browsing and organisation together');
  await page.getByRole('button', { name: 'Next matching milestone' }).click();
  const selected = await page.locator('[data-milestone][aria-current="true"]').getAttribute('data-milestone');
  await page.reload();
  await expect(page.locator(`[data-milestone="${selected}"]`)).toHaveAttribute('aria-current', 'true');
});

test('periods, open custom endpoints, invalid dates, empty results and reset round-trip honestly', async ({ page }) => {
  const errors: string[] = [];page.on('pageerror', error => errors.push(error.message));
  const cases = [
    { query: 'period=october', period: 'october', from: '2026-10-01', to: '2026-10-31', status: '7 of 30 reviewed milestones match' },
    { query: 'period=custom&to=2026-10-12', period: 'custom', from: '', to: '2026-10-12' },
    { query: 'period=custom', period: 'custom', from: '', to: '', status: '30 of 30 reviewed milestones match' },
    { query: 'period=october&from=2026-10-12&to=2026-10-12', period: 'custom', from: '2026-10-12', to: '2026-10-12' },
    { query: 'period=unknown&project=unknown&kind=unknown&from=2026-02-30&to=nonsense', period: 'custom', from: '2025-05-01', to: '2026-10-31', status: '30 of 30 reviewed milestones match' },
    { query: 'period=custom&from=2024-01-01&to=2027-01-01', period: 'custom', from: '2025-05-01', to: '2026-10-31', status: '30 of 30 reviewed milestones match' },
    { query: 'period=custom&from=2026-10-14&to=2026-10-01', period: 'custom', from: '2026-10-14', to: '2026-10-01', status: 'The start date must be on or before the end date.' },
    { query: 'query=nothing-matches-this-clue', period: 'all', from: '2025-05-01', to: '2026-10-31', status: '0 of 30 reviewed milestones match' },
  ];
  for (const scenario of cases) {
    await page.goto(`/releases/?${scenario.query}#milestone-not-a-story`);
    for (let round = 0; round < 2; round++) {
      await expect(page.locator('[name="period"]')).toHaveValue(scenario.period);
      await expect(page.locator('[name="from"]')).toHaveValue(scenario.from);
      await expect(page.locator('[name="to"]')).toHaveValue(scenario.to);
      if (scenario.status) await expect(page.locator('[data-release-status]')).toHaveText(scenario.status);
      if (scenario.status?.startsWith('0 ') || scenario.status?.startsWith('The start')) {
        await expect(page.locator('[data-focus-wrap]')).toBeHidden();
        expect(new URL(page.url()).hash).toBe('');
      }
      if (round === 0) await page.reload();
    }
  }
  await page.goto('/releases/?campaign=review&period=october&project=panel-forge#milestone-one-gallery');
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await expect(page).toHaveURL(/\/releases\/\?campaign=review$/);
  await expect(page.locator('[data-release-status]')).toHaveText('30 of 30 reviewed milestones match');
  await page.reload();
  await expect(page.locator('[name="period"]')).toHaveValue('all');
  await expect(page.locator('[name="project"]')).toHaveValue('');
  await page.locator('[name="from"]').fill('2024-01-01');
  await page.locator('[name="query"]').focus();
  await expect(page.locator('[name="from"]')).toHaveValue('2025-05-01');
  await page.reload();
  await expect(page.locator('[name="from"]')).toHaveValue('2025-05-01');
  expect(errors).toEqual([]);
});

for (const clipboard of ['denied', 'unavailable']) test(`copy has an accessible manual fallback when clipboard is ${clipboard}`, async ({ page, browser }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.addInitScript((mode) => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: mode === 'unavailable' ? undefined : { writeText: () => Promise.reject(new DOMException('Clipboard denied', 'NotAllowedError')) } });
  }, clipboard);
  await page.goto('/releases/?project=panel-forge&query=web-v10.20.95');
  await page.getByRole('button', { name: 'Copy view link' }).click();
  await expect(page.locator('[data-release-copy-status]')).toHaveText('Copy this link.');
  const input = page.getByRole('textbox', { name: 'View link', exact: true });
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute('readonly');
  const manual = await input.inputValue();
  expect(await input.evaluate(node => (node as HTMLInputElement).selectionEnd! - (node as HTMLInputElement).selectionStart!)).toBe(manual.length);
  const recipient = await browser.newContext();
  try {
    const shared = await recipient.newPage();await shared.goto(manual);
    await expect(shared.locator('[name="project"]')).toHaveValue('panel-forge');
    await expect(shared.locator('[name="query"]')).toHaveValue('web-v10.20.95');
    await expect(shared.locator('[data-release-status]')).toHaveText('1 of 30 reviewed milestones match');
    await expect(shared.locator('[data-milestone="session-peek"]')).toHaveAttribute('aria-current', 'true');
  } finally { await recipient.close(); }
  await page.locator('[data-release-focus]').evaluate(node => Promise.all(node.getAnimations().map(animation => animation.finished)));
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.locator('[name="query"]').fill('no-match');
  await expect(page.locator('[data-release-link-fallback]')).toBeHidden();
  await expect(page.locator('[data-release-copy-status]')).toHaveText('');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});


for (const width of [390, 1440]) test(`ordinary page anchors preserve selection and their destination at ${width}px`, async ({ page, context }) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto('/releases/#milestone-one-gallery');
  await page.locator('.release-jump').click();
  await expect(page.locator('.release-reading')).toHaveAttribute('open');
  await page.getByRole('link', { name: 'Back to top', exact: true }).click();
  await expect(page).toHaveURL(/\/releases\/#top$/);
  await expect(page.locator('[data-milestone="one-gallery"]')).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('[data-release-focus] h3')).toHaveText('Put browsing and organisation together');
  await expect(page.locator('.release-reading')).toHaveAttribute('open');
  await page.locator('[data-milestone="one-gallery"]').click();
  await expect(page).toHaveURL(/#milestone-one-gallery$/);
  await page.getByRole('link', { name: 'Back to top', exact: true }).click();
  await expect(page).toHaveURL(/#top$/);
  await expect(page.locator('[data-milestone="one-gallery"]')).toHaveAttribute('aria-current', 'true');

  await page.locator('[name="period"]').selectOption('origins');
  await page.evaluate(() => { location.hash = 'release-reading'; });
  await expect(page).toHaveURL(/period=origins#release-reading$/);
  await expect(page.locator('[name="period"]')).toHaveValue('origins');
  await expect(page.locator('[data-milestone="one-gallery"]')).toHaveAttribute('aria-current', 'true');
  await page.reload();
  await expect(page).toHaveURL(/period=origins#release-reading$/);
  await expect(page.locator('[name="period"]')).toHaveValue('origins');
  await expect(page.locator('[data-milestone][aria-current="true"]')).toHaveAttribute('data-date', /^2025-/);

  await page.goto('/releases/?period=october#release-reading');
  await expect(page).toHaveURL(/period=october#release-reading$/);
  await expect(page.locator('[name="period"]')).toHaveValue('october');
  await expect(page.locator('[data-release-status]')).toHaveText('7 of 30 reviewed milestones match');
  await expect(page.locator('[data-milestone="session-peek"]')).toHaveAttribute('aria-current', 'true');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Copy view link' }).click();
  await expect(page.locator('[data-release-copy-status]')).toHaveText('View link copied.');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(new URL(copied).hash).toBe('#milestone-session-peek');
  expect(new URL(copied).searchParams.get('period')).toBe('october');
});
