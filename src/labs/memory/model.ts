import sample from './sample.json';

export type Entity = { label: string; type: string | null };
export type Relationship = { subject: string; predicate: string; object: string };
export const entities: Entity[] = sample.nodes;
export const relationships: Relationship[] = sample.relationships;
export const relationKey = (relation: Relationship) => JSON.stringify([relation.subject, relation.predicate, relation.object]);
export const typeLabel = (entity: Entity) => entity.type ?? 'unknown';
export const formatRelation = (relation: Relationship) => `${relation.subject} → ${relation.predicate} → ${relation.object}`;
export const sourceExcerpts: Record<string, { quote: string; source: string }> = {
  [relationKey({ subject: 'panelforge', predicate: 'built_with', object: 'laravel' })]: {
    quote: "I'll search the panel-forge Laravel codebase for these specific details.",
    source: 'Assistant wording in a discussion of live prompt modes and costing.',
  },
  [relationKey({ subject: 'panelforge', predicate: 'built_with', object: 'vue' })]: {
    quote: 'Explore the panel-forge Laravel+Vue codebase',
    source: 'User wording in a discussion of live prompt modes and costing.',
  },
  [relationKey({ subject: 'panelforge', predicate: 'built_with', object: 'inertia-js' })]: {
    quote: 'Laravel + Vue 3 + Inertia.js app',
    source: 'User wording in a discussion of iOS safe areas and modal controls.',
  },
  [relationKey({ subject: 'panelforge', predicate: 'built_with', object: 'express' })]: {
    quote: 'Express client for OpenAI requests',
    source: 'Assistant wording in a discussion of a model upgrade and response verbosity.',
  },
};
