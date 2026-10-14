import execution from './execution.json';
export { execution };
export type Lane = 'scout' | 'host';
export const lanes = {
  scout: { title: 'Find a soundtrack', user: '101', other: '202', resource: 'soundtrack-scout', catalog: 'scout-catalog', copy: 'Research a few tracks without changing the room’s music.', actions: [{ key: 'scout-search', label: 'Find tracks', tool: 'search' }, { key: 'scout-queue-denied', label: 'Try adding a track', tool: 'queue_specific_song' }] },
  host: { title: 'Prepare the room queue', user: '202', other: '101', resource: 'room-host', catalog: 'host-catalog', copy: 'Build a queue. Leave the venue’s volume to its operator.', actions: [{ key: 'host-queue', label: 'Add a track to the queue', tool: 'queue_specific_song' }, { key: 'host-volume-policy-denied', label: 'Try changing the volume', tool: 'set_volume' }] },
} as const;
export function recordFor(key: string) { const found = execution.records.find(record => record.key === key); if (!found) throw new Error(`No observed gateway record: ${key}`); return found; }
export function toolNames(key: string): string[] { const result = recordFor(key).response.body as { result?: { tools?: { name: string }[] } }; return result.result?.tools?.map(tool => tool.name) ?? []; }
export function requestState(search: string): { lane: Lane; action: string | null } {
  const params = new URLSearchParams(search);
  const lane = params.get('task') === 'host' ? 'host' : 'scout';
  const action = params.get('attempt');
  return { lane, action: lanes[lane].actions.some(item => item.key === action) ? action : null };
}
