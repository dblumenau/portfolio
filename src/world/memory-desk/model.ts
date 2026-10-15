import sample from '../../labs/memory/sample.json';
import { entities, relationships, relationKey, sourceExcerpts, type Relationship } from '../../labs/memory/model';

export const candidateLabels = ['vue', 'vue-js', 'vue-3'] as const;
export type Candidate = typeof candidateLabels[number];
export const query = { subject: 'panelforge', predicate: 'built_with', candidateLabels: [...candidateLabels] };
export const missingExcerpt = 'No excerpt is published for this connection in this sample.';
export const conclusion = 'Similar names. Different records. This sample does not establish that they are interchangeable.';
export type DeskRecord = { tuple: Relationship; originalType: string | null; excerpt: { quote: string; attribution: string } | null };
export function findRecords(rows: readonly Relationship[] = relationships): DeskRecord[] {
  return rows.filter(row => row.subject === query.subject && row.predicate === query.predicate && candidateLabels.includes(row.object as Candidate)).map(row => {
    const excerpt = sourceExcerpts[relationKey(row)];
    return { tuple: { subject: row.subject, predicate: row.predicate, object: row.object }, originalType: entities.find(entity => entity.label === row.object)?.type ?? null, excerpt: excerpt ? { quote: excerpt.quote, attribution: excerpt.source } : null };
  }).sort((a, b) => candidateLabels.indexOf(a.tuple.object as Candidate) - candidateLabels.indexOf(b.tuple.object as Candidate));
}
export type DeskState = { records: DeskRecord[]; inspected: Candidate | null; opened: Set<Candidate>; selected: Set<Candidate>; assembled: boolean };
export const initialState = (): DeskState => ({ records: [], inspected: null, opened: new Set(), selected: new Set(), assembled: false });
export function inspect(state: DeskState, label: Candidate) {
  if (!state.records.some(record => record.tuple.object === label)) return;
  state.inspected = label; state.opened.add(label);
}
export function memoryLabel(hash: string): Candidate | null {
  const label = /^#memory-desk\/(vue|vue-js|vue-3)$/.exec(hash)?.[1];
  return label ? label as Candidate : null;
}
export function evidenceJSON(state: DeskState): string {
  return JSON.stringify({ schemaVersion: 1, kind: 'local-selection-from-historical-sample', sample: { title: sample.title, capturedDate: sample.capturedDate }, query: { subject: query.subject, predicate: query.predicate, candidateLabels: [...candidateLabels] }, records: state.records.filter(record => state.selected.has(record.tuple.object as Candidate)).map(record => ({ tuple: { subject: record.tuple.subject, predicate: record.tuple.predicate, object: record.tuple.object }, originalType: record.originalType, excerpt: record.excerpt ? { quote: record.excerpt.quote, attribution: record.excerpt.attribution } : null, openedByVisitor: state.opened.has(record.tuple.object as Candidate) })), aliasEquivalence: 'not-established-by-this-sample', scopeNotes: [sample.description, `Sample captured ${sample.capturedDate}; this dates the sample, not each claim or source conversation.`, `${sample.counts.distinctRelationships} distinct relationships, deduplicated from ${sample.counts.originalFilteredRowCount} filtered historical rows.`, 'The three exact labels are an editorially chosen comparison, not semantic search results.', 'A missing public excerpt does not establish that a connection has no source or is false.', 'Local visitor selection; no model, private archive or live graph was queried.'] }, null, 2) + '\n';
}
