import { conferenceCaseStudy } from './conference-case-study';
import { memoryCaseStudies } from './memory-case-studies';

export interface ReleaseStory {
  kind: 'Major' | 'Minor' | 'Patch';
  version: string;
  date: string;
  title: string;
  description: string;
  project: string;
}

export interface CaseStudy {
  slug: string;
  number: string;
  name: string;
  category: string;
  context?: string;
  title: string;
  intro: string;
  premise: string;
  problem: string[];
  workflow: { title: string; description: string }[];
  decisions: { title: string; description: string }[];
  releases: ReleaseStory[];
  current: string;
  evidence: string;
  stack: string[];
  image: string;
  imageAlt: string;
  imageCaption: string;
  video?: string;
  videoDescription?: string;
  captions?: string;
  mediaCaption?: string;
}

export interface SupportingProject {
  name: string;
  label: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  href: string;
  link: string;
  status: string;
  video?: string;
  captions?: string;
  mediaCaption?: string;
  videoDescription?: string;
}

export const siteCopy = {
  title: 'I make the tools I wish existed.',
  intro: "I'm David, a developer in Copenhagen. I build creative workspaces, tools that keep AI work moving, and small apps for everyday jobs.",
  selectedIntro: 'A closer look at what I built, the decisions behind it, and how it changed with use.',
  architectureIntro: 'The interfaces connect to a wider system: agent engines, shared tools, inspectable memory and a workbench that carries the practice between sessions.',
  releasesIntro: 'A release can add a whole workspace. It can also stop a quiet agent being interrupted, or make a transcript easier to read. These changes explain how the products became usable.',
  approach: 'These projects started with specific problems: finding an image again, keeping an agent’s answer when a connection drops, making a social graphic without opening a design app. Some stayed small. PanelForge became the workspace that connects much of the rest. I use AI coding agents in that process and make the product decisions myself.',
};

export const releaseStories: ReleaseStory[] = [
  { kind: 'Major', version: 'web-v3.0.0', date: 'November 2025', title: 'One gallery to navigate', description: 'PanelForge brought browsing and the gallery together, with a project tree and bulk assignment. Viewing and organising an image could happen in the same place.', project: 'PanelForge' },
  { kind: 'Minor', version: 'v0.5.0', date: 'September 2026', title: 'Motion in the same composition', description: 'Kitforge added animated shader backgrounds. The browser preview and exports use the same rendering function, keeping the layout consistent in a JPG or looping MP4.', project: 'Kitforge' },
  { kind: 'Patch', version: 'web-v10.20.95', date: 'October 2026', title: 'A preview before opening', description: 'Code History gained a session peek. A weekly digest could now lead to a quick preview before someone opened the full transcript.', project: 'PanelForge' },
];

