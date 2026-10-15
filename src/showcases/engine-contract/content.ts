import receipt from '../../../public/media/engine-contract/receipt.json';

const stories = [
  {
    id: 'claude', name: 'Claude', upstream: 'SDK messages',
    title: 'A stream and its final snapshot.',
    description: 'The SDK sends a text delta, then a complete assistant message. The adapter keeps the readable text from appearing twice.',
    focusTitle: 'One sentence, once.',
    focus: 'The saved SDK delta carries “Checking the fixture.” The next assistant message includes that same sentence and a tool call. The adapter emits the tool call without repeating the sentence.',
    incoming: ['Text delta', 'Assistant message + tool block', 'User message + result block', 'Terminal result message'],
    focusRows: [
      { input: 'Text delta: Checking the fixture.', output: 'text · Checking the fixture.' },
      { input: 'Full message: same text + tool block', output: 'tool_use · Bash (no repeated text)' },
    ],
    boundary: 'Claude source proof uses real SDK message classes with mocked SDK transport and the source’s unit-harness branch. It checks translation inside invocation; it does not run the lifetime dispatcher or CLI.',
  },
  {
    id: 'codex', name: 'Codex', upstream: 'JSON-RPC notifications',
    title: 'Several notifications. One tool result.',
    description: 'Text, tool starts and tool completion arrive as separate notifications. The adapter gathers them into events a chat can show.',
    focusTitle: 'Wait for the complete result.',
    focus: 'Two command-output chunks arrive before completion. They produce no chat event yet. When the command completes, the adapter combines the saved chunks into one tool result.',
    incoming: ['Agent-message delta', 'Command item started', 'Output chunks + item completed', 'Turn completed'],
    focusRows: [
      { input: 'Output chunk: “fixture-”', output: 'No event yet · buffered' },
      { input: 'Output chunk: “ok\\n”', output: 'No event yet · buffered' },
      { input: 'Command item completed', output: 'tool_result · “fixture-ok\\n”' },
    ],
    boundary: 'Recorded by calling the unchanged JSON-RPC notification translator directly. No app-server, command or HTTP stream was run.',
  },
  {
    id: 'opencode', name: 'OpenCode', upstream: 'Message and part events',
    title: 'Keep the answer. Skip the echo.',
    description: 'OpenCode sends message parts as accumulated snapshots. The adapter remembers each part and emits only the new text.',
    focusTitle: 'A repeated part adds nothing.',
    focus: 'The final text part grows from “Fixture ” to “Fixture complete.” A later copy contains no new text, so the adapter emits nothing. The user’s prompt echo is also kept out of the reply.',
    incoming: ['Assistant text part', 'Tool part: running', 'Tool part: completed', 'Session idle'],
    focusRows: [
      { input: 'Part: “Fixture ”', output: 'text · “Fixture ”' },
      { input: 'Same part: “Fixture complete.”', output: 'text · “complete.”' },
      { input: 'Same part sent again', output: 'No event · nothing added' },
    ],
    boundary: 'Recorded by calling the unchanged message-part translator directly. No event-bus connection, OpenCode server or HTTP stream was run.',
  },
] as const;

export const examples = stories.map(story => {
  const evidence = receipt.engines.find(engine => engine.id === story.id)!;
  const event = (type: string) => evidence.events.find(item => item.type === type)!;
  const use = event('tool_use');
  return {
    ...story, evidence,
    steps: [
      { kind: 'text', title: 'A readable reply', value: String(event('text').content), input: story.incoming[0] },
      { kind: 'tool_use', title: `${use.name} starts`, value: String(use.input?.command), input: story.incoming[1] },
      { kind: 'tool_result', title: 'The tool returns', value: String(event('tool_result').content), input: story.incoming[2] },
      { kind: 'done', title: 'The turn finishes', value: String(event('done').result), input: story.incoming[3] },
    ],
  };
});
export { receipt };
