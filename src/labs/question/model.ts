import receipt from './execution.json';

export const execution = receipt;
export const question = receipt.question.questions[0];
export const choice = receipt.ui_selection.Priority;
export const finalSteps = receipt.final_text.split('\n').filter(line => /^\d+\./.test(line)).map(line => line.replace(/^\d+\.\s*/, ''));
export const stages = [
  { label: 'Task', title: 'A choice before the plan.', copy: 'The fictional workshop needs a check-in. The task asks Claude to pause for a direction before drafting.', time: 0.433008, action: 'Show the recorded question', status: 'One original task. The answer has not been chosen.' },
  { label: 'Question', title: 'The model asks. The turn waits.', copy: 'Claude calls its built-in question tool. The native card shows two choices while the original invocation remains open.', time: 4.8, action: 'Replay Quick setup', status: 'Recorded question at +2.075 seconds. Same invocation, waiting for an answer.' },
  { label: 'Answer', title: 'Quick setup reaches the question.', copy: 'The automated participant selects Quick setup and sends the native answer. The original pending question receives it.', time: 11, action: 'See the confirmed result', status: 'Native answer at +10.727 seconds. Matching request and stream verified.' },
  { label: 'Result', title: 'The same task keeps going.', copy: 'The actual tool result confirms Quick setup. That same invocation resumes and drafts the short plan below.', time: 18, action: 'Replay from the beginning', status: 'Completed at +12.551 seconds. One invocation; 25 text events followed the answer.' },
] as const;

export const captures = [
  { name: 'question', label: 'The actual question', focus: 'question', alt: 'Actual iPhone Simulator native chat card asking whether to prioritize Quick setup or More customization', copy: 'The original invocation pauses with a real built-in question.' },
  { name: 'selected', label: 'The recorded choice', focus: 'selected', alt: 'Actual native card with Quick setup checked and Send answers enabled', copy: 'The automated participant selects Quick setup. Only this choice was recorded.' },
  { name: 'completed', label: 'The same invocation’s plan', focus: 'completed', alt: 'Actual native chat final response beginning Chosen direction: Quick setup with three practical steps', copy: 'The final text names the answer and keeps the plan short.' },
] as const;
