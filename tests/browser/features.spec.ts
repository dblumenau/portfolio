import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { features } from '../../src/data/features';

const recordedExhibitMarkers: Record<string, string> = {
  'browser-handoff': 'data-browser-handoff',
  'observer-screenshots': 'data-observer-showcase',
  'model-policy': 'data-model-policy-record',
  'steer-without-interrupt': 'data-recorded-steering',
  'native-tool-boundary-profiles': 'data-native-boundary',
  'find-that': 'Recorded private-archive example',
  'voice-conversation-loop': 'data-recorded-voice-turn',
  'grounded-analysis': 'data-grounded-analysis',
  'workspace-hierarchy': 'data-workspace-showcase',
  'shared-engine-surface': 'data-engine-contract',
  'maintained-profile': 'data-maintained-profile-showcase',
};

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
    expect(html).toContain(recordedExhibitMarkers[feature.slug] ?? 'explanatory exhibit');
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

test('the recorded native boundary preserves its grant and separates the granted control', async ({ page }) => {
  await page.goto('/features/native-tool-boundary-profiles/');
  await expect(page.locator('[data-native-read]')).toContainText('exec_command');
  await expect(page.locator('[data-native-read] pre')).toHaveText('FICTIONAL OBSERVATORY\nThe brass telescope points north.\n');
  await expect(page.locator('[data-native-resume]')).toContainText('exec_command');
  await expect(page.locator('[data-native-resume]')).toContainText('Unchanged');
  await expect(page.locator('[data-native-denied] pre')).toHaveText('unsupported custom tool call: apply_patch');
  await expect(page.locator('[data-native-denied]')).toContainText('Absent before');
  await expect(page.locator('[data-native-denied]')).toContainText('absent after');
  await expect(page.locator('[data-native-control]')).toContainText('Separate fresh control thread');
  await expect(page.locator('[data-native-control]')).toContainText('apply_patch');
  await expect(page.locator('[data-native-control]')).toContainText('Expected fixture bytes matched');
  await expect(page.locator('[data-policy-playground]')).toHaveCount(0);
});

