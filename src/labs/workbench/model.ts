import receipt from './receipt.json';
export { receipt };
export const phases = [
  { name: 'Pack the useful parts', title: 'Two desks. One useful setup.', copy: 'What should travel together, and what should each desk keep? Make two choices, then compare them with a real run.', action: 'Compare with the real run', steps: [0, 1] },
  { name: 'Assemble', title: 'Same tools. Different working habits.', copy: 'Both fictional desks received the portable base. Each kept its own status line. The shared skill became readable from both homes.', action: 'Introduce a deliberate mistake', steps: [0, 1] },
  { name: 'Refuse drift', title: 'A useful refusal.', copy: 'Desk A’s live reasoning setting was manually changed to high. Apply refused to overwrite it: exit 1. The live file and generated snapshot both kept their exact hashes.', action: 'Explicitly adopt the change', steps: [2] },
  { name: 'Adopt', title: 'Give the change somewhere to live.', copy: 'Explicit adoption put high reasoning into Desk A’s local overlay. The manager could now regenerate its configuration without losing that choice.', action: 'Update the portable base', steps: [3] },
  { name: 'Update', title: 'The update arrives. The preference stays.', copy: 'The next fictional base changed the model and default reasoning. Both desks got demo-model-v2. Desk A kept its adopted high setting; Desk B followed the new low default.', action: 'Check the private files', steps: [4, 5] },
  { name: 'Verify', title: 'Carry your tools. Keep your own desk.', copy: 'Both doctor checks passed. The same shared skill was available at both desks. The fake auth, session and secret-overlay files retained their exact SHA-256 hashes.', action: 'Start again', steps: [6, 7] },
];
export type Choices = { skill: string; preference: string };
export function parseState(search: string) {
  const params = new URLSearchParams(search);
  const phase = Number(params.get('step') ?? 0);
  return { phase: Number.isInteger(phase) && phase >= 0 && phase < phases.length ? phase : 0, choices: { skill: params.get('skill') === 'local' ? 'local' : params.get('skill') === 'shared' ? 'shared' : '', preference: params.get('preference') === 'shared' ? 'shared' : params.get('preference') === 'local' ? 'local' : '' } };
}
