import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import receipt from '../../public/media/native-tool-boundary/receipt.json' with { type: 'json' };

const path = '/features/native-tool-boundary-profiles/';

test('selected receipt preserves the two recorded contexts and excludes private protocol fields', async ({ request }) => {
  const response = await request.get('/media/native-tool-boundary/receipt.json');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');
  const actual = await response.json();
  expect(actual).toEqual(receipt);
  expect(actual.protectedRun.exactGrant).toBe('exec_command');
  expect(actual.protectedRun.resume).toMatchObject({ processRestarted: 'Codex app-server', restartCount: 1, sameSavedThread: true, engineRecordUnchanged: true, runtimeCeilingUnchanged: true, exactGrantAfter: 'exec_command' });
  expect(actual.protectedRun.read).toMatchObject({ exitCode: 0, fixtureUnchanged: true, output: 'FICTIONAL OBSERVATORY\nThe brass telescope points north.\n' });
  expect(actual.protectedRun.excludedPatch).toMatchObject({ actualRuntimeRefusal: 'unsupported custom tool call: apply_patch', targetBefore: 'absent', targetAfter: 'absent' });
  expect(actual.separateControl).toMatchObject({ exactGrant: 'apply_patch', exitCode: 0, fileAdded: true, targetBefore: 'absent', targetAfter: 'present', expectedFixtureBytesMatched: true, restartCount: 0 });
  expect(actual.fixtures).toMatchObject({ realModelInference: false, observedNativeToolCount: 24, protectedOperationMcpServers: 0 });
  const text = JSON.stringify(actual);
  expect(text).not.toMatch(/POLICY FAILURE|sentinel-|\/home\/|\/mnt\/|127\.0\.0\.1|localhost|https?:|\b(?:access_token|refresh_token|call_id|threadId|turn_id|sha256)\b|"authorization"\s*:/i);
  expect(text).not.toMatch(/[a-f0-9]{32,}/i);
  expect(Object.keys(actual)).toEqual(['version', 'captured', 'kind', 'runtime', 'fixtures', 'protectedRun', 'separateControl', 'controlledComparison', 'checks', 'limits']);
});

test('native disclosures and both recorded outcomes work without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(baseURL + path);
  await expect(page.locator('[data-native-denied] pre')).toHaveText(receipt.protectedRun.excludedPatch.actualRuntimeRefusal);
  await expect(page.locator('[data-native-control]')).toContainText('Expected fixture bytes matched.');
  const disclosure = page.locator('[data-native-evidence]');
  await disclosure.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(disclosure).toHaveAttribute('open', '');
  await expect(disclosure).toContainText('synthetic model/account configuration');
  await expect(disclosure.getByRole('link', { name: 'Read the selected public receipt' })).toBeVisible();
  await page.locator('.feature-sources summary').click();
  await expect(page.getByRole('heading', { name: 'Source areas' })).toBeVisible();
  await context.close();
});

for (const width of [360, 390, 768, 1440]) {
  test(`recorded cases fit ${width}px with readable facts and accessible disclosures`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(path);
    const showcase = page.locator('[data-native-boundary]');
    await expect(showcase).toContainText('exec_command is a broad shell tool');
    await expect(page.locator('[data-native-control] .native-step')).toHaveText('Separate fresh control thread');
    await expect(page.locator('[data-native-denied] .native-file-state')).toContainText('Absent before');
    await expect(page.locator('[data-native-control] .native-file-state')).toContainText('present after');
    await page.locator('[data-native-evidence] summary').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await showcase.evaluate(element => [...element.querySelectorAll('pre,dd,article')].every(item => item.scrollWidth <= item.clientWidth + 1))).toBe(true);
    const violations = await new AxeBuilder({ page }).analyze();
    expect(violations.violations.map(item => `${item.id}: ${item.description}`)).toEqual([]);
  });
}

test('the saved exhibit starts quietly and sends only local static reads', async ({ page, baseURL }) => {
  const requests: { url: string; method: string; type: string }[] = [];
  const errors: string[] = [];
  const sockets: string[] = [];
  page.on('request', item => requests.push({ url: item.url(), method: item.method(), type: item.resourceType() }));
  page.on('pageerror', item => errors.push(item.message));
  page.on('websocket', item => sockets.push(item.url()));
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await page.locator('[data-native-evidence] summary').click();
  await expect(page.locator('[data-native-boundary]')).not.toContainText(/read_file|write_file|run_shell|POLICY FAILURE/);
  await expect(page.locator('[data-native-boundary] button,[data-native-boundary] input,[data-native-boundary] form,[data-native-boundary] video,[data-native-boundary] audio')).toHaveCount(0);
  const sameOrigin = new URL(baseURL!).origin;
  expect(requests.every(item => new URL(item.url).origin === sameOrigin && item.method === 'GET')).toBe(true);
  expect(requests.filter(item => ['fetch', 'xhr', 'websocket', 'eventsource', 'media'].includes(item.type))).toEqual([]);
  expect(sockets).toEqual([]);
  expect(errors).toEqual([]);
});
