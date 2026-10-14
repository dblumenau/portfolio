import milestones from './milestones.json';
import summary from './summary.json';
import type { Milestone, TagRecord } from './model';

export const releaseMilestones: readonly Milestone[] = milestones;
export const releaseCoverage = summary;
export const findReleaseMilestone = (id: string): Milestone | undefined => milestones.find(story => story.id === id);
export const loadReleaseTags = async (): Promise<readonly TagRecord[]> => (await import('./inventory.json')).default;
