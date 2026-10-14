import { test, expect } from '@playwright/test';
import execution from '../../src/labs/recovery/execution.json' with { type: 'json' };

test('recorded replay separates the disconnected client from the continuing engine', async ({ page }) => {
  const liveRequests: string[] = [];
  page.on('request', request => { if (/\/stream(?:\/|$)|\/receipt$|\/evidence$/.test(new URL(request.url()).pathname)) liveRequests.push(request.url()); });
  await page.goto('/labs/recovery/');
  const lab=page.locator('[data-recovery-lab]');
  await page.getByRole('button',{name:'Disconnected',exact:false}).click();
  await expect(lab).toHaveAttribute('data-phase','disconnected');
  await expect(page.locator('[data-client-count]')).toHaveText('23 characters received');
  const frozen=await page.locator('[data-answer]').textContent();
  await page.locator('[data-playhead]').fill('5');
  await page.locator('[data-playhead]').dispatchEvent('input');
  await expect(page.locator('[data-answer]')).toHaveText(frozen!);
  await expect(page.locator('[data-machine-state]')).toHaveText('Continues after disconnect');
  expect(Number((await page.locator('[data-engine-count]').textContent())!.replaceAll(',',''))).toBeGreaterThan(23);
  await expect(page.getByRole('button',{name:'Replay answer retrieval'})).toBeDisabled();
  await page.getByRole('button',{name:'Stored',exact:false}).click();
  await expect(lab).toHaveAttribute('data-phase','stored');
  await expect(page.locator('[data-engine-count]')).toHaveText('2,632');
  await expect(page.locator('[data-answer]')).toHaveText(frozen!);
  await page.getByRole('button',{name:'Replay answer retrieval'}).click();
  await expect(lab).toHaveAttribute('data-phase','recovered');
  await expect(page.locator('[data-answer]')).toContainText('READY TO OPEN');
  await expect(page.locator('[data-answer]')).toHaveText(execution.final_answer.replace(/\*\*/g,''));
  await expect(page.locator('[data-client-count]')).toHaveText('2,632 characters recovered');
  await expect(page.locator('[data-client-route]')).toHaveText('GET result / 200');
  expect(liveRequests).toEqual([]);
  await page.getByRole('button',{name:'Reset replay'}).click();
  await expect(lab).toHaveAttribute('data-phase','ready');
  await expect(page.locator('[data-answer]')).toBeEmpty();
  await expect(page.getByRole('button',{name:'Replay answer retrieval'})).toBeDisabled();
});

test('play, pause and timeline controls preserve the recorded boundary', async ({page})=>{
  await page.goto('/labs/recovery/');
  await page.getByRole('button',{name:'Jump to disconnect'}).click();
  await expect(page.locator('[data-recovery-lab]')).toHaveAttribute('data-phase','disconnected');
  await page.getByRole('button',{name:'Pause replay'}).click();
  const stopped=await page.locator('[data-clock]').textContent();
  await page.waitForTimeout(250);
  await expect(page.locator('[data-clock]')).toHaveText(stopped!);
  await page.locator('[data-playhead]').focus();
  await page.keyboard.press('End');
  await expect(page.locator('[data-recovery-lab]')).toHaveAttribute('data-phase','recovered');
  await page.keyboard.press('Home');
  await expect(page.locator('[data-recovery-lab]')).toHaveAttribute('data-phase','ready');
});

for(const viewport of [{width:390,height:844},{width:820,height:1180},{width:1440,height:1000}]){
  test(`recovery is visible, readable and contained at ${viewport.width}px`,async({page})=>{
    await page.setViewportSize(viewport);
    const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('/labs/recovery/');
    await page.getByRole('button',{name:'Disconnected',exact:false}).click();
    await page.locator('[data-client-state]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-client-state]')).toBeInViewport();
    await expect(page.locator('[data-freeze-note]')).toBeVisible();
    await page.getByRole('button',{name:'Stored',exact:false}).click();
    await page.getByRole('button',{name:'Replay answer retrieval'}).click();
    await page.locator('[data-answer]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-answer]')).toContainText('READY TO OPEN');
    const geometry=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,answer:document.querySelector('[data-answer]')!.getBoundingClientRect().toJSON()}));
    expect(geometry.scroll).toBeLessThanOrEqual(geometry.width+1);
    expect(geometry.answer.width).toBeGreaterThan(viewport.width<1000?250:350);
    expect(errors).toEqual([]);
  });
}

test('downloadable receipt proves the published answer and clearly states substitutions',async({page,request})=>{
  const response=await request.get('/media/recovery/execution-receipt.json');
  expect(response.status()).toBe(200);
  const receipt=await response.json();
  expect(receipt.checks.running_http_status).toBe(202);
  expect(receipt.checks.recovered_http_status).toBe(200);
  expect(receipt.checks.second_read_identical).toBe(true);
  expect(receipt.checks.outbox_enqueued).toBe(true);
  expect(receipt.checks.delivery_worker_started).toBe(false);
  expect(receipt.payload.final_text).toBe(receipt.payload.result);
  expect(receipt.payload.final_text).toBe(execution.final_answer);
  expect(receipt.payload.tool_calls).toEqual([]);
  expect(JSON.stringify(receipt)).not.toMatch(/accessToken|refreshToken|Bearer |sk-ant|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/);
  await page.goto('/labs/recovery/');
  await page.getByText('Inspect the execution receipt',{exact:false}).click();
  await expect(page.getByText('A client connection closed while the engine kept running.',{exact:true})).toBeVisible();
  await expect(page.getByText('This run did not test a process restart', {exact:false})).toBeVisible();
  const video=page.locator('video');
  await expect(video).toHaveAttribute('controls','');
  await expect(video.locator('track')).toHaveAttribute('src','/media/recovery/execution.vtt');
});

test('phone actions keep the frozen client and continuing engine together',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/labs/recovery/');
  await expect(page.getByRole('button',{name:'Play the recorded task'})).toBeInViewport();
  await page.getByRole('button',{name:'Jump to disconnect'}).click();
  await expect(page.locator('[data-mobile-client]')).toBeInViewport();
  await expect(page.locator('[data-mobile-engine]')).toBeInViewport();
  await expect(page.locator('[data-mobile-client]')).toHaveText('23 characters');
  await expect(page.locator('[data-mobile-client-state]')).toHaveText('Disconnected');
  await expect(page.locator('[data-mobile-engine-state]')).toHaveText('Working');
  await expect.poll(async()=>Number((await page.locator('[data-mobile-engine]').textContent())!.replaceAll(',','').replace(' characters',''))).toBeGreaterThan(23);
  await expect(page.locator('[data-mobile-client]')).toHaveText('23 characters');
});
