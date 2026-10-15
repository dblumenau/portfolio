export type DistrictId = 'studio' | 'engines' | 'connections' | 'memory' | 'workbench' | 'small-tools';

export interface WorldExhibit {
  title: string;
  description: string;
  href?: string;
}

export interface WorldDistrict {
  id: DistrictId;
  number: string;
  name: string;
  label: string;
  color: string;
  position: [number, number, number];
  title: string;
  description: string;
  architecture: string;
  exhibits: WorldExhibit[];
  href: string;
  link: string;
  image?: string;
  alt?: string;
  caption?: string;
  video?: string;
  captions?: string;
  videoDescription?: string;
  videoAction?: string;
}

export const districts: WorldDistrict[] = [
  {
    id: 'studio', number: '01', name: 'The studio', label: 'Images / ideas', color: '#994933', position: [-10, 0, -5.5],
    title: 'Give the idea somewhere to go.',
    description: 'PanelForge grew around the work after an image is made: finding it, keeping its references together, and trying another direction.',
    architecture: 'Gallery walls hold actual screenshots of PanelForge. The model is an illustrated workspace; the screens show the real product.',
    exhibits: [
      { title: 'A place for the result', description: 'Workspaces, projects, scenes and panels give images, audio and documents a useful context.', href: '/features/workspace-hierarchy/' },
      { title: 'A reference becomes a conversation', description: 'Gallery assets can become chat references. The image handoff sits beside the place where its details are inspected.', href: '/features/reference-to-chat/' },
      { title: 'Keep more than one good direction', description: 'Branch navigation, comparison and a preferred path keep revisions connected to their shared history.', href: '/features/branching-workbench/' },
    ],
    href: '/work/panelforge/', link: 'Inside PanelForge',
    image: '/media/branches/comparison.webp', alt: 'The actual PanelForge comparison view shows two retained directions in a controlled fictional workflow.', caption: 'Actual local PanelForge workflow · fixture answers · unreleased comparison fix',
    video: '/media/branches/execution.mp4', captions: '/media/branches/execution.vtt',
    videoDescription: 'A Studio reference moves into chat, two edits retain the original, and Quiet becomes preferred. Actual application footage with fictional seeded answers and loading pauses removed. Comparison uses the disclosed unreleased local fix.',
    videoAction: 'Watch the reference and revisions',
  },
  {
    id: 'engines', number: '02', name: 'The engine room', label: 'A turn keeps going', color: '#44664c', position: [0, 0, -10],
    title: 'The conversation outlasts the screen.',
    description: 'Claude, Codex and OpenCode each have their own integration. The web workspace and Apple clients read a common stream of text and tool activity.',
    architecture: 'Three racks stand for three distinct runtimes. A device dock represents the clients that read their work.',
    exhibits: [
      { title: 'Three runtimes, one client contract', description: 'The engine adapters handle an agent SDK, app-server JSON-RPC and a typed OpenCode client. Each keeps its own session rules.', href: '/features/shared-engine-surface/' },
      { title: 'Return after a disconnect', description: 'An actual engine run keeps working after its browser disconnects, then returns the stored answer. Runtime restart recovery has separate rules.', href: '/labs/recovery/' },
      { title: 'A native answer resumes the task', description: 'An actual Claude question waits for a recorded native choice, then the same invocation continues. The isolated build and its correction are disclosed.', href: '/labs/question/' },
      { title: 'Give the turn a new direction', description: 'A queued correction can reach a compatible tool boundary or follow-up turn, preserving the order of the instructions.', href: '/features/steer-without-interrupt/' },
    ],
    href: '/work/connected-agents/', link: 'How the engines connect',
    image: '/media/question/question.png', alt: 'The actual native question card asks which direction the fictional workshop task should take.', caption: 'Native Simulator · real Claude turn · automated answer · local API shim and unreleased correction',
    video: '/media/question/execution.mp4', captions: '/media/question/execution.vtt',
    videoDescription: 'The actual native chat asks for a choice. An automated participant selects Quick setup, and the same Claude invocation confirms the answer and completes its plan. This isolated build uses a local API shim and an unreleased answer-key correction.',
    videoAction: 'Watch the native question and answer',
  },
  {
    id: 'connections', number: '03', name: 'Connections', label: 'Tools with boundaries', color: '#706325', position: [10, 0, -5.5],
    title: 'A useful connection has a clear boundary.',
    description: 'A shared MCP gateway connects agents to separate tool servers. Identity, resource scopes and tool profiles each answer a different access question.',
    architecture: 'The central arch is the gateway. Branching tracks connect separate capabilities; they illustrate relationships, not live traffic.',
    exhibits: [
      { title: 'Know who is calling', description: 'Authentication identifies the caller. Ownership rules and resource scopes govern access to capabilities.', href: '/features/gateway-tool-profiles/' },
      { title: 'An executable tool boundary', description: 'A model-visible catalog and the engine’s enforced permissions have separate jobs. The native tool-profile exhibit makes that distinction tangible.', href: '/features/native-tool-boundary-profiles/' },
      { title: 'Reach a native canvas', description: 'Stateful proxy support lets InfinitySketch and Freeform retain their session requirements behind the common gateway.' },
      { title: 'Bring the question to the person', description: 'A durable Engine question card carries the choices and returns the answer to the waiting agent.', href: '/features/focus-aware-question/' },
    ],
    href: '/work/connected-tools/', link: 'Follow the connection',
    image: '/media/gateway/browser-replay.png',
    alt: 'The Gateway Lab replays an actual denied request, showing zero upstream calls and the authenticated caller boundary.',
    caption: 'Actual gateway execution · fictional local services · interactive replay',
    video: '/media/gateway/browser-replay.mp4', captions: '/media/gateway/browser-replay.vtt',
    videoDescription: 'Two fictional tasks replay actual allowed and denied gateway requests. The recorded UI shows the result, forwarded-call count and caller identity. Display pacing is editorial; source execution details are in the receipt.',
    videoAction: 'Replay the gateway requests',
  },
  {
    id: 'memory', number: '04', name: 'Memory observatory', label: 'Find the reason again', color: '#796381', position: [10, 0, 6],
    title: 'Keep the reasoning within reach.',
    description: 'Coding sessions can become a readable archive. PanelForge’s knowledge graph distils entities, beliefs and decisions from conversation history; FindThat retrieves a specific past detail.',
    architecture: 'Archive shelves support a constellation of linked ideas. The constellation is a designed illustration, with no private records or invented live metrics.',
    exhibits: [
      { title: 'Try the Memory Lab', description: 'Explore a real reviewed graph sample, inspect a relationship’s source, and try a reversible correction.', href: '/labs/memory/' },
      { title: 'Relationships, with context', description: 'The knowledge graph connects entities, beliefs and decisions derived from the conversation archive. A relationship can lead back to its supporting conversation.', href: '/features/knowledge-graph/' },
      { title: 'A correction with a history', description: 'Curation actions preserve a reason and before-state snapshots. Supported inverse actions record the reversal too.', href: '/features/graph-curation/' },
      { title: 'Find that one thing', description: 'FindThat chooses messages, tool calls or modifications to retrieve a specific command, error, edit or decision, then checks its source.', href: '/features/find-that/' },
    ],
    href: '/work/knowledge-graph/', link: 'Inside the knowledge graph',
    image: '/media/knowledge-graph.webp', alt: 'The real PanelForge knowledge graph filtered to public-safe project and software nodes, with a PanelForge search and build relationship filter.', caption: 'Real project knowledge · filtered to PanelForge and its build relationships',
    video: '/media/knowledge-graph-workflow.mp4', captions: '/media/knowledge-graph-workflow.vtt',
    videoDescription: 'A recorded visit to the real knowledge graph: focus and zoom the project graph, fit it to the viewport, and inspect the PanelForge search and build relationship filter.',
  },
  {
    id: 'workbench', number: '05', name: 'The workbench', label: 'Make good work repeatable', color: '#815833', position: [0, 0, 11],
    title: 'The tools behind making the tools.',
    description: 'metaclaude and metacodex hold portable agent configuration, skills and hooks. Machine-specific settings stay local; the working practices can travel.',
    architecture: 'Two terminal desks represent the two agent setups. The shared pegboard holds reusable skills; the layered drawers stand for configuration and local settings.',
    exhibits: [
      { title: 'metaclaude: a versioned practice', description: 'Portable instructions, hooks, selected settings and reusable skills have one maintained home. Credentials and runtime data remain local.', href: '/features/metaclaude/' },
      { title: 'metacodex: portable configuration', description: 'Base configuration, local overlays and a doctor command let the workbench travel without copying a logged-in session.', href: '/features/metacodex/' },
      { title: 'Coordinate with evidence', description: 'Bosun controls agent panes. Helm gives Claude and Codex coordinators a shared report and handoff protocol, with a reviewed learning loop.', href: '/features/helm/' },
    ],
    href: '/work/agent-workbench/', link: 'Inside the agent workbench',
    image: '/media/workbench/terminal-replay.webp',
    alt: 'A browser terminal viewer replays the real metacodex manager refusing a conflicting configuration change in a fictional home.',
    caption: 'Actual command output · controlled fictional homes · terminal-viewer replay with editorial pacing',
    video: '/media/workbench/terminal-replay.mp4', captions: '/media/workbench/terminal-replay.vtt',
    videoDescription: 'A terminal viewer replays eight captured manager commands and their observed results, including refusal, deliberate adoption, a shared update and preserved local-file hashes. Display timing is editorial.',
    videoAction: 'Replay the captured commands',
  },
  {
    id: 'small-tools', number: '06', name: 'Small useful things', label: 'One job, done thoughtfully', color: '#416f69', position: [-10, 0, 6],
    title: 'Some problems deserve a small tool.',
    description: 'A browser graphics maker. A growing handwritten page. An iPad photobooth. Focused tools with an obvious starting point and a useful result.',
    architecture: 'A colourful print workshop, a writing desk and a camera station represent Kitforge, Pencil Page and Legobro.',
    exhibits: [
      { title: 'Kitforge: make a tile and a clip', description: 'One browser rendering function drives the preview, JPG and looping MP4. The photo stays in the browser.' },
      { title: 'Pencil Page: notes in the margin', description: 'A native iPad handwriting page where feedback sits beside the writing. Explore the separate decisions about when to review and when to show a note.', href: '/labs/margin/' },
      { title: 'Conference notes: turn notes into a presentation', description: 'A conference notebook with reviewed analysis and an editable presentation output.', href: '/work/conference-notes/' },
      { title: 'Legobro: a playful photobooth', description: 'An iPad camera workflow turns a selfie into a collectible-figure style, then offers preview, email and printing.' },
    ],
    href: 'https://kit.danishdave.com', link: 'Try Kitforge',
    image: '/media/kitforge-desktop.webp', alt: 'Kitforge’s real browser editor with a synthetic social tile and layout controls.', caption: 'Working browser tool · fictional demonstration',
    video: '/media/kitforge-workflow.mp4', captions: '/media/kitforge-workflow.vtt',
    videoDescription: 'A recorded workflow in Kitforge: change a fictional tile’s composition in the real browser editor and preview the result.',
  },
];

export const journey = [
  { id: 'studio', title: 'Start with the thing you can see.', description: 'The studio gives the result a home. Follow the paths to see what supports it.' },
  { id: 'engines', title: 'Let the work keep running.', description: 'Behind the chat, each runtime needs a deliberate way to stream, steer and recover a turn.' },
  { id: 'connections', title: 'Connect the things the task needs.', description: 'Capabilities live behind a shared gateway, with separate checks for identity, visibility and execution.' },
  { id: 'memory', title: 'Keep enough context to return.', description: 'The archive and graph make past work something you can revisit.' },
  { id: 'workbench', title: 'Make the next task less awkward.', description: 'Skills, configuration and reviewed handoffs turn experience into a repeatable working practice.' },
  { id: 'small-tools', title: 'And sometimes, keep it small.', description: 'A useful idea can end with a browser tile, a note in a margin or a playful photograph.' },
] as const;
