import type { CaseStudy } from './projects';

export const memoryCaseStudies: CaseStudy[] = [
  {
    slug: 'knowledge-graph', number: '04', name: 'Memory', category: 'Knowledge graph + archive recall',
    title: 'A memory I can inspect.',
    intro: 'Conversation analysis became a graph of projects, ideas and dated relationships. FindThat and Same-Page address two neighboring needs: recovering one detail and carrying relevant context into the next task.',
    premise: 'A useful archive needs more than summaries.',
    problem: [
      'A good summary explains one session. It takes more work to find the decision buried in another session, or understand how the same project changed over time. I extended PanelForge’s analysis with entities, relationships and events that connect those separate records.',
      'Extraction brings its own problems. Generic facts can crowd out useful context, aliases can become duplicate entities and a cleanup process can make a mistaken edit. I worked on relevance, canonical resolution and a reasoned history of graph actions so those decisions can be inspected.',
      'The archive also supports smaller workflows. FindThat recovers a specific command, error or edit with its source. Same-Page loads a previous analysis as background while keeping the new request in charge of the work.',
    ],
    workflow: [
      { title: 'Find the remembered detail', description: 'FindThat selects a message, tool-call or file-modification index according to the clue, then retrieves the supporting record. The result includes the useful detail and enough provenance to check it.' },
      { title: 'Follow the connected project', description: 'The graph brings entities and extracted relationships together. Search and predicate filters narrow the view; selecting an entity focuses its nearby connections. Source conversations explain where a relationship came from.' },
      { title: 'Resolve and review', description: 'A scoped candidate catalog supports canonical entity reuse. Curation actions can preserve reasons and before-states, with inverse actions where supported. The implementation retains a distinction between an extracted fact and a reviewed one.' },
      { title: 'Use the right context next time', description: 'Same-Page loads previous analysis for a new task. A maintained profile can supply approved stable context to supported fresh engine sessions, with opt-in and revision history. Private profile content is excluded from this portfolio.' },
    ],
    decisions: [
      { title: 'Keep a path back to the source', description: 'An extracted relationship is a lead into the archive. Its supporting conversation carries the wording and date needed to assess what the record actually establishes.' },
      { title: 'Resolve names against a catalog', description: 'Observed skipped lookups and duplicate entities led to an explicit grounded-analysis flow and batch resolution. Similar wording needs evidence before it becomes one canonical entity.' },
      { title: 'Preserve the reason for a correction', description: 'Curation records action rows and before-state snapshots. A supported inverse action creates more review history instead of making the correction disappear.' },
    ],
    releases: [
      { kind: 'Minor', version: 'web-v6.98.0', date: 'March 2026', title: 'Structured knowledge joins conversation analysis', description: 'The release added subject-predicate-object extraction and events, questions, decisions and beliefs to the analysis pipeline and conversation details.', project: 'PanelForge' },
    ],
    current: 'The graph recording is a fresh capture of the real PanelForge interface, filtered to public-safe project and software relationships. Search, predicate filtering, focus, zoom and fit were exercised. Extracted aliases and historical technology names remain visible; the graph is not a verified inventory of today’s architecture.',
    evidence: 'Graph extraction is supported by the checked web-v6.98.0 tag from 13 March 2026. August source commits added the grounded loop and batch resolution; September and October records explain review and curation work. Current source also defines FindThat, Same-Page and profile history. These source checks do not establish every workflow’s current production enablement.',
    stack: ['Laravel', 'Vue', 'G6', 'Structured analysis', 'Skills'],
    image: '/media/knowledge-graph.webp',
    imageAlt: 'The real PanelForge knowledge graph, filtered to the PanelForge project and its build relationships, with its connected software nodes in focus.',
    imageCaption: 'Actual graph interface with selected public-safe project knowledge. Historical names and aliases are extracted records, rather than a current architecture inventory.',
    video: '/media/knowledge-graph-workflow.mp4', captions: '/media/knowledge-graph-workflow.vtt',
    videoDescription: 'Search narrows the actual graph to PanelForge, a predicate filter selects build relationships, and selecting the project brings nearby software into focus. Zoom and fit change the view. Cuts shorten stationary pauses.',
    mediaCaption: 'Actual PanelForge interface · inspected project/software labels · edited recording',
  },
  {
    slug: 'agent-workbench', number: '05', name: 'Workbench', category: 'metaclaude + metacodex + Helm',
    title: 'A workbench for coding agents.',
    intro: 'I built versioned setup and reusable workflows for coding agents, then connected them to browser session ownership, evidence for human review and a protocol for reviewing delegated work.',
    premise: 'Agent setup is part of the work.',
    problem: [
      'A useful agent setup spans instructions, skills, hooks, settings and browser context. Copying those pieces by hand makes them drift between sessions and computers. Copying the whole runtime also carries credentials and state that belong to one machine.',
      'metaclaude gives portable Claude Code setup a versioned home. metacodex applies the same boundary to Codex, with layered configuration and checks for local consistency. Both keep repeatable workflows close to the agent that needs them.',
      'The workbench also needs a way to see and review work. Browser tabs have session ownership, observer images give the human a view after supported actions, and captioned walkthroughs turn a flow into a document. Helm gives the lead agent a shared protocol for reviewing worker evidence across two runtimes.',
    ],
    workflow: [
      { title: 'Install the portable setup', description: 'Manage shared instructions, hooks and skills through versioned configuration. Credentials, sessions and local runtime state retain their own machine-local boundary.' },
      { title: 'Check the local assembly', description: 'metacodex combines a portable base with machine and secret overlays. Doctor and trust tools inspect the setup, while drift adoption preserves legitimate local choices.' },
      { title: 'Return browser work to its owner', description: 'The tab bridge identifies a selected page’s session and can deliver it with an instruction. Observer screenshots and captioned flow PDFs provide separate forms of human-reviewable evidence.' },
      { title: 'Review delegated results', description: 'Helm keeps evidence, reports, handoffs and guidance proposals consistent while Claude/Bosun and native Codex use their own coordination tools. The captain checks a worker’s proposal before adopting it as a rule.' },
    ],
    decisions: [
      { title: 'Separate portable setup from runtime state', description: 'Selective links and layered configuration let shared practices travel without turning authentication or session history into configuration artifacts.' },
      { title: 'Make browser identity specific', description: 'Two independent tabs can share a URL. Session ownership and tab identity preserve the intended destination when an agent inspects or receives a page.' },
      { title: 'Give feedback a review step', description: 'A delegated finding and a proposed general rule carry different claims. Helm asks the captain to inspect evidence before accepting either result or guidance change.' },
    ],
    releases: [
      { kind: 'Major', version: 'v1.0.0', date: 'September 2026', title: 'A shared captain protocol across runtimes', description: 'Helm established distinct runtime directions for Claude/Bosun and native Codex, with common reports, handoffs and reviewed instruction feedback.', project: 'Helm' },
      { kind: 'Patch', version: 'v1.0.6', date: 'October 2026', title: 'A repeatable browser walkthrough', description: 'metacodex added the adapted flow-screenshots-pdf skill and printable template, alongside model-routing guidance.', project: 'metacodex' },
    ],
    current: 'The portable configuration, browser bridge and named skills are present in inspected source. The Workbench Lab replays eight actual manager commands from committed metacodex source in two fictional homes: a refused conflict, deliberate adoption, a shared update and preserved local-file hashes. Its synthetic settings and empty hooks are disclosed; it does not launch agents, authenticate or synchronise the fleet. Other workbench installations and observer behavior have not been audited as one live deployment inventory.',
    evidence: 'The configuration story begins with metaclaude in December 2025. September records and Helm’s checked v1.0.0 tag establish its cross-runtime protocol. October bridge, observer and PDF records support the browser workflows; metacodex’s checked v1.0.6 tag contains the PDF skill. Private configuration, session details and machine identities are excluded.',
    stack: ['Python', 'Shell', 'Chrome extension', 'Agent hooks', 'Skills'],
    image: '', imageAlt: '',
    imageCaption: 'The workbench is explained through feature exhibits. No live configuration or private browser screenshot is published.',
  },
];

export const memoryCaseFeatureSlugs: Record<string, string[]> = {
  'knowledge-graph': ['knowledge-graph', 'graph-exploration', 'personal-relevance', 'grounded-analysis', 'graph-curation', 'find-that', 'same-page', 'maintained-profile', 'engine-context'],
  'agent-workbench': ['metaclaude', 'metacodex', 'model-policy', 'browser-handoff', 'observer-screenshots', 'flow-pdf', 'helm', 'reusable-skills', 'workbench-sync', 'browser-evidence'],
};
