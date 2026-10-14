export type ReleaseKind = 'major' | 'minor' | 'patch' | 'commit' | 'other';
export interface TagRecord { project: string; tag: string; date: string; timestamp: string; kind: string; commit: string; }
export interface Milestone { id: string; project: string; tag: string | null; date: string; timestamp: string; kind: string; commit: string; title: string; problem: string; change: string; next: string; area: string; href: string; evidence: string; }
export interface ReleaseFilters { project: string; kind: string; query: string; from: string; to: string; }
export const periods = [
  { id: 'all', label: 'The whole journey', from: '2025-05-01', to: '2026-10-31', caption: 'From the first revision loop to a connected workbench.' },
  { id: 'origins', label: '2025 · The creative loop', from: '2025-05-01', to: '2025-12-31', caption: 'Making, organising and revising results in one place.' },
  { id: 'connections', label: 'Jan–Jun 2026 · Connect the pieces', from: '2026-01-01', to: '2026-06-30', caption: 'Engines, tools and a shared browser surface.' },
  { id: 'refinements', label: 'Jul–Oct 2026 · Make it usable', from: '2026-07-01', to: '2026-10-31', caption: 'Recovery, grounded memory and a portable workbench.' },
  { id: 'october', label: 'October 2026 · The small details', from: '2026-10-01', to: '2026-10-31', caption: 'A quiet turn, a useful preview, a transcript with room to breathe.' },
] as const;
export const areas = [
  { id: 'studio', label: 'Creative workspace', note: 'Make → organise → revise' },
  { id: 'engines', label: 'Connected agents', note: 'Run → interrupt → recover' },
  { id: 'connections', label: 'Shared tools', note: 'Discover → connect → constrain' },
  { id: 'memory', label: 'Memory & history', note: 'Find → ground → understand' },
  { id: 'workbench', label: 'Portable workbench', note: 'Repeat → share → review' },
  { id: 'small', label: 'Small useful things', note: 'One problem, a useful tool' },
];
export function matches(record: TagRecord | Milestone, filter: ReleaseFilters, label = ''): boolean {
  if (filter.from && filter.to && filter.from > filter.to) return false;
  if (filter.project && record.project !== filter.project) return false;
  if (filter.kind && record.kind !== filter.kind) return false;
  if (filter.from && record.date < filter.from) return false;
  if (filter.to && record.date > filter.to) return false;
  const story = 'title' in record ? `${record.title} ${record.problem} ${record.change} ${record.next}` : '';
  const haystack = `${label} ${record.project} ${record.tag ?? ''} ${record.commit} ${story}`.toLocaleLowerCase();
  return filter.query.trim().toLocaleLowerCase().split(/\s+/).every(word => haystack.includes(word));
}
export function position(date: string, from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`), end = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 50;
  return Math.max(0, Math.min(100, 100 * (Date.parse(`${date}T00:00:00Z`) - start) / (end - start)));
}
export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}
export const pageSize = 30;
