import summary from './summary.json';
import { periods, type ReleaseFilters } from './model';

export interface ReleaseView extends ReleaseFilters { period: string; }
const keys = ['period', 'project', 'kind', 'query', 'from', 'to'] as const;
const kinds = new Set(['major', 'minor', 'patch', 'commit', 'other']);
const projects = new Set(summary.projects.map(project => project.id));
const first = periods[0];

function dateValue(value: string | null, fallback: string, invalidFallback: string): string {
  if (value === null) return fallback;
  if (!value) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '2025-01-01' || value > '2026-10-31') return invalidFallback;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : invalidFallback;
}

export function readReleaseView(url: URL): ReleaseView {
  const params = url.searchParams;
  const requested = params.get('period');
  const period = periods.find(period => period.id === requested) ?? first;
  const custom = requested === 'custom' || params.has('from') || params.has('to');
  const project = params.get('project') ?? '';
  const kind = params.get('kind') ?? '';
  return {
    period: custom ? 'custom' : period.id,
    project: projects.has(project) ? project : '',
    kind: kinds.has(kind) ? kind : '',
    query: params.get('query') ?? '',
    from: dateValue(params.get('from'), custom && requested === 'custom' ? '' : period.from, period.from),
    to: dateValue(params.get('to'), custom && requested === 'custom' ? '' : period.to, period.to),
  };
}

export function isFilteredView(view: ReleaseView): boolean {
  return view.period !== first.id || Boolean(view.project || view.kind || view.query) || view.from !== first.from || view.to !== first.to;
}

export function releaseViewUrl(current: URL, view: ReleaseView, milestone?: string): URL {
  const url = new URL(current);
  for (const key of keys) url.searchParams.delete(key);
  if (view.period !== first.id) url.searchParams.set('period', view.period);
  for (const key of ['project', 'kind', 'query'] as const) if (view[key]) url.searchParams.set(key, view[key]);
  if (view.period === 'custom') {
    if (view.from) url.searchParams.set('from', view.from);
    if (view.to) url.searchParams.set('to', view.to);
  }
  if (milestone) url.hash = `milestone-${milestone}`;
  else if (url.hash.startsWith('#milestone-')) url.hash = '';
  return url;
}