export const caseStudies: CaseStudy[] = [
  {
    slug: 'panelforge', number: '01', name: 'PanelForge', category: 'Creative workspace',
    title: 'A home for the work between ideas.',
    intro: 'A web workspace for images, conversations and coding-session history. Built around finding a result again, revising it and keeping its context.',
    premise: 'Making an image is one step.',
    problem: [
      'Finding the right version later, changing part of it, and keeping its references together take a workspace. I started PanelForge around that whole loop: projects, scenes and panels, a gallery, and a mask for targeted image revision.',
      'Conversations and coding sessions later joined the application. The challenge became giving different kinds of work a useful home without making every task start in a different interface.',
    ],
    workflow: [
      { title: 'Give a result a place', description: 'Workspaces contain projects, scenes and panels. The gallery shows that hierarchy alongside images, audio and documents, so an asset can keep its context after the first task.' },
      { title: 'Carry a reference into a conversation', description: 'A gallery image can become a chat reference. Editing an earlier message creates a branch, preserving the original direction alongside the new one.' },
      { title: 'Find the work behind the result', description: 'Code History presents imported coding sessions as a list, a day view and a weekly digest. A session preview lets someone skim before opening the full transcript.' },
    ],
    decisions: [
      { title: 'One gallery to navigate', description: 'In November 2025 I brought separate browsing and gallery screens together. Organisation and viewing could happen in the same place, with a tree and bulk assignment.' },
      { title: 'Organisation belongs to the person', description: 'I moved image ownership and placement into each user’s relationship with an asset. One shared image can then have a different context for each person, instead of forcing everyone into the same folder structure.' },
      { title: 'Keep a web application to maintain', description: 'I removed the NativePHP/Electron wrapper in March 2026 and kept the web application as the maintained product. The later workspace migration also retired older Lightroom and iCloud export actions.' },
    ],
    releases: [
      releaseStories[0],
      { kind: 'Major', version: 'web-v6.0.0', date: 'January 2026', title: 'A gallery for more than images', description: 'Audio and document assets joined images in the gallery, extending the same organisation to other media.', project: 'PanelForge' },
      { kind: 'Minor', version: 'web-v9.12.0', date: 'July 2026', title: 'Address a mobile loading problem', description: 'The release reduced conversation payloads and changed timeout and reload handling after a long mobile loading hang. It treated opening a chat on a phone as a product problem.', project: 'PanelForge' },
      { kind: 'Major', version: 'web-v10.0.0', date: 'August 2026', title: 'A workspace above the project', description: 'Workspaces became the top level of organisation. Migration and move support carried existing assignments into the new structure.', project: 'PanelForge' },
      releaseStories[2],
      { kind: 'Patch', version: 'web-v10.20.97', date: 'October 2026', title: 'Give the transcript the full pane', description: 'Read-only coding transcripts gained the full pane. This followed patches for digest cards, session previews and more accurate slash-command counting.', project: 'PanelForge' },
    ],
    current: 'PanelForge brings the gallery, conversations and coding-session history into one web workspace. The gallery shown here is a fresh capture of the working product. The Branch Lab separately runs the actual interface and fork service in a controlled local fixture. Its answers are seeded, and its comparison footage includes a disclosed unreleased source fix. No model inference is claimed for that run.',
    evidence: 'The first image and revision loop was working in May 2025. The releases below trace the product’s changes through October 2026.',
    stack: ['Laravel', 'Vue', 'TypeScript', 'MySQL', 'Redis'],
    image: '/media/panelforge-gallery-desktop.webp',
    imageAlt: 'PanelForge gallery with a workspace tree beside a collection of images.',
    imageCaption: 'The gallery brings asset browsing and organisation into the same interface.',
    video: '/media/panelforge-workflow.mp4',
    captions: '/media/panelforge-workflow.vtt',
    mediaCaption: 'Live web application · existing generated artwork · edited recording',
    videoDescription: 'Open an image from a safe-for-work gallery, inspect its original prompt and generation information, collapse the metadata panels, and return to the collection. The recording browses existing artwork.',
  },
  {
    slug: 'connected-agents', number: '02', name: 'Connected agents', category: 'Engines + Apple clients',
    title: 'Agent work outlasts a browser tab.',
    intro: 'Three agent engines and Apple clients, with a common way to show the work. The system accounts for long turns, interruptions and disconnected screens.',
    premise: 'A running task and its screen have different lifetimes.',
    problem: [
      'An agent can spend a while reading files and using tools. During that time, a browser can disconnect and a person can move to another device. A partial transcript does not tell them whether the task is still running or has finished.',
      'I built engine services around Claude, Codex and OpenCode, with a common stream for the web and Apple clients to read. Each engine handles its own upstream runtime and session behaviour.',
    ],
    workflow: [
      { title: 'Choose the runtime for the conversation', description: 'Claude, Codex and OpenCode connect through a common client stream format. Engine adapters handle the different upstream protocols; the shared interface does not merge the models’ conversation state.' },
      { title: 'Show the work as it happens', description: 'Text and tool activity arrive as stream events. Queue and injection paths let a follow-up enter a running turn deliberately.' },
      { title: 'Collect the answer after a disconnect', description: 'A stored-result path lets the client retrieve a completed turn and reconcile its partial transcript after a browser or proxy connection breaks. An engine restart has separate recovery rules.' },
      { title: 'Let a question wait for its answer', description: 'The Apple client holds durable question cards from agents. An answer or decline returns to the waiting session through the attention and relay services.' },
    ],
    decisions: [
      { title: 'Share the client contract', description: 'The engines use the same stream format so clients can present text, tool activity and completion consistently. Runtime-specific session handling stays in the engine.' },
      { title: 'Use the protocol the task needs', description: 'Claude uses its agent SDK; Codex uses the bidirectional app-server protocol for streaming, steering and forks; OpenCode uses its typed client. A shared interface still needs three distinct integrations.' },
      { title: 'Check silence before interrupting', description: 'A pause can mean a tool is starting or a result is taking time. The Codex watchdog now checks upstream liveness before deciding that a quiet turn has failed.' },
    ],
    releases: [
      { kind: 'Major', version: 'v1.0.0', date: 'February 2026', title: 'A stable engine boundary', description: 'Claude Engine reached its stable release, followed by a protocol and package refactor in v2.0.0.', project: 'Claude Engine' },
      { kind: 'Minor', version: 'web-v7.91.0', date: 'May 2026', title: 'A third runtime in the same interface', description: 'OpenCode joined Claude and Codex through the common streaming path.', project: 'PanelForge' },
      { kind: 'Minor', version: 'ios-v1.4.0', date: 'July 2026', title: 'Handle an interrupted voice turn', description: 'The iOS client added voice interruption recovery, standby and spoken questions after its first TestFlight release.', project: 'Apple client' },
      { kind: 'Minor', version: 'v6.13.0', date: 'September 2026', title: 'Recover the completed answer', description: 'Claude Engine gained a disconnected-result outbox and an ordered recovery timeline for interrupted client streams.', project: 'Claude Engine' },
      { kind: 'Patch', version: 'v0.6.23', date: 'October 2026', title: 'A pause is reason to check', description: 'Codex Engine added bounded liveness probing so silence alone would not interrupt a legitimate turn.', project: 'Codex Engine' },
      { kind: 'Minor', version: 'v6.15.0', date: 'October 2026', title: 'Steer a turn already in progress', description: 'Queue and injection steering gave follow-ups an explicit route into ongoing work.', project: 'Claude Engine' },
    ],
    current: 'The engines connect the web and Apple clients to three different agent runtimes. The shared interface gives each conversation the same place for text and tool activity. The Recovery Lab also documents a controlled run of the actual Claude Engine: after a browser disconnect, the same engine process completed the turn and its original result endpoint returned the stored answer twice. The run used a fictional text-only task and did not test process restarts, tool approvals or production client reconciliation.',
    evidence: 'Claude Engine’s first tag dates to February 2026. Codex and OpenCode followed in May; the iOS client reached TestFlight in July.',
    stack: ['Python', 'TypeScript', 'JSON-RPC', 'SSE', 'SwiftUI'],
    image: '/media/panelforge-chat-desktop.webp',
    imageAlt: 'PanelForge conversation interface showing a chat and its activity surface.',
    imageCaption: 'The web conversation interface is one client of the connected engine system.',
  },
  {
    slug: 'connected-tools', number: '03', name: 'Connected tools', category: 'Gateway + permissions',
    title: 'Useful tools need clear boundaries.',
    intro: 'A shared gateway connects agents to separate tools. Identity, access scopes and conversation profiles each answer a different question about what an agent can do.',
    premise: 'Every new tool brings an access question.',
    problem: [
      'An agent becomes more useful when it can reach the applications and files involved in a task. Connecting several engines to tools on several machines also brings questions about identity, access and availability.',
      'I built a shared gateway so those questions have a consistent place to be answered. Individual tool servers still own their capabilities, and some depend on another machine being available.',
    ],
    workflow: [
      { title: 'Establish who is calling', description: 'Authentication identifies the caller. Ownership rules and scopes govern which resources that caller may access.' },
      { title: 'Choose what the conversation can see', description: 'A tool profile narrows the catalog visible to the model. That is a separate control from resource access and the engine’s own execution permissions.' },
      { title: 'Reach a capability through the gateway', description: 'Separate servers provide tools for tasks such as image workflows and canvas editing. Cached descriptions let clients discover them without a fresh handshake with every server.' },
    ],
    decisions: [
      { title: 'Give each check a specific job', description: 'Authentication, resource scopes, profile filtering and engine permissions govern different boundaries. A visible tool name alone is not a grant of permission to execute it.' },
      { title: 'Keep the catalog useful during a failure', description: 'The schema cache preserves a server’s last working descriptions if a refresh fails. This prevents a discovery failure from emptying that part of the catalog.' },
      { title: 'Preserve state where a tool needs it', description: 'The gateway gained a stateful proxy path for InfinitySketch, followed by Freeform support. Canvas tools could use the common entry point while retaining their own session requirements.' },
    ],
    releases: [
      { kind: 'Major', version: 'v1.0.0', date: 'March 2026', title: 'A reusable tool catalog', description: 'MCP Bridge introduced its schema cache, separating client discovery from the availability of each underlying tool server.', project: 'MCP Bridge' },
      { kind: 'Major', version: 'v3.0.0', date: 'April 2026', title: 'A common bridge for separate tools', description: 'The bridge moved all eleven tool servers onto the same multiplexer, giving separate stdio capabilities a consistent service boundary.', project: 'MCP Bridge' },
      { kind: 'Minor', version: 'v5.10.0', date: 'September 2026', title: 'Connect a native canvas', description: 'Freeform joined the gateway’s resources after the stateful InfinitySketch proxy work.', project: 'PanelForge MCP' },
      { kind: 'Patch', version: 'v0.6.28', date: 'October 2026', title: 'Enforce the runtime’s tool ceiling', description: 'Codex native tool profiles were validated against the installed catalog and enforced across resumed and forked sessions.', project: 'Codex Engine' },
      { kind: 'Patch', version: 'v3.10.9', date: 'October 2026', title: 'Use the cached handshake', description: 'MCP Bridge refused an incompatible stateless discovery path and used the cached handshake instead.', project: 'MCP Bridge' },
    ],
    current: 'The gateway gives connected tools a common entry point, with resource scopes, conversation profiles and support for stateful services. The Gateway Lab records 17 actual HTTP/MCP requests through archived gateway source, using fictional local authentication, API and music services. It verifies allowed forwarding, denied actions and authenticated caller identity. Native profiles curate the catalog; execution permissions remain a separate boundary. This fixture does not test production OAuth or provider credentials.',
    evidence: 'The bridge and gateway grew alongside the agent clients. Their release history shows catalog caching, canvas connections and enforced runtime permissions developing as separate pieces.',
    stack: ['MCP', 'OAuth', 'TypeScript', 'Python', 'Go'],
    image: '/media/panelforge-chat-desktop.webp',
    imageAlt: 'PanelForge conversation workspace, a client of the connected engine and tool system.',
    imageCaption: 'The conversation workspace connects to capabilities through the shared gateway.',
  },
  ...memoryCaseStudies,
  conferenceCaseStudy,
];

