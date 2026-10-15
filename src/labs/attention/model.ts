import receipt from './execution.json';

export const execution = receipt;
export const returnedAnswer = receipt.actual_tool_result;
export const artifact = receipt.artifacts['workshop-source.txt'];

export const chapters = [
  { time: 0, label: 'The waiting task', description: 'The original Codex terminal task is waiting on Attention MCP.' },
  { time: 7, label: 'The native choice', description: 'Intel Computer Helper selects Session cards and submits the actual native card.' },
  { time: 14, label: 'The same call returns', description: 'Attention returns the selected option to the original waiting call. Codex acknowledges it.' },
  { time: 28, label: 'The file is built', description: 'The same terminal task writes and validates the chosen workshop page.' },
  { time: 35, label: 'The actual page', description: 'A still browser render shows the real generated page for six seconds.' },
  { time: 41, label: 'The updated Mac app', description: 'A separate five-second recording shows the same answered card after the Mac app update.' },
] as const;

export const workflow = [
  { title: 'Codex reaches a decision.', copy: 'The terminal has prepared two layouts for a fictional Lantern Makers workshop. Before creating the final page, it calls Attention MCP’s ask_user and waits.' },
  { title: 'The question reaches the Mac.', copy: 'The native app presents Schedule first and Session cards. Intel Computer Helper selects Session cards and sends the answer in that actual card.' },
  { title: 'The original call returns.', copy: 'The selected option returns to the waiting terminal task. Its output shows attention/ask_user (completed), then acknowledges Session cards.' },
  { title: 'The choice becomes a page.', copy: 'That same task creates index.html from the prepared Session cards reference, updates the badge and footer, and verifies all three sessions.' },
] as const;