test('the saved browser handoff distinguishes same-address owners and the fixture acknowledgment', async ({ page, request }) => {
  await page.goto('/features/');
  const atlasLink = page.getByRole('link', { name: 'Read about Browser handoff', exact: true });
  await expect(atlasLink).toContainText('Read the story');
  await atlasLink.click();
  await page.getByRole('link', { name: 'Inspect the saved handoff', exact: true }).click();
  await expect(page).toHaveURL(/#recorded-browser-handoff$/);
  const exhibit = page.locator('[data-browser-handoff]');
  await expect(exhibit.locator('[data-handoff-tab-a] th,[data-handoff-tab-a] td')).toHaveText(['Tab A', 'Same address', 'Session A', 'Selected and sent']);
  await expect(exhibit.locator('[data-handoff-tab-b] th,[data-handoff-tab-b] td')).toHaveText(['Tab B', 'Same address', 'Session B', 'Not sent']);
  await expect(exhibit.locator('.handoff-result')).toContainText('One request · Session A');
  await expect(exhibit.locator('.handoff-scope')).toContainText('no agent read the page or replied');
  await expect(exhibit.locator('img')).toHaveAttribute('alt', /opened this tab.*Sent to Session A/);
  await expect(page.locator('[data-tab-playground],.feature-example-choices')).toHaveCount(0);
  await expect(exhibit.locator('button,input,textarea,select')).toHaveCount(0);
  const response = await request.get('/media/browser-handoff/receipt.json');
  expect(response.ok()).toBe(true);
  const receipt = await response.json();
  expect(receipt.savedCheck).toMatchObject({ twoTabsSameUrl: true, distinctTabIds: true, distinctStoredOwners: true, popupTargetMatchesStoredOwner: true, requestRetainsSelectedTabIdentifiers: true, bridgeThreadMatchesSelectedOwner: true, turnStartCount: 1, acknowledgment: 'Sent to Session A', modelCalls: 0, providerCalls: 0 });
  expect(receipt.browser.genuineActionPopup).toBe(true);
  expect(receipt.browser.popupOpenedAsNormalTab).toBe(false);
  expect(receipt.media.publicExcerpt).toMatchObject({ startSeconds: 1, endExclusiveSeconds: 9.4, frames: 168, fps: 20, durationSeconds: 8.4, speed: 1, internalCuts: false, heldEnding: false, audioStreams: 0 });
  expect(JSON.stringify(receipt)).not.toMatch(/\/home\/|\/Users\/|\/tmp\/|127\.0\.0\.1|localhost|work-macbook|owner:\d+|windowId|groupId|session_id|Authorization|api[_-]?key/i);
});

test('the recorded handoff uses opt-in native media and pauses on close and pagehide', async ({ page }) => {
  const films: string[] = [];
  page.on('request', request => { if (request.url().endsWith('/browser-handoff/execution.mp4')) films.push(request.url()); });
  await page.goto('/features/browser-handoff/');
  const film = page.locator('[data-handoff-film]');
  const video = film.locator('video');
  await expect(film).not.toHaveAttribute('open', '');
  await expect(video).toHaveAttribute('preload', 'none');
  await expect(video).toHaveAttribute('controls', '');
  await expect(video).not.toHaveAttribute('autoplay', '');
  await expect(video).not.toHaveAttribute('loop', '');
  expect(await video.evaluate((node: HTMLVideoElement) => node.paused)).toBe(true);
  expect(films).toEqual([]);
  await film.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(video).toBeVisible();
  await video.evaluate((node: HTMLVideoElement) => node.play());
  await expect.poll(() => video.evaluate((node: HTMLVideoElement) => node.currentTime)).toBeGreaterThan(0.2);
  expect(await video.evaluate((node: HTMLVideoElement) => node.duration)).toBeCloseTo(8.4, 1);
  await expect(video.locator('track')).toHaveAttribute('kind', 'captions');
  await expect.poll(() => video.evaluate((node: HTMLVideoElement) => node.textTracks[0].cues?.length)).toBe(3);
  await film.locator('summary').click();
  await expect.poll(() => video.evaluate((node: HTMLVideoElement) => node.paused)).toBe(true);
  await film.locator('summary').click();
  expect(await video.evaluate((node: HTMLVideoElement) => node.paused)).toBe(true);
  await video.evaluate((node: HTMLVideoElement) => node.play());
  expect(await video.evaluate((node: HTMLVideoElement) => { window.dispatchEvent(new PageTransitionEvent('pagehide')); return node.paused; })).toBe(true);
  const method = page.locator('[data-handoff-method]');
  await method.locator('summary').focus();
  await page.keyboard.press('Space');
  await expect(method).toContainText('fake Unix app-server');
  await expect(method).toContainText('does not independently read browser ownership');
});

for (const width of [390, 1024, 1440]) {
  test(`the saved handoff fits ${width}px with readable results and static local requests`, async ({ browser, baseURL }, info) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, ...(width === 390 ? { isMobile: true, hasTouch: true, deviceScaleFactor: 3 } : {}) });
    const page = await context.newPage();
    const external: string[] = [], mutations: string[] = [], errors: string[] = [];
    page.on('request', request => {
      if (new URL(request.url()).origin !== new URL(String(baseURL)).origin) external.push(request.url());
      if (request.method() !== 'GET') mutations.push(request.method());
    });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${baseURL}/features/browser-handoff/`);
    const exhibit = page.locator('[data-browser-handoff]');
    await exhibit.locator('img').scrollIntoViewIfNeeded();
    await expect(exhibit.locator('img')).toHaveJSProperty('naturalWidth', 380);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const bounds = await exhibit.locator('img').boundingBox();
    expect(bounds!.width).toBeGreaterThanOrEqual(width === 390 ? 340 : 300);
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await exhibit.screenshot({ path: info.outputPath(`handoff-${width}.png`) });
    for (const summary of await exhibit.locator('summary').all()) await summary.click();
    await expect(exhibit.locator('video')).toBeVisible();
    const cueFont = await exhibit.locator('video').evaluate(node => parseFloat(getComputedStyle(node, '::cue').fontSize));
    expect(cueFont).toBeGreaterThanOrEqual(14);
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations.map(violation => `${violation.id}: ${violation.description}`)).toEqual([]);
    expect(external).toEqual([]); expect(mutations).toEqual([]); expect(errors).toEqual([]);
    await context.close();
  });
}

test('the saved handoff remains readable and plays through native controls without scripts on a phone', async ({ browser, baseURL }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  const page = await context.newPage();
  await page.goto(`${baseURL}/features/browser-handoff/`);
  await page.getByRole('link', { name: 'Inspect the saved handoff', exact: true }).click();
  await expect(page.locator('[data-handoff-tab-a]')).toContainText('Session A');
  await expect(page.locator('[data-handoff-tab-b]')).toContainText('Not sent');
  await expect(page.locator('.handoff-scope')).toContainText('no agent read the page or replied');
  const method = page.locator('[data-handoff-method]');
  await method.locator('summary').click();
  await expect(method).toContainText('a request for a new turn');
  await expect(method.getByRole('link', { name: 'Read the concise execution receipt' })).toBeVisible();
  const film = page.locator('[data-handoff-film]');
  await film.locator('summary').click();
  const video = film.locator('video');
  await video.scrollIntoViewIfNeeded();
  const bounds = await video.boundingBox();
  await video.tap({ position: { x: 22, y: bounds!.height - 50 } });
  await expect.poll(() => video.evaluate((node: HTMLVideoElement) => node.currentTime)).toBeGreaterThan(0.2);
  await expect(video).toHaveAttribute('controls', '');
  await expect(video.locator('track')).toHaveAttribute('src', '/media/browser-handoff/execution.vtt');
  await page.screenshot({ path: info.outputPath('handoff-nojs-phone-native-playback.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
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

test('feature exhibits explain their outcomes without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const slug of ['branching-workbench', 'reference-to-chat', 'native-tool-boundary-profiles', 'browser-handoff']) {
    await page.goto(`${test.info().project.use.baseURL}/features/${slug}/`);
    if (slug === 'browser-handoff') {
      await expect(page.locator('[data-handoff-tab-a]')).toContainText('Selected and sent');
      await expect(page.locator('[data-handoff-tab-b]')).toContainText('Not sent');
      await page.locator('[data-handoff-method] summary').click();
      await expect(page.locator('[data-handoff-method]')).toContainText('No real Codex CLI');
      await page.locator('[data-handoff-film] summary').click();
      await expect(page.locator('[data-handoff-film] video')).toBeVisible();
    } else if (slug === 'native-tool-boundary-profiles') {
      await expect(page.locator('[data-native-denied] pre')).toHaveText('unsupported custom tool call: apply_patch');
      await page.locator('[data-native-evidence] summary').click();
      await expect(page.locator('[data-native-evidence]')).toHaveAttribute('open', '');
    } else {
      await expect(page.locator('.feature-exhibit noscript')).toBeVisible();
      await page.locator('.feature-example-choices summary').first().click();
      await expect(page.locator('.feature-example-choices details').first()).toHaveAttribute('open', '');
    }
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


test('the saved observer separates unchanged tool output from the human image', async ({ page, request }) => {
  await page.goto('/features/observer-screenshots/');
  await page.getByRole('link', { name: 'Inspect the saved observer view', exact: true }).click();
  await expect(page).toHaveURL(/#saved-observer-view$/);
  const exhibit = page.locator('[data-observer-showcase]');
  await expect(exhibit.locator('[data-observer-client] blockquote')).toHaveText('Successfully clicked on the element');
  await expect(exhibit.locator('[data-observer-client]')).toContainText('No observer image or reference was added');
  await expect(exhibit.locator('[data-observer-human]')).toContainText('1024 × 768');
  await expect(exhibit.locator('[data-observer-human]')).toContainText('Ready');
  await expect(exhibit.locator('.observer-scope')).toContainText('fictional local page and saved conversation');
  await expect(exhibit.locator('.observer-scope')).toContainText('local test service');
  await expect(exhibit.locator('.observer-scope')).toContainText('No model ran');
  await expect(exhibit.locator('video,audio,button,input,textarea,select,canvas,iframe')).toHaveCount(0);
  await expect(page.locator('.feature-example-choices,.feature-object-sequence')).toHaveCount(0);
  const image = await request.get('/media/observer-screenshot/observer.webp');
  const bytes = await image.body();
  expect(bytes.length).toBe(11426);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe('80ed2ecad78ff4fcdbc8bff5bcf316f93e3cc699ba529b3d9a1e8778d7e28e1f');
  expect(bytes.equals(readFileSync(new URL('../../public/media/observer-screenshot/observer.webp', import.meta.url)))).toBe(true);
  const receipt = await request.get('/media/observer-screenshot/receipt.json');
  const saved = await receipt.json();
  expect(saved.checks).toMatchObject({ observed_action_count: 1, original_action_response_forwarded_unchanged: true, observer_response_hidden: true, fake_object_put_count: 1, actual_borg_stash_reader: true, model_inference: false, production_rows: false, external_upload: false });
  expect(saved.hashes.originalActionResponseSha256).toBe(saved.hashes.forwardedActionResponseSha256);
  expect(saved.hashes.webpSha256).toBe('80ed2ecad78ff4fcdbc8bff5bcf316f93e3cc699ba529b3d9a1e8778d7e28e1f');
});

test('the observer result, original image link and method work without scripts on a phone', async ({ browser, baseURL }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  const page = await context.newPage();
  await page.goto(`${baseURL}/features/observer-screenshots/`);
  const method = page.locator('[data-observer-method]');
  await method.locator('summary').focus(); await page.keyboard.press('Enter');
  await expect(method).toContainText('one observed click and one upload');
  await expect(method).toContainText('authored fixture metadata');
  await expect(method).toContainText('not a model-input comparison during inference');
  await page.locator('.feature-sources summary').click();
  await expect(page.locator('.feature-sources')).toContainText('Research cut: 15 October 2026');
  await expect(page.locator('.feature-sources time[datetime="2026-10-10"]')).toHaveCount(2);
  await expect(page.locator('.feature-sources time[datetime="2026-10-15"]')).toHaveCount(1);
  await page.getByRole('link', { name: 'Open the actual observer image', exact: true }).click();
  await expect(page).toHaveURL(/\/media\/observer-screenshot\/observer.webp$/);
  await expect(page.locator('img')).toHaveJSProperty('naturalWidth', 1024);
  await expect(page.locator('img')).toHaveJSProperty('naturalHeight', 768);
  await page.screenshot({ path: info.outputPath('observer-original-nojs-phone.png') });
  await context.close();
});

for (const width of [390, 1024, 1440]) {
  test(`the recorded observer view fits ${width}px with static accessible content`, async ({ browser, baseURL }, info) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, ...(width === 390 ? { isMobile: true, hasTouch: true, deviceScaleFactor: 3 } : {}) });
    const page = await context.newPage(); const external: string[] = [], mutations: string[] = [], errors: string[] = [], serviceCalls: string[] = [];
    page.on('request', request => { const url = new URL(request.url()); if (url.origin !== new URL(String(baseURL)).origin) external.push(request.url()); if (request.method() !== 'GET') mutations.push(request.method()); if (url.pathname.startsWith('/api/') || /\.mp4$/.test(url.pathname)) serviceCalls.push(url.pathname); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${baseURL}/features/observer-screenshots/`);
    const exhibit = page.locator('[data-observer-showcase]'); const image = exhibit.locator('img');
    await image.scrollIntoViewIfNeeded(); await expect(image).toHaveJSProperty('naturalWidth', 420);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const bounds = await image.boundingBox(); expect(bounds!.width).toBeGreaterThanOrEqual(width === 390 ? 340 : 390); expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await page.screenshot({ path: info.outputPath(`observer-${width}-card.png`) });
    await exhibit.locator('[data-observer-client]').scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath(`observer-${width}-outputs.png`) });
    await exhibit.locator('summary').click(); await expect(exhibit.locator('[data-observer-method]')).toContainText('No Claude or Codex CLI');
    const axe = await new AxeBuilder({ page }).analyze(); expect(axe.violations.map(item => `${item.id}: ${item.description}`)).toEqual([]);
    expect(external).toEqual([]); expect(mutations).toEqual([]); expect(serviceCalls).toEqual([]); expect(errors).toEqual([]);
    await context.close();
  });
}
