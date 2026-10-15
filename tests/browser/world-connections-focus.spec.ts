import { test, expect, type Page } from '@playwright/test';

test.use({ launchOptions: { args: ['--enable-unsafe-swiftshader'] } });
test.setTimeout(90_000);

const worldState = (page: Page) => page.evaluate(() => ({
  hash: location.hash, scroll: scrollY,
  inspectorScroll: document.querySelector('[data-world-inspector]')!.scrollTop,
  selected: (document.querySelector('[data-world-stage]') as HTMLElement).dataset.selected,
  exhibit: (document.querySelector('[data-world-stage]') as HTMLElement).dataset.exhibit,
}));

for (const destination of ['printshop', 'memory'] as const) {
  test(`reloaded readable-map Connections origin survives ${destination}, Back and Return with visible original focus`, async ({ page }, info) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/world/#districts');
    await page.locator('[data-world-stage]').scrollIntoViewIfNeeded();
    const root = page.locator('[data-forge-world]');
    await expect(root).toHaveAttribute('data-world-state', 'ready');
    await page.waitForTimeout(1800);
    const original = page.locator('#districts [data-open-connections]');
    await original.click({ trial: true });
    const before = await worldState(page);
    await original.click();
    await expect(page.locator('[data-request-open]')).toBeEnabled();
    const origin = await page.evaluate(() => history.state.worldTaskOrigin);
    expect(origin).toMatchObject({ hash: '#districts', scroll: before.scroll, inspectorScroll: before.inspectorScroll });
    expect(origin.pose.worldHash).toBe('');

    await page.reload();
    await expect(page.locator('[data-request-open]')).toBeEnabled();
    expect(await page.evaluate(() => history.state.worldTaskOrigin)).toEqual(origin);
    await page.locator(`[data-world-activities] [data-open-${destination}]`).click();
    await expect(root).toHaveAttribute('data-experience', destination);
    expect(await page.evaluate(() => history.state.worldTaskOrigin)).toEqual(origin);
    await page.goBack();
    await expect(root).toHaveAttribute('data-experience', 'connections');
    await expect(page.locator('[data-request-open]')).toBeEnabled();
    expect(await page.evaluate(() => history.state.worldTaskOrigin)).toEqual(origin);

    await page.locator('[data-request-exit]').click();
    await expect(page).toHaveURL(/#districts$/);
    await expect(original).toBeFocused();
    const returned = await worldState(page);
    expect(returned).toEqual(before);
    const bounds = await original.boundingBox();
    expect(bounds!.width).toBeGreaterThan(0);
    expect(bounds!.height).toBeGreaterThan(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(1000);
    await page.screenshot({ path: info.outputPath(`connections-${destination}-back-return.png`) });

    await original.click();
    await expect(page.locator('[data-request-open]')).toBeEnabled();
    const recaptured = await page.evaluate(() => history.state.worldTaskOrigin);
    expect(recaptured).toEqual(origin);
    await page.locator('[data-request-exit]').click();
    await expect(original).toBeFocused();
    await info.attach('complete-origin.json', {
      body: JSON.stringify({ destination, before, origin, returned, recaptured, focusBounds: bounds }, null, 2),
      contentType: 'application/json',
    });
  });
}
