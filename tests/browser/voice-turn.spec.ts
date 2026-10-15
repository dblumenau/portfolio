import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';

test.use({ launchOptions: { args: ['--mute-audio'] } });
const route='/features/voice-conversation-loop/#recorded-voice-turn';
const section=(page:Page)=>page.locator('[data-recorded-voice-turn]');
async function nativePlay(page:Page,selector:string){const media=page.locator(selector);await media.focus();await page.keyboard.press('Space');await expect.poll(()=>media.evaluate((el:HTMLMediaElement)=>!el.paused)).toBe(true);return media;}
async function open(page:Page){await page.goto(route);await section(page).scrollIntoViewIfNeeded();}

test('selected receipt preserves the upload identity, declared conversion and exact reply bytes',async({request})=>{
 const r=await request.get('/media/voice-turn/receipt.json');const data=await r.json();expect(data.recording.uploadedSha256).toBe('a9113abaeaa962084647cfa36c2fee3b160d2d9645fd2975e7eaf72ce0b614be');expect(data.recording.uploadedBytes).toBe(96427);expect(data.recording.recognizedTextRaw).toBe(' For an imaginary moon garden, name one blue flower. Answer in one short sentence.');expect(data.reply.text).toBe('Moonlight Bellflower.');expect(data.sources.observedModel).toBe('claude-haiku-5-5');expect(data.observations).toMatchObject({completedModelTurns:1,ttsChunkIndices:[0],persistedMessages:2,toolCalls:0});
 const bytes=await (await request.get('/media/voice-turn/reply.wav')).body();expect(bytes.length).toBe(60644);expect(createHash('sha256').update(bytes).digest('hex')).toBe('290f2c8a0f9fe02d15d221974ccaafd13459f1bfaa3c5334e2adc0200a62acec');
 for(const [name,asset] of Object.entries(data.artifacts) as [string,{sha256:string,bytes:number}][]){const bytes=await (await request.get('/media/voice-turn/'+name)).body();expect(bytes.length).toBe(asset.bytes);expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);}
 expect(data.artifacts['recorded-request.wav'].sha256).not.toBe(data.recording.uploadedSha256);
 const text=JSON.stringify(data);expect(text).not.toMatch(/(?:\/home\/|127\.0\.0\.1|localhost|session_id|message_id|asset_id|conversation_id|Bearer |access_token|refresh_token)/);
});

test('ordinary reading is quiet, local and leaves the separate tone runtime unarmed',async({page,context})=>{
 const requests:string[]=[];context.on('request',r=>requests.push(r.url()));await context.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:')?r.continue():r.abort());
 await page.addInitScript(()=>{(window as any).__voiceMicCalls=0;navigator.mediaDevices.getUserMedia=async()=>{(window as any).__voiceMicCalls++;throw Error('Saved exhibit must not request microphone');};});
 await open(page);await section(page).locator('[data-voice-method] summary').click();await section(page).locator('[data-voice-film] summary').click();await page.waitForTimeout(300);
 expect(await section(page).locator('audio,video').evaluateAll(es=>es.every(e=>(e as HTMLMediaElement).paused&&(e as HTMLMediaElement).currentTime===0))).toBe(true);expect(await page.evaluate(()=>(window as any).__voiceMicCalls)).toBe(0);expect(requests.some(u=>/voice-turn\/(?:recorded-request|reply)\.wav/.test(u))).toBe(false);expect(requests.every(u=>u.startsWith('http://127.0.0.1:'))).toBe(true);
 await expect(page.locator('[data-audio-badge]')).toHaveText('Audio off');await expect(page.locator('.feature-exhibit-voice')).toHaveCount(0);await expect(section(page)).toContainText('isolated wrapper');await expect(section(page)).toContainText('opens no microphone');
});

test('both native clips complete their full files after keyboard intent without automatic chaining',async({page})=>{
 await open(page);const input=await nativePlay(page,'[data-voice-input]');await expect.poll(()=>input.evaluate((e:HTMLMediaElement)=>e.currentTime)).toBeGreaterThan(.1);await expect.poll(()=>input.evaluate((e:HTMLMediaElement)=>e.ended),{timeout:12000}).toBe(true);expect(await input.evaluate((e:HTMLMediaElement)=>e.duration)).toBeCloseTo(8.04,2);await expect(page.locator('[data-voice-reply]')).toHaveJSProperty('paused',true);
 const reply=await nativePlay(page,'[data-voice-reply]');await expect.poll(()=>reply.evaluate((e:HTMLMediaElement)=>e.ended)).toBe(true);expect(await reply.evaluate((e:HTMLMediaElement)=>e.duration)).toBeCloseTo(1.2625,3);await expect(input).toHaveJSProperty('paused',true);await expect(page.locator('[data-audio-badge]')).toHaveText('Audio off');
});