export const supportingProjects: SupportingProject[] = [
  {
    name: 'Kitforge', label: 'Browser graphics + video', title: 'Make a tile and a looping clip.',
    description: 'Choose a look, add a photo and a few words, then export a JPG or looping MP4. The photo stays in the browser. One rendering function keeps the preview and exports tied to the same composition.',
    image: '/media/kitforge-desktop.webp', alt: 'Kitforge browser editor with a social tile preview and design controls.',
    href: 'https://kit.danishdave.com', link: 'Open Kitforge', status: 'Browser tool',
    video: '/media/kitforge-workflow.mp4',
    captions: '/media/kitforge-workflow.vtt',
    mediaCaption: 'Live browser application · sample card · edited recording',
    videoDescription: 'Edit the wording of a sample card and switch between animated backgrounds while the same composition updates in the browser. This recording demonstrates editing and live preview.',
  },
  {
    name: 'Pencil Page', label: 'Handwriting + margin notes', title: 'A page with room for a reply.',
    description: 'A native iPad experiment built around one growing handwritten page. AI feedback appears in the margin. Inserted exercise sheets give it the printed instructions to read alongside the pen strokes.',
    image: '/media/pencil-page.webp', alt: 'Pencil Page in an iPad simulator, with a synthetic Danish exercise and a real AI margin note correcting a verb form.',
    href: '/labs/margin/', link: 'Explore the timing behind the notes', status: 'Early iPad project',
    video: '/media/pencil-page-workflow.mp4', captions: '/media/pencil-page-workflow.vtt',
    mediaCaption: 'Synthetic demo ink · real Opus 5.5 feedback · edited recording.',
    videoDescription: 'A synthetic Danish exercise is sent for manual review. A real margin note corrects a modal-verb error, a follow-up adds an example, and the note folds and unfolds. Cuts remove waiting time.',
  },
];

export const supportingVignettes = [
  { name: 'Legobro', title: 'A selfie becomes a figure.', description: 'An iPad photobooth takes a selfie, generates a collectible-figure style and shows a before-and-after preview. Email and printing paths complete the flow.', tag: 'SwiftUI + camera' },
  { name: 'Photo Archive', title: 'Keep the original. Rebuild the index.', description: 'An archive separates original files from rebuildable search and enrichment data. Hash-checked manifests and curation receipts make the changes traceable.', tag: 'Archiving + data care' },
  { name: 'Danish listening', title: 'Return to the difficult passage.', description: 'A local study tool combines aligned audio, subtitles and a waveform. Select and loop a passage, then revisit it on a phone or tablet.', tag: 'Local study tool' },
];
