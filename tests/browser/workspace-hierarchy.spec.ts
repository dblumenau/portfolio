import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const route='/features/workspace-hierarchy/';
const sectionSelector='[data-workspace-showcase]';
async function frame(page:import('@playwright/test').Page,id:string){const section=page.locator(sectionSelector);await expect(section.locator('[data-workspace-frame]:visible')).toHaveCount(1);const image=section.locator(`[data-workspace-frame="${id}"] img`);await expect(image).toBeVisible();await expect.poll(()=>image.evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true)}

test('the existing feature replaces the invented exhibit with a disclosed real move and keyboard-operable captures',async({page})=>{
 await page.goto(route);const section=page.locator(sectionSelector);
 await expect(page.getByRole('heading',{level:1})).toHaveText('Move the project. Keep its contents together.');
 await expect(page.getByRole('link',{name:'Watch the project move'})).toHaveAttribute('href','#workspace-in-motion');
 await expect(page.locator('#small-example')).toHaveCount(0);await expect(page.locator('main')).not.toContainText('Lantern');
 await expect(section.locator('#workspace-film-scope')).toContainText('Includes an unreleased fix that loads the workspace destinations');
 await frame(page,'after');await section.getByRole('radio',{name:'After reload',exact:true}).focus();await page.keyboard.press('ArrowLeft');await frame(page,'before');await expect(section.getByRole('radio',{name:'Before',exact:true})).toBeFocused();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await frame(page,'phone');
 await expect(section.locator('[data-workspace-frame="phone"]')).toContainText('The move itself was recorded on desktop');
 await section.getByRole('link',{name:'Open full-size Phone tree capture'}).click();await expect(page).toHaveURL(/\/media\/workspace-hierarchy\/phone-after.png$/);await page.goBack();
 await section.locator('.workspace-method>summary').click();await expect(section.locator('.workspace-method')).toContainText('Seventeen separate client UI tests passed with mocked requests');await expect(section.locator('.workspace-method')).toContainText('The assignment timestamp remained unchanged');
 await expect(section.getByRole('link',{name:'See the PanelForge case study'})).toHaveAttribute('href','/work/panelforge/');
});