test('coordination and synthetic pagehide pause only the new native media',async({page})=>{
 await open(page);await nativePlay(page,'[data-voice-input]');await nativePlay(page,'[data-voice-reply]');await expect(page.locator('[data-voice-input]')).toHaveJSProperty('paused',true);
 await section(page).locator('[data-voice-film] summary').click();await nativePlay(page,'[data-voice-video]');await expect(page.locator('[data-voice-reply]')).toHaveJSProperty('paused',true);await section(page).locator('[data-voice-film] summary').click();await expect(page.locator('[data-voice-video]')).toHaveJSProperty('paused',true);
 await nativePlay(page,'[data-voice-input]');await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await expect(page.locator('[data-voice-input]')).toHaveJSProperty('paused',true);await page.waitForTimeout(200);await expect(page.locator('[data-voice-reply]')).toHaveJSProperty('paused',true);await expect(page.locator('[data-audio-badge]')).toHaveText('Audio off');
});

test('playing saved speech does not hang or stop the retained three-note queue',async({page})=>{
 await open(page);await expect(page.locator('[data-audio-intent]')).toHaveAttribute('data-audio-ready','true');await page.locator('[data-audio-listen]').click();await expect(page.locator('[data-audio-badge]')).not.toHaveText('Audio off');await nativePlay(page,'[data-voice-input]');await expect(page.locator('[data-audio-message]')).toContainText(/finished|complete|played/i,{timeout:10000});await expect(page.locator('[data-voice-input]')).toHaveJSProperty('paused',false);
});

test('native clips and disclosures remain usable without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await open(page);await expect(section(page).locator('audio')).toHaveCount(2);await expect(section(page)).toContainText('Moonlight Bellflower.');const reply=await nativePlay(page,'[data-voice-reply]');await expect.poll(()=>reply.evaluate((e:HTMLMediaElement)=>e.ended)).toBe(true);await section(page).locator('[data-voice-film] summary').focus();await page.keyboard.press('Enter');await expect(page.locator('[data-voice-video]')).toBeVisible();await expect(section(page).locator('track')).toHaveAttribute('kind','captions');await context.close();
});

for(const width of [360,390,834,1440])test(`native controls and scope remain readable at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:width<500?844:1000});await open(page);await expect(page.getByRole('link',{name:'Inspect the recorded voice turn'})).toHaveAttribute('href','#recorded-voice-turn');await section(page).locator('[data-voice-film] summary').click();await section(page).locator('[data-voice-method] summary').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 for(const media of await section(page).locator('audio,video').all()){const box=await media.boundingBox();expect(box).not.toBeNull();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width+1);}
 await page.screenshot({path:test.info().outputPath(`voice-turn-${width}.png`),fullPage:true});const axe=await new AxeBuilder({page}).include('[data-recorded-voice-turn]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(axe.violations).toEqual([]);
});

test('the native silent film reaches its real end with action captions and no audio chaining',async({page})=>{
 await open(page);await section(page).locator('[data-voice-film] summary').click();const video=await nativePlay(page,'[data-voice-video]');await expect.poll(()=>video.evaluate((e:HTMLVideoElement)=>e.textTracks[0]?.mode)).toBe('showing');await expect.poll(()=>video.evaluate((e:HTMLVideoElement)=>e.currentTime)).toBeGreaterThan(.1);await expect.poll(()=>video.evaluate((e:HTMLVideoElement)=>e.ended),{timeout:25000}).toBe(true);expect(await video.evaluate((e:HTMLVideoElement)=>e.duration)).toBeCloseTo(20.88,1);expect(await section(page).locator('audio').evaluateAll(es=>es.every(e=>(e as HTMLAudioElement).paused))).toBe(true);await expect(page.locator('[data-audio-badge]')).toHaveText('Audio off');
});

test('actual page navigation pauses the saved native clip and Back never auto-resumes it',async({page})=>{
 await page.addInitScript(()=>{const pause=HTMLMediaElement.prototype.pause;HTMLMediaElement.prototype.pause=function(...args){const result=pause.apply(this,args);if(this.closest('[data-recorded-voice-turn]'))sessionStorage.setItem('voiceNativePaused',JSON.stringify({src:this.currentSrc||this.src,paused:this.paused}));return result;};});
 await open(page);await nativePlay(page,'[data-voice-input]');await page.evaluate(()=>sessionStorage.removeItem('voiceNativePaused'));await page.locator('.feature-back').click();await expect(page).toHaveURL(/\/features\/$/);const stopped=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('voiceNativePaused')??'null'));expect(stopped).toMatchObject({paused:true});expect(stopped.src).toContain('/media/voice-turn/recorded-request.wav');await page.goBack();await expect(page.locator('[data-voice-input]')).toHaveJSProperty('paused',true);await page.waitForTimeout(200);await expect(page.locator('[data-voice-reply]')).toHaveJSProperty('paused',true);
});
