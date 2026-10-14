import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { matches, position } from '../../src/releases/model';
const inventory = JSON.parse(readFileSync(new URL('../../src/releases/inventory.json',import.meta.url),'utf8'));
const summary = JSON.parse(readFileSync(new URL('../../src/releases/summary.json',import.meta.url),'utf8'));
const milestones = JSON.parse(readFileSync(new URL('../../src/releases/milestones.json',import.meta.url),'utf8'));

test('release source coverage is complete, safe and referenced', async () => {
  expect(inventory).toHaveLength(3666);
  expect(summary.projects).toHaveLength(21);
  expect(milestones).toHaveLength(30);
  expect(summary.projects.reduce((n: number,p: {tagCount:number})=>n+p.tagCount,0)).toBe(inventory.length);
  expect(new Set(inventory.map((t: {project:string;tag:string})=>`${t.project}/${t.tag}`)).size).toBe(inventory.length);
  for (const tag of inventory) {
    expect(Object.keys(tag).sort()).toEqual(['commit','date','kind','project','tag','timestamp']);
    expect(tag.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(tag.commit).toMatch(/^[0-9a-f]{9}$/);
  }
  for (const story of milestones) if(story.tag) expect(inventory.find((tag: {project:string;tag:string})=>tag.project===story.project&&tag.tag===story.tag)).toMatchObject({date:story.date,commit:story.commit,kind:story.kind});
  expect(summary.projects.find((p:{id:string})=>p.id==='legobro').tagCount).toBe(0);
  expect(summary.projects.find((p:{id:string})=>p.id==='panel-forge').firstCommit.date).toBe('2025-05-01');
  expect(summary.projects.find((p:{id:string})=>p.id==='metaclaude').firstCommit.date).toBe('2025-12-17');
});

test('date boundaries and combinations use inclusive source days', () => {
  const filters={project:'panel-forge',kind:'patch',query:'web-v10.20.95',from:'2026-10-12',to:'2026-10-12'};
  const results=inventory.filter((tag:any)=>matches(tag,filters));
  expect(results).toHaveLength(1);
  expect(results[0].tag).toBe('web-v10.20.95');
  expect(matches(results[0],{...filters,to:'2026-10-11'})).toBe(false);
  expect(matches(results[0],{...filters,project:'codex-engine'})).toBe(false);
  expect(position('2026-10-12','2026-10-12','2026-10-12')).toBe(50);
});

test('the map focuses a real milestone and supports keyboard navigation', async ({page}) => {
  await page.goto('/releases/');
  await expect(page.locator('[data-release-focus]')).toContainText('Read the story before opening the session');
  const marker=page.locator('[data-milestone="one-gallery"]');
  await marker.focus();await page.keyboard.press('Enter');
  await expect(page.locator('[data-release-focus]')).toContainText('Put browsing and organisation together');
  await expect(marker).toHaveAttribute('aria-current','true');
  await expect(page).toHaveURL(/#milestone-one-gallery$/);
  await page.getByRole('button',{name:'Next matching milestone'}).click();
  await expect(page.locator('[data-release-focus]')).toContainText('Carry the reference into the conversation');
  await page.goto('/releases/#milestone-grounded-analysis');
  await expect(page.locator('[data-release-focus]')).toContainText('Look up the evidence before keeping a fact');
});

test('project, marker, date and search filters combine across stories and inventory', async ({page}) => {
  await page.goto('/releases/');
  await page.locator('select[name="project"]').selectOption('panel-forge');
  await page.locator('select[name="kind"]').selectOption('patch');
  await page.locator('input[name="from"]').fill('2026-10-12');
  await page.locator('input[name="to"]').fill('2026-10-12');
  await page.locator('input[name="query"]').fill('web-v10.20.95');
  await expect(page.locator('[data-release-status]')).toHaveText('1 of 30 reviewed milestones match');
  await expect(page.locator('[data-milestone]:visible')).toHaveCount(1);
  await page.locator('[data-release-inventory] summary').click();
  await expect(page.locator('[data-tag-rows] tr')).toHaveCount(1);
  await expect(page.locator('[data-tag-rows]')).toContainText('web-v10.20.95');
  await page.getByRole('button',{name:'Reset filters'}).click();
  await expect(page.locator('[data-release-status]')).toHaveText('30 of 30 reviewed milestones match');
  await expect(page.locator('[data-tag-rows] tr')).toHaveCount(30);
  await expect(page.locator('[data-inventory-status]')).toContainText('3,666 matching tags');
  await page.getByRole('button',{name:'Later page'}).click();
  await expect(page.locator('[data-tag-page]')).toHaveText('Page 2 of 123');
  await page.locator('select[name="project"]').selectOption('metacodex');
  await expect(page.locator('[data-tag-page]')).toHaveText('Page 1 of 1');
  await expect(page.locator('[data-tag-rows] tr')).toHaveCount(29);
});

test('period changes, empty results, invalid dates and other markers remain legible',async({page})=>{
  await page.goto('/releases/');
  await page.locator('select[name="period"]').selectOption('october');
  await expect(page.locator('input[name="from"]')).toHaveValue('2026-10-01');
  await expect(page.locator('[data-release-status]')).toHaveText('7 of 30 reviewed milestones match');
  await page.locator('select[name="project"]').selectOption('legobro');
  await expect(page.locator('[data-release-status]')).toHaveText('0 of 30 reviewed milestones match');
  await expect(page.locator('[data-focus-wrap]')).toBeHidden();
  await page.locator('[data-release-inventory] summary').click();
  await expect(page.locator('[data-inventory-status]')).toContainText('0 matching tags');
  await page.getByRole('button',{name:'Reset filters'}).click();
  await page.locator('select[name="kind"]').selectOption('other');
  await expect(page.locator('[data-tag-rows] tr')).toHaveCount(1);
  await expect(page.locator('[data-tag-rows]')).toContainText('mac-v0.0.0-test');
  await page.locator('input[name="from"]').fill('2026-10-14');
  await page.locator('input[name="to"]').fill('2026-10-01');
  await expect(page.locator('[data-release-status]')).toContainText('start date must be on or before');
});

for(const width of [390,834,1440]) test(`release map and inventory fit ${width}px and have no accessibility violations`,async({page})=>{
  await page.setViewportSize({width,height:1000});await page.goto('/releases/');
  await page.locator('[data-release-inventory] summary').click();
  await expect(page.locator('[data-tag-rows] tr')).toHaveCount(30);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.waitForTimeout(750);
  if(width>620){
    const overlaps=await page.locator('[data-milestone]:visible').evaluateAll(nodes=>{const boxes=nodes.map(node=>({id:(node as HTMLElement).dataset.milestone,box:node.getBoundingClientRect()}));return boxes.flatMap((a,i)=>boxes.slice(i+1).filter(b=>a.box.left<b.box.right&&a.box.right>b.box.left&&a.box.top<b.box.bottom&&a.box.bottom>b.box.top).map(b=>`${a.id}/${b.id}`));});
    expect(overlaps).toEqual([]);
  }
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
});

test('without JavaScript the curated journey and coverage are readable',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
  await page.goto('/releases/');await page.locator('.release-reading summary').click();
  await expect(page.locator('[data-story]:visible')).toHaveCount(30);
  await expect(page.locator('.release-reading')).toContainText('The actual Code History implementation session');
  await page.locator('.release-coverage summary').click();
  await expect(page.locator('.release-coverage')).toContainText('no tags in inspected snapshot');
  await expect(page.locator('select[name="period"]')).toBeDisabled();
  await context.close();
});

test('inventory loads on demand and filtered downloads retain only safe metadata',async({page})=>{
  const requests:string[]=[];page.on('request',request=>requests.push(request.url()));
  await page.goto('/releases/');await expect(page.locator('[data-release-controls]')).not.toHaveAttribute('disabled','');
  expect(requests.some(url=>url.includes('/inventory'))).toBe(false);
  await page.locator('select[name="project"]').selectOption('metaclaude');
  await page.locator('[data-release-inventory] summary').click();
  await expect(page.locator('[data-inventory-status]')).toContainText('60 matching tags');
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download filtered JSON'}).click();const download=await downloadPromise;
  const data=JSON.parse(readFileSync((await download.path())!,'utf8'));
  expect(data.tags).toHaveLength(60);expect(data.asOf).toBe('2026-10-14');expect(data.tags.every((tag:{project:string})=>tag.project==='metaclaude')).toBe(true);
  expect(Object.keys(data.tags[0]).sort()).toEqual(['commit','date','kind','project','tag','timestamp']);
});
