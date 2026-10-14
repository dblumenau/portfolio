import { createIcon, setIconLabel } from '../../ui/icons';
import { entities, relationships, relationKey, typeLabel, formatRelation, sourceExcerpts, type Relationship } from './model';

type Guide = 'find' | 'inspect' | 'edit';
type Snapshot = { hidden: Set<string>; focus: string; selected: string; page: number; search: string; type: string; guide: Guide };
type Edit = { before: Snapshot; relation: Relationship };
type Receipt = { kind: 'aside' | 'undo' | 'reset'; relation?: Relationship };
const SVG_NS = 'http://www.w3.org/2000/svg';

export function mountMemoryLab(root: HTMLElement) {
  const get = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const graph = get<HTMLDivElement>('[data-graph]');
  const search = get<HTMLInputElement>('[data-entity-search]');
  const type = get<HTMLSelectElement>('[data-entity-type]');
  const list = get<HTMLDivElement>('[data-connection-list]');
  const compact = window.matchMedia('(max-width: 600px)');
  const connectionDetails = get<HTMLDetailsElement>('.ml-connection-details');
  connectionDetails.open = !compact.matches;
  const initialRelation = relationships.find((r) => r.subject === 'panelforge' && r.object === 'inertia-js')!;
  let focus = 'panelforge';
  let selected = relationKey(initialRelation);
  let hidden = new Set<string>();
  let page = Math.floor(relationships.filter((r) => r.subject === focus || r.object === focus).findIndex((r) => relationKey(r) === selected) / (compact.matches ? 4 : 8));
  let edits: Edit[] = [];
  let receipts: Receipt[] = [];
  let guide: Guide = 'find';
  const pageSize = () => compact.matches ? 4 : 8;
  const active = () => relationships.filter((r) => !hidden.has(relationKey(r)) && (r.subject === focus || r.object === focus));
  const current = () => relationships.find((r) => relationKey(r) === selected)!;
  const snapshot = (): Snapshot => ({ hidden: new Set(hidden), focus, selected, page, search: search.value, type: type.value, guide });
  const announce = (message: string) => { get('[data-live-message]').textContent = message; };
  const revealSelection = () => { if (compact.matches) get('[data-selection-summary]').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); };
  const inspectSelection = () => {
    guide = 'inspect';
    renderGuide();
    const heading = get('[id="ml-inspector-title"]');
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    announce(`Inspecting ${formatRelation(current())}.`);
  };
  const make = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) => {
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  function filterDirectory() {
    const query = search.value.trim().toLowerCase();
    let count = 0;
    root.querySelectorAll<HTMLButtonElement>('[data-entity]').forEach((button) => {
      const visible = button.dataset.entity!.includes(query) && (type.value === 'all' || button.dataset.type === type.value);
      button.hidden = !visible;
      if (visible) count += 1;
    });
    get('[data-entity-count]').textContent = `${count} of ${entities.length} entity labels`;
    get('[data-entity-empty]').hidden = count !== 0;
  }
  function selectRelation(relation: Relationship, revealPage = true) {
    selected = relationKey(relation);
    if (revealPage) {
      const index = active().findIndex((r) => relationKey(r) === selected);
      if (index >= 0) page = Math.floor(index / pageSize());
    }
    render();
  }
  function focusEntity(label: string) {
    focus = label;
    const nearby = active();
    if (!nearby.some((r) => relationKey(r) === selected)) {
      const next = nearby[0] ?? relationships.find((r) => r.subject === label || r.object === label);
      if (next) selected = relationKey(next);
    }
    const index = nearby.findIndex((r) => relationKey(r) === selected);
    page = index >= 0 ? Math.floor(index / pageSize()) : 0;
    render();
    announce(`Focused ${label}. ${nearby.length} visible connections.`);
  }
  function setAside() {
    const relation = current();
    if (hidden.has(selected)) return;
    edits.push({ before: snapshot(), relation });
    hidden.add(selected);
    receipts.push({ kind: 'aside', relation });
    guide = 'edit';
    render();
    announce(`Set aside ${formatRelation(relation)} in this demo. Undo last edit restores the exact previous view.`);
  }
  function undo() {
    const edit = edits.pop();
    if (!edit) return;
    hidden = new Set(edit.before.hidden);
    focus = edit.before.focus;
    selected = edit.before.selected;
    page = edit.before.page;
    search.value = edit.before.search;
    type.value = edit.before.type;
    guide = edit.before.guide;
    filterDirectory();
    receipts.push({ kind: 'undo', relation: edit.relation });
    render();
    announce(`Restored ${formatRelation(edit.relation)} and its previous focused view.`);
  }
  function reset() {
    hidden = new Set();
    focus = 'panelforge';
    selected = relationKey(initialRelation);
    page = Math.floor(active().findIndex((r) => relationKey(r) === selected) / pageSize());
    edits = [];
    receipts = [{ kind: 'reset' }];
    guide = 'find';
    search.value = '';
    type.value = 'all';
    filterDirectory();
    render();
    announce(`Sample restored. All ${relationships.length} connections are visible.`);
  }
  function renderGraph(nearby: Relationship[]) {
    graph.replaceChildren();
    const size = pageSize();
    const totalPages = Math.max(1, Math.ceil(nearby.length / size));
    page = Math.max(0, Math.min(page, totalPages - 1));
    const visible = nearby.slice(page * size, (page + 1) * size);
    const mobile = compact.matches;
    const width = mobile ? 360 : 800;
    const height = mobile ? 460 : 510;
    const center = mobile ? { x: 92, y: 24, w: 176, h: 76 } : { x: 309, y: 216, w: 182, h: 78 };
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('ml-graph-lines');
    const defs = document.createElementNS(SVG_NS, 'defs');
    const marker = document.createElementNS(SVG_NS, 'marker');
    marker.setAttribute('id', 'ml-arrow');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '6');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('orient', 'auto-start-reverse');
    const arrow = document.createElementNS(SVG_NS, 'path');
    arrow.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    arrow.setAttribute('fill', '#748a70');
    marker.append(arrow);
    defs.append(marker);
    svg.append(defs);
    graph.append(svg);
    function place(element: HTMLElement, box: { x: number; y: number; w: number; h: number }) {
      element.style.left = `${box.x / width * 100}%`;
      element.style.top = `${box.y / height * 100}%`;
      element.style.width = `${box.w / width * 100}%`;
      element.style.height = `${box.h / height * 100}%`;
      graph.append(element);
    }
    visible.forEach((relation, index) => {
      const key = relationKey(relation);
      const outward = relation.subject === focus;
      const label = outward ? relation.object : relation.subject;
      const node = entities.find((entity) => entity.label === label)!;
      const right = index >= 4;
      const box = mobile ? { x: index % 2 === 0 ? 14 : 192, y: 184 + Math.floor(index / 2) * 154, w: 154, h: 80 } : { x: right ? 565 : 23, y: 43 + (index % 4) * 111, w: 212, h: 76 };
      const a = mobile ? { x: center.x + center.w / 2, y: center.y + center.h + 3 } : { x: right ? center.x + center.w + 3 : center.x - 3, y: center.y + center.h / 2 };
      const b = mobile ? { x: index % 2 === 0 ? box.x + box.w + 5 : box.x - 5, y: box.y + box.h / 2 } : { x: right ? box.x - 5 : box.x + box.w + 5, y: box.y + box.h / 2 };
      const d = mobile ? `M ${a.x} ${a.y} C ${a.x} ${a.y + 45}, ${a.x} ${b.y}, ${b.x} ${b.y}` : `M ${a.x} ${a.y} C ${(a.x + b.x) / 2} ${a.y}, ${(a.x + b.x) / 2} ${b.y}, ${b.x} ${b.y}`;
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', d);
      path.classList.add('ml-edge');
      if (selected === key) path.classList.add('is-selected');
      path.setAttribute(outward ? 'marker-end' : 'marker-start', 'url(#ml-arrow)');
      svg.append(path);
      if (selected === key) {
        const pulse = document.createElementNS(SVG_NS, 'path');
        pulse.setAttribute('d', d);
        pulse.classList.add('ml-edge-pulse');
        if (!outward) pulse.classList.add('is-incoming');
        svg.append(pulse);
      }
      const button = make('button', 'ml-graph-node');
      button.type = 'button';
      button.dataset.graphRelation = key;
      button.setAttribute('aria-label', `Inspect ${formatRelation(relation)}`);
      button.setAttribute('aria-pressed', String(selected === key));
      button.append(make('strong', '', label), make('span', '', typeLabel(node)));
      place(button, box);
    });
    const centerNode = make('div', 'ml-center-node');
    centerNode.append(make('span', '', 'FOCUS'), make('strong', '', focus));
    place(centerNode, center);
    if (!visible.length) {
      const empty = make('p', 'ml-graph-empty', 'This neighborhood is empty in your demo view. Undo or reset to bring its connections back.');
      graph.append(empty);
    }
    get<HTMLButtonElement>('[data-neighborhood-prev]').disabled = page === 0;
    get<HTMLButtonElement>('[data-neighborhood-next]').disabled = page >= totalPages - 1;
    get('[data-neighborhood-count]').textContent = nearby.length ? `Showing ${page * size + 1}–${Math.min((page + 1) * size, nearby.length)} of ${nearby.length} connections` : '0 visible connections';
  }
  function renderConnections(nearby: Relationship[]) {
    list.replaceChildren();
    nearby.forEach((relation) => {
      const button = make('button', 'ml-connection');
      button.type = 'button';
      button.dataset.listRelation = relationKey(relation);
      button.setAttribute('aria-pressed', String(relationKey(relation) === selected));
      button.setAttribute('aria-label', `Inspect ${formatRelation(relation)}`);
      const predicate = make('small', '');
      predicate.append(createIcon('arrow-right'), document.createTextNode(` ${relation.predicate} `), createIcon('arrow-right'));
      button.append(make('span', '', relation.subject), predicate, make('strong', '', relation.object));
      list.append(button);
    });
    get('[data-relation-count]').textContent = String(nearby.length);
    get('[data-connection-empty]').hidden = nearby.length > 0;
  }
  function renderInspector() {
    const relation = current();
    get('[data-subject]').textContent = relation.subject;
    get('[data-predicate]').textContent = relation.predicate;
    get('[data-object]').textContent = relation.object;
    get<HTMLSelectElement>('[data-focus-select]').value = focus;
    get('[data-selection-tuple]').textContent = formatRelation(relation);
    get('[data-meaning]').textContent = `The graph records ${relation.subject} as built with ${relation.object}. This is an extracted historical claim, so its scope belongs to the conversation that produced it.`;
    const excerpt = sourceExcerpts[selected];
    get('[data-source]').hidden = !excerpt;
    get('[data-no-source]').hidden = Boolean(excerpt);
    if (excerpt) {
      get('[data-source-quote]').textContent = `“${excerpt.quote}”`;
      get('[data-source-description]').textContent = excerpt.source;
    }
    const unknown = [relation.subject, relation.object].filter((label) => entities.find((entity) => entity.label === label)?.type === null);
    get('[data-alias-note]').textContent = unknown.length ? `${unknown.join(' and ')} has an unknown entity type in the source sample. Its type is preserved rather than guessed. Similar or versioned labels remain separate.` : 'Names and versions stay exactly as extracted. Similar labels remain separate; this demo does not resolve or merge aliases.';
    const removed = hidden.has(selected);
    get<HTMLButtonElement>('[data-set-aside]').disabled = removed;
    get<HTMLButtonElement>('[data-map-edit]').disabled = removed;
    setIconLabel(get('[data-map-inspect]'), excerpt ? 'Inspect its source' : 'Inspect this connection', 'arrow-up-right');
    get('[data-edit-status]').textContent = removed ? 'Set aside in this demo. The original tuple is preserved in your receipt.' : '';
    root.classList.toggle('ml-has-edit', hidden.size > 0);
  }
  function renderReceipts() {
    get<HTMLButtonElement>('[data-undo]').disabled = edits.length === 0;
    const lastReceipt = receipts.at(-1);
    get('[data-inline-receipt]').hidden = !lastReceipt;
    get<HTMLButtonElement>('[data-inline-undo]').hidden = edits.length === 0;
    get<HTMLButtonElement>('[data-inspector-undo]').hidden = edits.length === 0;
    get('[data-inline-receipt-text]').textContent = !lastReceipt ? '' : lastReceipt.kind === 'aside' ? `Set aside: ${formatRelation(lastReceipt.relation!)}. The original is preserved.` : lastReceipt.kind === 'undo' ? `Restored: ${formatRelation(lastReceipt.relation!)}. Your previous view is back.` : 'Sample restored. All original connections are visible.';
    get('[data-sample-count]').textContent = `${relationships.length - hidden.size} of ${relationships.length} connections visible`;
    const receiptList = get<HTMLOListElement>('[data-receipt-list]');
    receiptList.replaceChildren();
    if (!receipts.length) {
      receiptList.append(make('li', 'ml-receipt-empty', 'No edits yet. Select a connection and try setting it aside.'));
    }
    receipts.slice().reverse().forEach((receipt, index) => {
      const item = make('li', 'ml-receipt-item');
      item.append(make('span', 'ml-receipt-number', String(receipts.length - index).padStart(2, '0')));
      const body = make('div', '');
      body.append(make('strong', '', receipt.kind === 'aside' ? 'Set aside in this demo' : receipt.kind === 'undo' ? 'Restored exact before-state' : 'Reset to the exported sample'));
      if (receipt.relation) body.append(make('p', 'ml-receipt-tuple', formatRelation(receipt.relation)));
      body.append(make('p', 'ml-receipt-reason', receipt.kind === 'aside' ? 'Reason: visitor practice. This action makes no judgment about the source claim.' : receipt.kind === 'undo' ? 'The stored tuple, previous focus, selection, filters and neighborhood page were restored.' : 'All 31 labels and 33 connections restored. Search and filters cleared.'));
      item.append(body);
      receiptList.append(item);
    });
  }
  function renderGuide() {
    get<HTMLButtonElement>('[data-guide="edit"]').disabled = hidden.has(selected);
    root.querySelectorAll<HTMLButtonElement>('[data-guide]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.guide === guide)));
    get('[data-guide-note]').textContent = guide === 'find' ? 'Start with panelforge. The lines show extracted build relationships. Choose a connected label or a connection in the list to inspect it.' : guide === 'inspect' ? 'Read the subject, predicate and object in the inspector. Checked excerpts are published for selected connections. The conversation gives each claim its scope.' : hidden.size ? 'A real connection is now set aside in your local view. Its tuple remains in the receipt. Choose Undo last edit to restore the exact previous state.' : 'Choose a connection, then set it aside in this demo. The receipt will preserve its tuple and let you restore the exact previous state.';
  }
  function render() {
    const entity = entities.find((item) => item.label === focus)!;
    get('[data-focus-title]').textContent = focus;
    get('[data-focus-meta]').textContent = `${typeLabel(entity)} · extracted historical relationships`;
    root.querySelectorAll<HTMLButtonElement>('[data-entity]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.entity === focus)));
    const nearby = active();
    renderGraph(nearby);
    renderConnections(nearby);
    renderInspector();
    renderReceipts();
    renderGuide();
  }

  root.addEventListener('click', (event) => {
    const target = (event.target as Element).closest<HTMLButtonElement>('button');
    if (!target) return;
    if (target.dataset.entity) focusEntity(target.dataset.entity);
    const key = target.dataset.graphRelation ?? target.dataset.listRelation;
    if (key) {
      const fromGraph = target.hasAttribute('data-graph-relation');
      selectRelation(relationships.find((r) => relationKey(r) === key)!);
      const selector = fromGraph ? '[data-graph-relation]' : '[data-list-relation]';
      Array.from(root.querySelectorAll<HTMLButtonElement>(selector)).find((button) => (button.dataset.graphRelation ?? button.dataset.listRelation) === key)?.focus({ preventScroll: true });
      revealSelection();
    }
    if (target.hasAttribute('data-set-aside')) { setAside(); get('[data-inspector-undo]').focus({ preventScroll: true }); }
    if (target.hasAttribute('data-undo')) undo();
    if (target.hasAttribute('data-map-edit')) { setAside(); get('[data-inline-undo]').focus({ preventScroll: true }); revealSelection(); }
    if (target.hasAttribute('data-inline-undo')) { undo(); get('[data-map-edit]').focus({ preventScroll: true }); revealSelection(); }
    if (target.hasAttribute('data-inspector-undo')) { undo(); get('[data-set-aside]').focus({ preventScroll: true }); }
    if (target.hasAttribute('data-map-inspect')) inspectSelection();
    if (target.hasAttribute('data-return-map')) { get('[data-map-inspect]').focus({ preventScroll: true }); get('[data-selection-summary]').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    if (target.hasAttribute('data-reset')) reset();
    if (target.hasAttribute('data-clear-filter')) { search.value = ''; type.value = 'all'; filterDirectory(); }
    if (target.hasAttribute('data-neighborhood-prev')) { page -= 1; render(); }
    if (target.hasAttribute('data-neighborhood-next')) { page += 1; render(); }
    if (target.dataset.guide) {
      const nextGuide = target.dataset.guide as Guide;
      if (nextGuide === 'find' || nextGuide === 'inspect') {
        guide = nextGuide;
        renderGuide();
        if (guide === 'inspect') {
          inspectSelection();
        } else {
          graph.scrollIntoView({ behavior: 'smooth', block: 'center' });
          announce(`Explore ${focus} and its extracted connections.`);
        }
      } else {
        setAside();
        renderGuide();
        get('[data-selection-summary]').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });
  search.addEventListener('input', filterDirectory);
  type.addEventListener('change', filterDirectory);
  get<HTMLSelectElement>('[data-focus-select]').addEventListener('change', (event) => focusEntity((event.target as HTMLSelectElement).value));
  compact.addEventListener('change', () => {
    connectionDetails.open = !compact.matches;
    const index = active().findIndex((r) => relationKey(r) === selected);
    page = index >= 0 ? Math.floor(index / pageSize()) : 0;
    render();
  });
  filterDirectory();
  render();
  root.dataset.ready = 'true';
}