for(const width of [390,834,1440])test(`responsive content, labels and real native captions at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(route);const section=page.locator(sectionSelector);
 for(const [label,id] of [['Before','before'],['After reload','after'],['Phone tree','phone']]){await section.getByRole('radio',{name:label,exact:true}).check();await frame(page,id)}
 await section.getByRole('radio',{name:'After reload',exact:true}).check();await section.locator('.workspace-method>summary').click();
 expect(await section.evaluate(e=>({overflow:document.documentElement.scrollWidth>innerWidth,smallText:[...e.querySelectorAll('p,figcaption,label,legend,summary,a,code')].filter(x=>Number.parseFloat(getComputedStyle(x).fontSize)<14).map(x=>x.textContent),smallTargets:[...e.querySelectorAll('label,summary,a')].filter(x=>x.getBoundingClientRect().width>0&&x.getBoundingClientRect().height<44).map(x=>x.textContent)}))).toEqual({overflow:false,smallText:[],smallTargets:[]});
 const axe=await new AxeBuilder({page}).include(sectionSelector).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(axe.violations.map(x=>({id:x.id,nodes:x.nodes.map(n=>n.target)}))).toEqual([]);
 await page.evaluate(()=>document.fonts.ready);await section.screenshot({path:test.info().outputPath(`workspace-${width}.png`)});
 const video=section.locator('video');await video.scrollIntoViewIfNeeded();await video.focus();await page.keyboard.press('Space');await expect.poll(()=>video.evaluate((e:HTMLVideoElement)=>!e.paused&&e.currentTime>0)).toBe(true);await video.evaluate((e:HTMLVideoElement)=>{e.pause();e.currentTime=7;e.textTracks[0].mode='showing'});await expect.poll(()=>video.evaluate((e:HTMLVideoElement)=>e.textTracks[0].cues?.length)).toBe(5);await expect.poll(()=>video.evaluate((e:HTMLVideoElement)=>(e.textTracks[0].activeCues?.[0] as VTTCue)?.text)).toBe('Choose Archive in the workspace picker.');
 if(width===390){const cue=await video.evaluate((e:HTMLVideoElement)=>getComputedStyle(e,'::cue').fontSize);expect(Number.parseFloat(cue)).toBeGreaterThanOrEqual(14);expect(await section.locator('#workspace-film-scope').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16)}
 await page.screenshot({path:test.info().outputPath(`workspace-captions-${width}.png`)});expect(errors).toEqual([]);
});

test('native captures, disclosure, film and proof links work without JavaScript',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,javaScriptEnabled:false,viewport:{width:390,height:844}});const page=await context.newPage();await page.goto(route);const section=page.locator(sectionSelector);await frame(page,'after');
 await section.getByRole('radio',{name:'Before',exact:true}).check();await frame(page,'before');await section.getByRole('radio',{name:'Phone tree',exact:true}).check();await frame(page,'phone');await expect(section.locator('#workspace-film-scope')).toBeVisible();await section.locator('.workspace-method>summary').click();await expect(section.getByRole('link',{name:'Read the concise proof receipt'})).toBeVisible();await expect(section.getByRole('link',{name:'Open the 28-second film full size'})).toHaveAttribute('href','/media/workspace-hierarchy/execution.mp4');await section.screenshot({path:test.info().outputPath('workspace-nojs.png')});await context.close();
});

test('the real film seeks through the retained reload with correctly bounded native cues and no autoplay',async({page})=>{
 await page.goto(route);const video=page.locator(`${sectionSelector} video`);await expect(video).toHaveAttribute('controls','');await expect(video).toHaveAttribute('preload','none');await expect(video).not.toHaveAttribute('autoplay','');await expect(video.locator('track')).toHaveAttribute('default','');await video.scrollIntoViewIfNeeded();await video.focus();await page.keyboard.press('Space');await expect.poll(()=>video.evaluate((e:HTMLVideoElement)=>e.duration)).toBeCloseTo(27.6,2);await video.evaluate((e:HTMLVideoElement)=>{e.pause();e.currentTime=19;e.textTracks[0].mode='showing'});await expect.poll(()=>video.evaluate((e:HTMLVideoElement)=>(e.textTracks[0].activeCues?.[0] as VTTCue)?.text)).toBe('Reload the saved hierarchy.');await video.evaluate((e:HTMLVideoElement)=>{e.currentTime=25});await expect.poll(()=>video.evaluate((e:HTMLVideoElement)=>(e.textTracks[0].activeCues?.[0] as VTTCue)?.text)).toBe('The same scenes, panel and image remain together.');expect(await video.evaluate((e:HTMLVideoElement)=>e.textTracks[0].cues?.[4].endTime)).toBeLessThanOrEqual(27.6);await video.focus();await page.keyboard.press('Space');await expect.poll(()=>video.evaluate((e:HTMLVideoElement)=>e.paused)).toBe(false);await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await expect.poll(()=>video.evaluate((e:HTMLVideoElement)=>e.paused)).toBe(true);
});

test('six exact public files and the safe receipt match the reviewed source fragment',async({request})=>{
 const fragment=JSON.parse(await readFile(new URL('../../src/showcases/workspace-hierarchy/media-provenance.fragment.json',import.meta.url),'utf8'));expect(fragment.assets).toHaveLength(6);for(const a of fragment.assets){const res=await request.get(`/media/${a.file}`);expect(res.status(),a.file).toBe(200);const b=await res.body();expect(b.length,a.file).toBe(a.bytes);expect(createHash('sha256').update(b).digest('hex'),a.file).toBe(a.sha256)}
 const res=await request.get('/media/workspace-hierarchy/receipt.json');const text=await res.text(),receipt=JSON.parse(text);expect(receipt.source.unreleasedFix.deployed).toBe(false);expect(receipt.observed.projectFieldsChanged).toEqual(['workspace_id','updated_at']);expect(receipt.observed.imageAssignmentFieldsChanged).toEqual(['workspace_id']);expect(receipt.observed.imageAssignmentTimestampUnchanged).toBe(true);expect(receipt.validation.uiTests.kind).toMatch(/Mocked.*separate from persistence/);expect(receipt.scope.productionAccess).toBe(false);expect(text).not.toMatch(/\/home\/|localhost|127\.0\.0\.1|auth-state|DB_PASSWORD|runtime-env|rowHash|snapshotSha/);
});

test('browsing the static exhibit sends only same-origin static GET requests',async({page,baseURL})=>{
 const unexpected:string[]=[];await page.route('**/*',r=>{const q=r.request();if(q.method()!=='GET'||new URL(q.url()).origin!==new URL(baseURL!).origin||/\/(?:api|mcp)\//.test(q.url())){unexpected.push(q.method()+' '+q.url());return r.abort()}return r.continue()});await page.goto(route);const section=page.locator(sectionSelector);await section.getByRole('radio',{name:'Before',exact:true}).check();await section.getByRole('radio',{name:'Phone tree',exact:true}).check();await section.locator('.workspace-method>summary').click();const video=section.locator('video');await video.scrollIntoViewIfNeeded();await video.focus();await page.keyboard.press('Space');await expect.poll(()=>video.evaluate((e:HTMLVideoElement)=>e.currentTime>0)).toBe(true);await video.evaluate((e:HTMLVideoElement)=>e.pause());expect(unexpected).toEqual([]);
});
