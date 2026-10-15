import { execution, chapters, artifact } from '../../labs/attention/model';
export { execution, artifact, chapters };
export const answer = execution.chosen_layout;
export const presentation = {
  waiting: { title: 'One task, waiting.', description: 'The task has asked which layout to build. Its ticket stays at the terminal while the question reaches the Mac.', action: 'Reveal the recorded choice', chapter: chapters[0], ticket: 'Waiting for the native answer' },
  chosen: { title: 'The Mac has an answer.', description: 'Automated Computer Use selected the recorded option. Carry its answer slip to the original waiting call.', action: 'Carry the answer back', chapter: chapters[1], ticket: 'Waiting for the native answer' },
  returned: { title: 'Back to the same task.', description: 'The answer is beside the same ticket. The original waiting call has returned; that work can now build its page.', action: 'Unfold the built page', chapter: chapters[2], ticket: `Recorded answer returned: ${answer}` },
  built: { title: 'The choice became a page.', description: `The same task built the selected ${answer} layout with ${execution.actual_file.sessions} sessions. Open the actual result or download its original HTML.`, action: 'Inspect the actual page', chapter: chapters[4], ticket: 'Completed · same task' },
} as const;
