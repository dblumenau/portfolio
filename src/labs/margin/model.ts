import execution from './execution.json';
export { execution };
export type RecordedEvent = typeof execution.scenarios[number]['events'][number];
export type RecordedScenario = typeof execution.scenarios[number];
export const cases = [
  { id: 'brief-pause', label: 'A brief thought', intro: 'A short passage and a pause. Is there enough new work to justify a review?', takeaway: 'A pause alone is not a reason to interrupt.', start: 0 },
  { id: 'pause-review', label: 'A substantial pause', intro: 'A longer passage, then the pen stops. Step through the pause and the separate permission to show a note.', takeaway: 'Enough new writing earns a review. Showing feedback has its own check.', start: 0 },
  { id: 'deadline', label: 'A long stretch', intro: 'The writing has accumulated for 150 active seconds. A small settling pause gives the review a quieter opening.', takeaway: 'New strokes add to the writing time. A small pause can release the waiting review.', start: 0 },
  { id: 'hold-feedback', label: 'Feedback while writing', intro: 'A review was permitted. Its fictional response becomes ready just as the person starts writing again.', takeaway: 'Ready feedback can wait for the person.', start: 1 },
  { id: 'failure', label: 'A failed review', intro: 'A review fails. The writing stays available for the next check, and repeated failures leave more time between attempts.', takeaway: 'Keep the work. Leave space before trying again.', start: 1 },
  { id: 'unchanged', label: 'An untouched page', intro: 'Check the same unchanged page five times, up to an hour later.', takeaway: 'Elapsed time does not turn an unchanged page into new work.', start: 0 },
  { id: 'hard-deadline', label: 'Writing without a pause', intro: 'The person keeps writing past the usual settling window. Accumulated work eventually reaches the hard deadline.', takeaway: 'Continuous writing cannot postpone the review indefinitely.', start: 0 },
  { id: 'cooldown', label: 'Room in the margin', intro: 'Compare a recent note, a longer wait, and one versus two notes already visible.', takeaway: 'Unsolicited notes respect time and available space.', start: 2 },
  { id: 'coalescing', label: 'Writing during a request', intro: 'New work accumulates while a request is in flight. Afterward it still observes the spacing between calls.', takeaway: 'New work stays available for the next check.', start: 1 },
] as const;
export const scenarioFor = (id: string): RecordedScenario => execution.scenarios.find(s => s.id === id) ?? execution.scenarios.find(s => s.id === cases[0].id)!;
export const checksFor = (scenario: RecordedScenario) => scenario.events.map((event, index) => ({ event, index })).filter(({ event }) => event.action === 'decide' || event.action === 'present');
export const seconds = (value: number | null) => value === null ? 'No pen event' : `${Number(value.toFixed(2))} s`;
export const decisionLabel = (event: RecordedEvent) => ({ review: 'Review permitted', present: 'Note permitted', hold: 'Hold the note', unchanged: 'No new work', wait: 'Wait before reviewing' }[event.result] ?? event.result);
export function explanation(event: RecordedEvent) {
  if (event.result === 'review') return event.reason.startsWith('hard deadline') ? 'The accumulated writing has reached the hard deadline, even without a pause.' : event.reason.startsWith('deadline') ? 'The accumulated writing has reached the deadline and the pen has settled.' : 'There is enough new work, and the pause is long enough to review it.';
  if (event.result === 'present') return 'The presentation policy permits a note at this check. Permission is separate from the review decision.';
  if (event.result === 'unchanged') return 'The page has no unreviewed changes. This automatic check has nothing new to review.';
  if (event.reason === 'user writing') return 'Feedback is ready, but the person is still writing. Keep the note out of their way.';
  if (event.reason.startsWith('cooldown')) return 'A note was recently shown. The policy holds another note until the cooldown has passed.';
  if (event.reason.includes('already visible')) return 'Two unsolicited notes are already visible. The margin has reached its configured limit.';
  if (event.reason.includes('backing off')) return `The failed review kept its writing available. Another attempt waits through a ${event.consecutiveFailures === 1 ? '30' : '60'}-second backoff.`;
  if (event.reason.includes('in flight')) return 'An existing request is still in flight. New writing is kept for a later check.';
  if (event.reason === 'call spacing') return 'The previous request began too recently. Keep the new work and leave space between calls.';
  if (event.reason.includes('only')) return 'The pen has paused, but this brief passage has too little new work for an automatic review.';
  if (event.reason === 'short pause') return 'The pause is still short. Let the person finish their thought.';
  if (event.reason.includes('settle')) return 'Enough writing has accumulated, but the pen has not settled yet.';
  return 'The pen is still active. Give the person room to keep writing.';
}
export function reviewAt(scenario: RecordedScenario, eventIndex: number) {
  return scenario.events.slice(0, eventIndex + 1).filter(e => e.action === 'decide').at(-1);
}
export function noteAt(scenario: RecordedScenario, eventIndex: number) {
  return scenario.events.slice(0, eventIndex + 1).filter(e => e.action === 'present').at(-1);
}
export function eventLabel(event: RecordedEvent) {
  if (event.action === 'decide' || event.action === 'present') return decisionLabel(event);
  return ({ 'write-range': 'Synthetic writing', write: 'Synthetic stroke event', begin: 'Request state begins', succeeded: 'Fictional response ready', failed: 'Supplied request failure', shown: 'Supplied note shown' } as Record<string, string>)[event.action] ?? event.action;
}
