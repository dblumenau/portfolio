import { test, expect } from '@playwright/test';

test('portability decisions lead through the real refusal and adopted update', async ({ page }) => {
  await page.goto('/labs/workbench/');
  const next = page.locator('[data-wb-next]');
  await expect(next).toBeDisabled();
  await page.getByLabel('Travel with the shared setup').check();
  await page.getByLabel('Follow that desk’s preference').check();
  await next.click();
  await expect(page.locator('[data-wb-choice-result]')).toContainText('Your choices match');
  await next.click();
  await expect(page.locator('[data-wb-exit]')).toHaveText('exit 1');
  await expect(page.locator('[data-wb-output]')).toContainText('live config has non-runtime drift');
  await expect(page.locator('[data-wb-reason="a"]')).toHaveText('high');
  await next.click();
  await expect(page.locator('[data-wb-output]')).toContainText('metacodex apply --adopt');
  await next.click();
  await expect(page.locator('[data-wb-model]').first()).toHaveText('demo-model-v2');
  await expect(page.locator('[data-wb-reason="a"]')).toHaveText('high');
  await expect(page.locator('[data-wb-reason="b"]')).toHaveText('low');
  await next.click();
  await expect(page.locator('[data-wb-skill]')).toHaveText('Matching SHA-256 on both desks');
  await expect(page.locator('[data-wb-locker]').first()).toHaveText('SHA-256 verified unchanged');
  await expect(page.locator('[data-wb-output]')).toContainText('doctor: ok');
  await next.click();
  await expect(next).toBeDisabled();
  await expect(page.locator('[data-workbench-lab]')).toHaveAttribute('data-step','0');
});

test('alternative choices explain the observed arrangement without inventing another execution', async ({ page }) => {
  await page.goto('/labs/workbench/');
  await page.getByLabel('Stay on one desk').check();
  await page.getByLabel('Be identical everywhere').check();
  await page.locator('[data-wb-next]').click();
  await expect(page.locator('[data-wb-choice-result]')).toContainText('The tested arrangement shares');
  await expect(page.locator('[data-wb-output]')).toContainText('metacodex install');
});

test('keyboard, browser Back and reload preserve the selected phase', async ({ page }) => {
  await page.goto('/labs/workbench/');
  await page.getByLabel('Travel with the shared setup').focus();
  await page.keyboard.press('Space');
  await page.getByLabel('Follow that desk’s preference').focus();
  await page.keyboard.press('Space');
  await page.locator('[data-wb-next]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#wb-stage-title')).toBeFocused();
  await page.locator('[data-wb-next]').click();
  await page.reload();
  await expect(page.locator('[data-workbench-lab]')).toHaveAttribute('data-step','2');
  await expect(page.locator('[data-wb-output]')).toContainText('non-runtime drift');
  await page.goBack();
  await expect(page.locator('[data-workbench-lab]')).toHaveAttribute('data-step','1');
  await page.goBack();
  await expect(page.getByLabel('Travel with the shared setup')).toBeChecked();
  await expect(page.getByLabel('Follow that desk’s preference')).toBeChecked();
});

for (const width of [390,834,1440]) {
  test(`fits ${width}px and keeps the next consequence visible`, async ({ page }) => {
    await page.setViewportSize({width,height:900});
    await page.goto('/labs/workbench/?step=2&skill=shared&preference=local');
    await expect(page.locator('[data-workbench-lab]')).toHaveAttribute('data-step','2');
    await page.locator('#wb-stage-title').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-wb-next]')).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const errors: string[] = [];page.on('pageerror',error=>errors.push(error.message));
    await page.locator('[data-wb-next]').click();
    await expect(page.locator('[data-wb-state-note]')).toBeInViewport();
    await expect(page.locator('[data-wb-next]')).toBeInViewport();
    expect(errors).toEqual([]);
  });
}

test('the static receipt and actual output remain readable without JavaScript', async ({ browser, baseURL }) => {
  const context=await browser.newContext({javaScriptEnabled:false,baseURL});
  const page=await context.newPage();
  await page.goto('/labs/workbench/');
  await expect(page.getByText('JavaScript is off.',{exact:false})).toBeVisible();
  await page.getByText('Every command, exit code and observed duration',{exact:true}).click();
  await expect(page.locator('.wb-invocations li')).toHaveCount(8);
  await page.getByText('Inspect the protected-file hashes',{exact:true}).click();
  await expect(page.locator('.wb-hash-list')).toContainText('.codex/auth.json');
  await expect(page.locator('.wb-hash-list')).toContainText('Before and after match');
  await context.close();
});

test('public proof is scoped to fictional data and honest replay provenance', async ({ page,request }) => {
  await page.goto('/labs/workbench/');
  await expect(page.locator('#wb-film-caption')).toContainText('Display pacing is editorial');
  const video = page.locator('video');
  await video.evaluate((element: HTMLVideoElement) => element.load());
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThan(0);
  const duration = await video.evaluate((element: HTMLVideoElement) => element.duration);
  expect(duration).toBeGreaterThan(40);
  expect(duration).toBeLessThan(42);
  const response=await request.get('/media/workbench/receipt.json');expect(response.ok()).toBe(true);
  const text=await response.text();
  expect(text).not.toContain('/home/dblumenau');
  expect(text).not.toContain('not-a-real-key');
  expect(text).not.toContain('fictional local session');
  const receipt=JSON.parse(text);
  expect(receipt.steps).toHaveLength(8);
  expect(receipt.steps.map((step:{exitCode:number})=>step.exitCode)).toEqual([0,0,1,0,0,0,0,0]);
  expect(receipt.refusal.activeSha256Before).toBe(receipt.refusal.activeSha256After);
  expect(receipt.desks['desk-a'].skillSha256).toBe(receipt.desks['desk-b'].skillSha256);
  expect(receipt.harness.join(' ')).toContain('hooks.json replaced');
});
