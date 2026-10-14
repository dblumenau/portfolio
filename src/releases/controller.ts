import { setIconLabel } from '../ui/icons';
import stories from './milestones.json';
import summary from './summary.json';
import { matches, periods, position, formatDate, pageSize, type Milestone, type TagRecord, type ReleaseFilters } from './model';

export function mountReleaseExplorer(): void {
  const root = document.querySelector<HTMLElement>('[data-release-explorer]');
  if (!root) return;
  const form = root.querySelector<HTMLFormElement>('form')!;
  const control = (name: string) => form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement;
  root.querySelector<HTMLFieldSetElement>('[data-release-controls]')!.disabled = false;
  const status = root.querySelector<HTMLElement>('[data-release-status]')!;
  const focus = root.querySelector<HTMLElement>('[data-release-focus]')!;
  const focusWrap = root.querySelector<HTMLElement>('[data-focus-wrap]')!;
  const reading = root.querySelector<HTMLDetailsElement>('.release-reading')!;
  const inventory = root.querySelector<HTMLDetailsElement>('[data-release-inventory]')!;
  const inventoryStatus = root.querySelector<HTMLElement>('[data-inventory-status]')!;
  const rows = root.querySelector<HTMLTableSectionElement>('[data-tag-rows]')!;
  const tagPrev = root.querySelector<HTMLButtonElement>('[data-tags-prev]')!;
  const tagNext = root.querySelector<HTMLButtonElement>('[data-tags-next]')!;
  const download = root.querySelector<HTMLButtonElement>('[data-tags-download]')!;
  const storyPrev = root.querySelector<HTMLButtonElement>('[data-story-prev]')!;
  const storyNext = root.querySelector<HTMLButtonElement>('[data-story-next]')!;
  const markers = [...root.querySelectorAll<HTMLAnchorElement>('[data-milestone]')];
  const storyItems = [...root.querySelectorAll<HTMLLIElement>('[data-story]')];
  const labels = new Map(summary.projects.map(project => [project.id,project.label]));
  let selected = 'session-peek';
  let matchingStories: Milestone[] = stories;
  let allTags: TagRecord[] | null = null;
  let loadingTags: Promise<void> | null = null;
  let matchingTags: TagRecord[] = [];
  let page = 0;
  const filters = (): ReleaseFilters => ({project:control('project').value,kind:control('kind').value,query:control('query').value,from:control('from').value,to:control('to').value});
  const setHash = (id: string) => history.replaceState(null,'',`${location.pathname}${location.search}#milestone-${id}`);
  function select(id: string, updateUrl = true): void {
    const item = storyItems.find(item => item.dataset.story === id);
    if (!item || !matchingStories.some(story => story.id === id)) return;
    selected = id;
    const source = item.querySelector<HTMLElement>('article')!;
    const text = document.createElement('div');
    const media = source.querySelector('figure')?.cloneNode(true);
    for (const child of source.children) if (child.tagName !== 'FIGURE') text.append(child.cloneNode(true));
    focus.replaceChildren(text);
    if (media) focus.append(media);
    focus.classList.toggle('has-media',Boolean(media));
    focusWrap.hidden = false;
    markers.forEach(marker => {
      const active = marker.dataset.milestone === id;
      marker.classList.toggle('is-selected',active);
      if(active) marker.setAttribute('aria-current','true'); else marker.removeAttribute('aria-current');
    });
    const index = matchingStories.findIndex(story => story.id === id);
    storyPrev.disabled = index <= 0;
    storyNext.disabled = index >= matchingStories.length - 1;
    if (updateUrl) setHash(id);
    focus.animate?.([{opacity:0.35,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'ease-out'});
  }
  function renderTags(): void {
    if (!allTags) return;
    const f = filters();
    matchingTags = allTags.filter(tag => matches(tag,f,labels.get(tag.project)));
    const pages = Math.max(1,Math.ceil(matchingTags.length/pageSize));
    page = Math.min(page,pages-1);
    const displayed = matchingTags.slice(page*pageSize,(page+1)*pageSize);
    const fragment = document.createDocumentFragment();
    for (const tag of displayed) {
      const tr = document.createElement('tr');
      for (const value of [formatDate(tag.date),labels.get(tag.project) ?? tag.project,tag.tag,tag.kind,tag.commit]) {
        const cell = document.createElement('td');cell.textContent = value;tr.append(cell);
      }
      tr.dataset.project=tag.project;tr.dataset.kind=tag.kind;tr.dataset.date=tag.date;
      fragment.append(tr);
    }
    rows.replaceChildren(fragment);
    inventoryStatus.textContent = `${matchingTags.length.toLocaleString('en-GB')} matching tags. ${matchingTags.length ? `Showing ${page*pageSize+1}–${Math.min((page+1)*pageSize,matchingTags.length)}.` : 'Try a broader period, project or marker.'}`;
    root!.querySelector<HTMLElement>('[data-tag-page]')!.textContent = `Page ${page+1} of ${pages}`;
    tagPrev.disabled = page===0;tagNext.disabled = page>=pages-1;download.disabled=matchingTags.length===0;
  }
  function arrangeMarkers(from: string, to: string): void {
    root!.querySelectorAll<HTMLElement>('[data-lane]').forEach(lane=>{
      const track=lane.querySelector<HTMLElement>('.release-lane-track')!;
      const width=track.getBoundingClientRect().width;
      const rowEnds: number[]=[];
      lane.querySelectorAll<HTMLAnchorElement>('[data-milestone]').forEach(marker=>{
        if(marker.hidden)return;
        const percent=position(marker.dataset.date!,from,to);
        const x=Math.max(0,Math.min(width-32,width*percent/100-16));
        let slot=rowEnds.findIndex(end=>x-end>=7);
        if(slot<0)slot=rowEnds.length;
        rowEnds[slot]=x+32;
        marker.style.setProperty('--position',`${percent}%`);
        marker.style.setProperty('--slot',String(slot));
        marker.style.setProperty('--shift','0px');
      });
      lane.style.setProperty('--lane-height',`${Math.max(120,26+rowEnds.length*34)}px`);
    });
  }
  function render(): void {
    const f = filters();
    matchingStories = stories.filter(story=>matches(story,f,labels.get(story.project)));
    const ids = new Set(matchingStories.map(story=>story.id));
    const invalidRange = Boolean(f.from && f.to && f.from > f.to);
    status.textContent = invalidRange ? 'The start date must be on or before the end date.' : `${matchingStories.length} of ${stories.length} reviewed milestones match`;
    root!.querySelector<HTMLElement>('[data-empty-stories]')!.hidden = matchingStories.length!==0;
    root!.querySelector<HTMLElement>('[data-period-caption]')!.textContent = periods.find(period=>period.id===control('period').value)?.caption ?? 'Focus on a part of the journey.';
    storyItems.forEach(item=>{item.hidden=!ids.has(item.dataset.story!);});
    const from = f.from || periods[0].from,to=f.to || periods[0].to;
    markers.forEach(marker=>{marker.hidden=!ids.has(marker.dataset.milestone!);});
    arrangeMarkers(from,to);
    root!.querySelectorAll<HTMLElement>('[data-lane]').forEach(lane=>{lane.classList.toggle('is-empty',!matchingStories.some(story=>story.area===lane.dataset.lane));});
    const axis = root!.querySelector<HTMLElement>('.release-map-axis')!;
    axis.replaceChildren();
    if(!invalidRange){[from,to].forEach(date=>{const span=document.createElement('span');span.textContent=formatDate(date);axis.append(span);});}
    if(matchingStories.length) select(ids.has(selected)?selected:matchingStories[0].id,false);
    else {focusWrap.hidden=true;storyPrev.disabled=true;storyNext.disabled=true;markers.forEach(marker=>{marker.classList.remove('is-selected');marker.removeAttribute('aria-current');});}
    renderTags();
  }
  async function loadTags(): Promise<void> {
    if (allTags) {renderTags();return;}
    if (loadingTags) return loadingTags;
    inventoryStatus.textContent='Loading the verified tag index…';
    loadingTags=import('./inventory.json').then(module=>{allTags=module.default;renderTags();}).catch(()=>{inventoryStatus.textContent='The inventory could not load. Close and reopen this section to retry.';loadingTags=null;});
    return loadingTags;
  }
  root.querySelector<HTMLAnchorElement>('.release-jump')!.addEventListener('click',event=>{event.preventDefault();reading.open=true;reading.scrollIntoView({behavior:'smooth',block:'start'});});
  form.addEventListener('submit',event=>event.preventDefault());
  form.addEventListener('input',event=>{
    const target=event.target as HTMLInputElement | HTMLSelectElement;
    if(target.name==='period'){
      const period=periods.find(period=>period.id===target.value);
      if(period){control('from').value=period.from;control('to').value=period.to;}
    } else if (target.name==='from'||target.name==='to') control('period').value='custom';
    page=0;render();
  });
  form.addEventListener('reset',()=>{setTimeout(()=>{page=0;selected='session-peek';render();history.replaceState(null,'',location.pathname);},0);});
  markers.forEach(marker=>marker.addEventListener('click',event=>{event.preventDefault();select(marker.dataset.milestone!);if(matchMedia('(max-width: 620px)').matches){focusWrap.scrollIntoView({behavior:'smooth',block:'start'});focus.focus({preventScroll:true});}}));
  root.querySelector<HTMLButtonElement>('[data-map-return]')!.addEventListener('click',()=>{const marker=markers.find(item=>item.dataset.milestone===selected);root.querySelector<HTMLElement>('.release-map')!.scrollIntoView({behavior:'smooth',block:'start'});marker?.focus({preventScroll:true});});
  storyPrev.addEventListener('click',()=>{const index=matchingStories.findIndex(story=>story.id===selected);if(index>0)select(matchingStories[index-1].id);});
  storyNext.addEventListener('click',()=>{const index=matchingStories.findIndex(story=>story.id===selected);if(index+1<matchingStories.length)select(matchingStories[index+1].id);});
  inventory.addEventListener('toggle',()=>{if(inventory.open)void loadTags();});
  tagPrev.addEventListener('click',()=>{if(page>0){page--;renderTags();}});
  tagNext.addEventListener('click',()=>{if((page+1)*pageSize<matchingTags.length){page++;renderTags();}});
  download.addEventListener('click',()=>{
    const contents={asOf:summary.asOf,dateBasis:summary.dateBasis,filters:filters(),tags:matchingTags};
    const url=URL.createObjectURL(new Blob([JSON.stringify(contents,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='forge-release-checkpoints.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  const applyHash=()=>{
    const id=location.hash.replace(/^#milestone-/,'');
    if(stories.some(story=>story.id===id)) {
      if(!matchingStories.some(story=>story.id===id)){control('period').value='all';control('project').value='';control('kind').value='';control('query').value='';control('from').value=periods[0].from;control('to').value=periods[0].to;render();}
      select(id,false);
    }
  };
  window.addEventListener('hashchange',applyHash);
  reading.addEventListener('toggle',()=>{if(reading.open)setIconLabel(root!.querySelector<HTMLElement>('.release-reading summary span:last-child')!, `${matchingStories.length} matching changes`, 'arrow-up');});
  let observedWidth=0;
  const resize=new ResizeObserver(entries=>{
    const width=entries[0]?.contentRect.width??0;
    if(Math.abs(width-observedWidth)>1){observedWidth=width;const f=filters();arrangeMarkers(f.from||periods[0].from,f.to||periods[0].to);}
  });
  resize.observe(root.querySelector<HTMLElement>('.release-map')!);
  render();applyHash();
}
