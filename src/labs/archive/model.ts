import execution from './execution.json';
export { execution };
export const stages = [
  { label: '1. Initial index', key: 'initial', title: 'Built from the manifests', file: 'Present', assets: '3', resources: '6', integrity: 'ok', note: 'Three asset rows and six resource rows: one original PNG and one retained metadata JSON for each asset.', command: '08-initial-index' },
  { label: '2. Index removed', key: 'removed', title: 'The disposable file is absent', file: 'Absent', assets: '—', resources: '—', integrity: '—', note: 'Only the explicitly named state/archive.sqlite was removed. All 13 canonical files stayed in place.', command: '' },
  { label: '3. Rebuilt', key: 'rebuilt', title: 'Reconstructed from the same manifests', file: 'Present', assets: '3', resources: '6', integrity: 'ok', note: 'The rebuilt database has identical asset, resource and identity rows. SQLite integrity returned ok again.', command: '09-rebuilt-index' },
] as const;
export function commandOutput(id: string) {
  const command = execution.commands.find(item => item.id === id);
  if (!command) return '';
  return `$ ${command.command}\n${command.stdout.trim()}`;
}
