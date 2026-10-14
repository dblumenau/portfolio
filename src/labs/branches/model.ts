import execution from './execution.json';
export { execution };
export type BranchName = 'balanced' | 'bold' | 'quiet';
export const branchNames: BranchName[] = ['balanced', 'bold', 'quiet'];
export const branchLabels: Record<BranchName, string> = { balanced: 'Balanced', bold: 'Bold', quiet: 'Quiet' };
export const phases = [
  { label: 'Reference', title: 'Start with something worth keeping.', copy: 'This poster was exported from the Studio Lab. Follow the same image into a conversation.', action: 'Replay the image handoff', status: 'A reference in the gallery. The conversation is still ahead.' },
  { label: 'Beginning', title: 'One reference. A shared beginning.', copy: 'The image is attached. An opening exchange sets the structure to preserve, then the original brief asks for a balanced title.', action: 'Replay the bold edit', status: 'The original direction contains four messages and keeps the poster as its input image.' },
  { label: 'Bold', title: 'Make a revision. Keep the original.', copy: 'Editing the later brief creates a bold direction. The first two messages and their image association travel with it.', action: 'Replay the quiet edit', status: 'Two directions remain available. The original four message rows have not changed.' },
  { label: 'Quiet', title: 'A third direction. The same starting point.', copy: 'A second edit asks for smaller type and more space. It creates another sibling, while balanced and bold remain available.', action: 'Compare the revisions', status: 'Three directions now share the same opening exchange and input image.' },
  { label: 'Compare', title: 'See where the briefs diverge.', copy: 'The shared beginning stays above. Compare the two new requests and their seeded answers below.', action: 'Replay the quiet preference', status: 'Both revisions remain separate. Comparing them does not replace either conversation.' },
  { label: 'Prefer', title: 'Choose a direction. Keep the possibilities.', copy: 'The recorded preference selects Quiet. The original and bold alternatives remain connected and available.', action: 'Replay from the beginning', status: 'Quiet is preferred. All three conversations and the reference are retained.' },
];
export function branchRecord(name: BranchName) { const id = name === 'balanced' ? execution.observations.rootId : name === 'bold' ? execution.observations.boldId : execution.observations.quietId; return execution.branches.find(branch => branch.id === id)!; }
export const answerText = (content: string) => content.replace(/^Fixture answer: /, '');
