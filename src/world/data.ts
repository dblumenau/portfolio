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
}

export const districts: WorldDistrict[] = [
  {
    id: 'studio', number: '01', name: 'The studio', label: 'Images → ideas', color: '#994933', position: [-10, 0, -5.5],
    title: 'Give the idea somewhere to go.',
    description: 'PanelForge grew around the work after an image is made: finding it, keeping its references together, and trying another direction.',
    architecture: 'Gallery walls hold actual screenshots of PanelForge. The model is an illustrated workspace; the screens show the real product.',
    exhibits: [
      { title: 'A place for the result', description: 'Workspaces, projects, scenes and panels give images, audio and documents a useful context.' },
      { title: 'A reference becomes a conversation', description: 'Gallery assets can become chat references. Message branches preserve an earlier direction alongside the revision.' },
    ],
    href: '/work/panelforge/', link: 'Inside PanelForge',
    image: '/media/panelforge-gallery-desktop.webp', alt: 'The real PanelForge gallery with a workspace tree and generated artwork.', caption: 'Working web application · curated gallery capture',
    video: '/media/panelforge-workflow.mp4', captions: '/media/panelforge-workflow.vtt',
    videoDescription: 'A recorded visit to the working gallery: open an existing image, inspect its prompt and generation information, then return to the collection.',
  },
  {
    id: 'engines', number: '02', name: 'The engine room', label: 'A turn keeps going', color: '#44664c', position: [0, 0, -10],
    title: 'The conversation outlasts the screen.',
    description: 'Claude, Codex and OpenCode each have their own integration. The web workspace and Apple clients read a common stream of text and tool activity.',
    architecture: 'Three racks stand for three distinct runtimes. A device dock represents the clients that read their work.',
    exhibits: [
      { title: 'Three runtimes, one client contract', description: 'The engine adapters handle an agent SDK, app-server JSON-RPC and a typed OpenCode client. Each keeps its own session rules.' },
      { title: 'Return after a disconnect', description: 'A stored result can reconcile a client’s partial transcript after the browser connection breaks. Runtime restart recovery has separate rules.' },
    ],
    href: '/work/connected-agents/', link: 'How the engines connect',
    image: '/media/apple-client.webp', alt: 'The Apple conversation client running in an iPhone simulator.', caption: 'Apple client · iPhone Simulator · real saved conversation',
    video: '/media/apple-client-workflow.mp4', captions: '/media/apple-client-workflow.vtt',
    videoDescription: 'A recorded conversation in the Apple client, showing the client’s real chat interface in an iPhone simulator.',
  },
  {
    id: 'connections', number: '03', name: 'Connections', label: 'Tools with boundaries', color: '#706325', position: [10, 0, -5.5],
    title: 'A useful connection has a clear boundary.',
    description: 'A shared MCP gateway connects agents to separate tool servers. Identity, resource scopes and tool profiles each answer a different access question.',
    architecture: 'The central arch is the gateway. Branching tracks connect separate capabilities; they illustrate relationships, not live traffic.',
    exhibits: [
      { title: 'Know who is calling', description: 'Authentication identifies the caller. Ownership rules and resource scopes govern access to capabilities.' },
      { title: 'Choose what a conversation can see', description: 'A tool profile narrows the model-visible catalog. Engine permissions remain a separate boundary.' },
      { title: 'Reach a native canvas', description: 'Stateful proxy support lets InfinitySketch and Freeform retain their session requirements behind the common gateway.' },
    ],
    href: '/work/connected-tools/', link: 'Follow the connection',
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
  },
  {
    id: 'small-tools', number: '06', name: 'Small useful things', label: 'One job, done thoughtfully', color: '#416f69', position: [-10, 0, 6],
    title: 'Some problems deserve a small tool.',
    description: 'A browser graphics maker. A growing handwritten page. An iPad photobooth. Focused tools with an obvious starting point and a useful result.',
    architecture: 'A colourful print workshop, a writing desk and a camera station represent Kitforge, Pencil Page and Legobro.',
    exhibits: [
      { title: 'Kitforge: make a tile and a clip', description: 'One browser rendering function drives the preview, JPG and looping MP4. The photo stays in the browser.' },
      { title: 'Pencil Page: notes in the margin', description: 'A native iPad handwriting page where AI feedback can be anchored beside the writing.' },
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
