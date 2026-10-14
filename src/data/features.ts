export type FeatureArea = 'Memory' | 'Workbench';
export type FeatureEvidence = 'source-current' | 'historical-shipped' | 'current-archive-contract';

export interface Feature {
  id: string;
  slug: string;
  name: string;
  title: string;
  area: FeatureArea;
  date: string;
  topics: string[];
  intro: string;
  problem: string;
  built: string[];
  use: { title: string; description: string }[];
  evolution: { date: string; title: string }[];
  sources: { repo: string; files: string[]; status: FeatureEvidence; note: string };
  related: string[];
  exhibit: {
    title: string;
    caption: string;
    steps: { name: string; detail: string }[];
    choices: { label: string; result: string; explanation: string }[];
  };
}

type Story = Pick<Feature, 'id' | 'slug' | 'name' | 'title' | 'topics' | 'intro' | 'problem' | 'built' | 'use' | 'related' | 'exhibit'>;
const step = (title: string, description: string) => ({ title, description });
const node = (name: string, detail: string) => ({ name, detail });
const choice = (label: string, result: string, explanation: string) => ({ label, result, explanation });

const stories: Story[] = [
  {
    id: 'memory-01', slug: 'knowledge-graph', name: 'Knowledge graph', title: 'Follow an idea across conversations.', topics: ['Knowledge graph', 'Analysis'],
    intro: 'I extended conversation analysis with entities, relationships and dated events, so an idea could lead back to the conversations that explain it.',
    problem: 'A summary helps with one conversation. An archive of separate summaries still makes it hard to see how a project, a decision and a later change fit together.',
    built: ['The analysis pipeline stores structured relationships as knowledge triples. Entity and event information gives those relationships a shared vocabulary and a place in time.', 'I added graph views and entity details alongside the archive. Following a connection can lead to the supporting conversation, where the original wording and context are still available.'],
    use: [step('Begin with an entity', 'Choose a project or idea in the graph, then inspect its relationships.'), step('Follow the evidence', 'Open a linked conversation to check what was actually said. An extracted relationship is a useful lead that still needs its source.')],
    related: ['graph-exploration', 'grounded-analysis', 'graph-curation'],
    exhibit: { title: 'Three conversations, one project', caption: 'Illustrated extraction with invented records. These are explanatory examples, not product output.', steps: [node('Conversation', '“We chose SQLite for the Lantern prototype.”'), node('Relationship', 'Lantern → uses → SQLite'), node('Entity', 'Lantern keeps a link to that source')], choices: [choice('Follow the project', 'Lantern → SQLite', 'A project node joins mentions from separate conversations. The relationship retains its source.'), choice('Check the source', 'Read the original statement', 'The invented sentence supports the prototype decision. It does not establish that every later release used SQLite.')] },
  },
  {
    id: 'memory-02', slug: 'graph-exploration', name: 'Graph exploration', title: 'Make a large graph readable.', topics: ['Knowledge graph', 'Interface'],
    intro: 'I worked on graph layout, labels and focused neighborhoods so a connection could be inspected without keeping the whole graph on screen.',
    problem: 'More nodes bring more crossing lines. Showing every label at once can make a graph harder to read and slower to explore.',
    built: ['The graph work iterated through G6 layouts, selective labels and neighborhood highlighting. Entity focus gives a crowded map a smaller area to explain.', 'The current source includes several graph surfaces, entity profiles and timelines. Their roles differ: the overview helps locate a connection; details and dated sources explain it.'],
    use: [step('Locate a useful starting point', 'Find a project or entity in the overview rather than trying to read every node.'), step('Focus, then inspect', 'Select its neighborhood and follow the relevant entity details and source timeline.')],
    related: ['knowledge-graph', 'graph-curation'],
    exhibit: { title: 'From the overview to a neighborhood', caption: 'A small diagram explains the focus pattern. It is not a benchmark or a screenshot of the graph renderer.', steps: [node('Overview', 'Many projects and their connections'), node('Focus: Lantern', 'Keep its direct neighbors in view'), node('Inspect', 'SQLite · prototype decision · source')], choices: [choice('Read the overview', 'Find a starting point', 'The broad view shows where groups of ideas connect. Reading every label would compete with that job.'), choice('Focus on Lantern', 'Two useful neighbors', 'The focused view makes room for the selected relationship and its evidence.')] },
  },
  {
    id: 'memory-03', slug: 'personal-relevance', name: 'Personal relevance', title: 'Keep the facts that distinguish the work.', topics: ['Knowledge graph', 'Curation'],
    intro: 'I revised extraction and pruning criteria after generic facts began competing with useful personal and project context.',
    problem: 'A personal graph can fill up with facts a reference book already knows. Those records make specific decisions and durable context harder to find.',
    built: ['I refined the analysis and review instructions around relevance: a project choice, a preference or a dated event can explain this archive in a way that a generic fact cannot.', 'The pruning service can classify records for retention or correction. This was a design correction in the extraction process; it does not make generated knowledge error-free.'],
    use: [step('Ask what the fact adds', 'Look for a connection to the person, project or event represented in the archive.'), step('Review the classification', 'Check the source before retaining or correcting a relationship. A general statement may belong in a conversation without belonging in durable memory.')],
    related: ['knowledge-graph', 'graph-curation'],
    exhibit: { title: 'Which fact belongs?', caption: 'Two invented statements show the relevance criterion. The selection below is an explanation, not an automated model decision.', steps: [node('Extract', 'A conversation contains both statements'), node('Review', 'Does this explain the project?'), node('Retain', 'Keep a useful, supported connection')], choices: [choice('“SQLite is a database”', 'Generic background', 'This adds little project-specific information to a personal graph.'), choice('“Lantern chose SQLite for its offline prototype”', 'A project decision', 'The statement distinguishes the prototype and can be checked against its dated source.')] },
  },
  {
    id: 'memory-04', slug: 'graph-curation', name: 'Curation history', title: 'Give a correction a reason and a history.', topics: ['Knowledge graph', 'Curation'],
    intro: 'I added action records and before-state snapshots to graph curation, with inverse actions for supported corrections.',
    problem: 'Cleanup is hard to assess when a fact disappears or changes without leaving a reason. A mistaken correction also needs a way back.',
    built: ['The curation service records actions such as rewriting, retyping and canonicalizing relationships. Action rows and before-state snapshots preserve what changed and why.', 'Supported actions can be inverted through another recorded action. The October implementation work also addressed preserving reviewed records during re-analysis. The exact set of controls exposed in the interface still needs a separate live check.'],
    use: [step('Read the action', 'Inspect the original state, the new state and the recorded reason in a review run.'), step('Check or reverse it', 'Use the source to decide whether the correction was justified. Where inversion is supported, restoring the earlier state creates another action in the trail.')],
    related: ['personal-relevance', 'grounded-analysis'],
    exhibit: { title: 'An edit that stays inspectable', caption: 'Invented relationship and review reason. The examples explain a correction and its inverse; they do not edit a real graph.', steps: [node('Before', 'Lantern → uses → PostgreSQL'), node('Correction', 'Source says SQLite; record the reason'), node('After', 'Lantern → uses → SQLite')], choices: [choice('Inspect the correction', 'PostgreSQL → SQLite', 'The before-state and the source-based reason remain available with the action.'), choice('Inspect an inverse action', 'Restore the recorded before-state', 'A supported inverse action writes its own history. A reversal is itself something to review.')] },
  },
  {
    id: 'memory-05', slug: 'grounded-analysis', name: 'Grounded analysis', title: 'Look up a name before creating another one.', topics: ['Knowledge graph', 'Analysis'],
    intro: 'I rebuilt analysis around a scoped candidate catalog and explicit resolution, after skipped lookups and duplicate entities showed the limits of prompting alone.',
    problem: 'A model can understand a conversation and still treat an alias as a new entity. Similar names then split evidence that belongs together.',
    built: ['Analysis starts from an immutable conversation snapshot and a user-scoped catalog of existing tags and entities. Candidate lookup and resolution give the model a route to canonical reuse.', 'The August work added a grounded agentic loop and batch candidate resolution. It was prompted by observed failures, so the design keeps resolution explicit rather than assuming the model will always follow instructions.'],
    use: [step('Compare the candidates', 'Check whether an extracted name or alias already refers to an entity in the catalog.'), step('Resolve with evidence', 'Reuse the canonical record when the match is supported. Create a separate entity when the meanings differ.')],
    related: ['knowledge-graph', 'graph-curation'],
    exhibit: { title: 'One project, two ways to name it', caption: 'A synthetic candidate lookup explains canonical reuse. No search against a private catalog occurs here.', steps: [node('Mention', '“Lantern app” in a conversation'), node('Lookup', 'Catalog candidate: Lantern'), node('Resolve', 'Reuse the existing project entity')], choices: [choice('Matching alias', 'Lantern app → Lantern', 'Evidence that the names refer to the same project supports reusing its canonical entity.'), choice('Different project', 'Keep a separate entity', 'Similar wording alone is insufficient. Resolution should preserve a meaningful distinction.')] },
  },
  {
    id: 'memory-06', slug: 'maintained-profile', name: 'Maintained profile', title: 'Keep a working brief with a restore path.', topics: ['Context', 'Curation'],
    intro: 'I built a concise maintained profile with authored sections, revision snapshots and an explicit opt-in for use as assistant context.',
    problem: 'Repeating stable working preferences takes time. An automatically maintained brief needs visible history so its changes can be checked.',
    built: ['The personal context service and refresh job maintain a short brief from evidence. User-authored sections, opt-in settings and stored revisions give the person control over the resulting context.', 'The profile can be refreshed, edited, inspected and restored. Its contents are private; this portfolio explains the mechanism using fictional examples.'],
    use: [step('Review the brief', 'Check the maintained and authored sections before opting in to prompt inclusion.'), step('Inspect a revision', 'Compare a refresh with an earlier snapshot. Restore an earlier version when the new wording is unsuitable.')],
    related: ['engine-context', 'same-page'],
    exhibit: { title: 'A brief with visible revisions', caption: 'Fictional preferences only. This diagram does not reproduce any personal profile.', steps: [node('Authored section', '“Use plain language in project notes.”'), node('Refresh', 'Evidence may update maintained sections'), node('History', 'Inspect revisions and restore a snapshot')], choices: [choice('Review the current brief', 'Inspect before inclusion', 'A concise profile remains editable context. Authored text and opt-in settings matter to its use.'), choice('Return to a revision', 'Restore the selected snapshot', 'A stored revision provides a reference for correcting an unwanted refresh.')] },
  },
  {
    id: 'memory-07', slug: 'engine-context', name: 'Context across engines', title: 'Carry an approved brief into a fresh session.', topics: ['Context', 'Engines'],
    intro: 'I gave fresh Claude and Codex sessions a shared context assembly path, governed by the maintained profile’s opt-in checks.',
    problem: 'A working brief can become tied to one provider. Switching engines then means explaining the same stable context again.',
    built: ['The engine personal context service assembles the approved brief for engine startup. Claude and Codex session services integrate that context at their entry points.', 'Opt-in and session policy checks govern inclusion. The inspected source establishes those boundaries; it does not establish that every production entry point currently enables the feature.'],
    use: [step('Approve the context', 'Review the profile and enable inclusion through its opt-in setting.'), step('Begin a fresh session', 'The supported startup path can include the approved brief. Provider-specific conversation state remains separate.')],
    related: ['maintained-profile', 'same-page'],
    exhibit: { title: 'One approved brief, separate conversations', caption: 'Context-flow illustration. No provider account or real session is connected to this page.', steps: [node('Profile', 'Reviewed fictional working brief'), node('Opt-in check', 'Context assembly decides inclusion'), node('Fresh session', 'Claude or Codex receives the brief')], choices: [choice('Inclusion enabled', 'Add approved context', 'A supported fresh-session path can include the brief after its policy checks.'), choice('Inclusion disabled', 'Start without the profile', 'Opt-in governs prompt inclusion. Maintaining a profile alone does not require using it in a session.')] },
  },
  {
    id: 'memory-08', slug: 'find-that', name: 'FindThat', title: 'Recover the detail you half remember.', topics: ['Archive', 'Skills'],
    intro: 'I packaged archive recall as a workflow for finding one command, error, decision or file change, then checking the full source record.',
    problem: 'A remembered incident is often a poor search phrase. Broad results also leave the reader to decide which session actually contains the useful detail.',
    built: ['FindThat chooses an index based on the item: messages for words and decisions, tool calls for commands and errors, or file modifications for edits. A promising hit is followed by retrieval of its source.', 'The return contract asks for the useful detail with a title, date and source pointer. It keeps recall specific enough to act on, while preserving the evidence needed to check the answer.'],
    use: [step('Describe the remembered incident', 'Ask for the command, error or change and include the clue you remember, even if its wording is approximate.'), step('Check the returned source', 'Read the recovered detail and its nearby context. Similar incidents can occur in different sessions.')],
    related: ['same-page', 'knowledge-graph', 'reusable-skills'],
    exhibit: { title: 'A clue chooses the search corpus', caption: 'Illustration of the FindThat procedure. The sample archive and command below are invented; no private session is queried.', steps: [node('Remembered clue', '“The command that found a listening port”'), node('Tool-call index', 'Search recorded commands and outputs'), node('Source check', 'Read the matching command in context')], choices: [choice('A command or error', 'Search tool calls', 'A recorded shell result may contain the detail even when the conversational summary uses different words.'), choice('A design decision', 'Search messages', 'The reason for a choice is more likely to appear in the discussion. Retrieve the source after finding a candidate.'), choice('An edit to a file', 'Search modifications', 'A filename or path fragment can connect the remembered edit to the session that made it.')] },
  },
  {
    id: 'memory-09', slug: 'same-page', name: 'Same-Page', title: 'Bring useful context into the next conversation.', topics: ['Archive', 'Context', 'Skills'],
    intro: 'I made a workflow for loading a prior session’s analysis as quiet background while letting the current request define the work.',
    problem: 'Replaying a transcript adds noise. It can also make unfinished work from an old session look like a new instruction.',
    built: ['Same-Page resolves a conversation reference and loads its analysis. Transcript and tool-call expansion are excluded by default, with optional child context when relevant.', 'The procedure separates remembered context from current facts. It requires checking stale details before acting and keeps the acknowledgment short, so a context sync does not become a second task.'],
    use: [step('Reference the previous session', 'Ask to get on the same page with that session as context.'), step('State today’s request', 'Use the loaded background to answer the new question. Recheck old paths, versions or runtime details before relying on them.')],
    related: ['find-that', 'maintained-profile'],
    exhibit: { title: 'Yesterday’s analysis, today’s request', caption: 'Invented session summaries explain task boundaries. This is not a replay of a real conversation.', steps: [node('Earlier session', 'Lantern considered two storage options'), node('Context sync', 'Load its analysis as background'), node('Current request', 'Compare the offline tradeoffs today')], choices: [choice('Use relevant background', 'Explain the known tradeoff', 'The prior reasoning helps answer the current question without replaying every tool call.'), choice('Act on an old task', 'Verify the current request first', 'A context reference does not authorize resuming yesterday’s unfinished implementation. Current facts also need checking.')] },
  },
  {
    id: 'workbench-01', slug: 'metaclaude', name: 'metaclaude', title: 'Give reusable agent setup a versioned home.', topics: ['Configuration', 'Skills'],
    intro: 'I collected Claude Code guidance, selected settings, hooks and skills in a configuration repository that can travel between projects and machines.',
    problem: 'Agent setup spreads across instructions and configuration files. Manual copies drift, and copying a whole runtime directory includes state that should stay local.',
    built: ['metaclaude holds portable instructions, base settings, hooks and reusable skills. Version control gives those working practices a history and a common place to maintain them.', 'The repository supplies selected setup. Credentials and runtime data keep their own local locations, so the portable artifact can be updated without copying a logged-in session.'],
    use: [step('Manage the portable setup', 'Keep reusable guidance and workflows in the configuration repository.'), step('Keep runtime state local', 'Apply the selected setup through its installation workflow, then check the result on each machine.')],
    related: ['metacodex', 'reusable-skills', 'workbench-sync'],
    exhibit: { title: 'What belongs in the configuration repository?', caption: 'Conceptual repository boundary with invented settings. This is not a capture of live configuration.', steps: [node('Versioned setup', 'Instructions · hooks · selected settings'), node('Installation', 'Apply managed configuration'), node('Local runtime', 'Credentials and session state stay here')], choices: [choice('A reusable review skill', 'Versioned setup', 'A workflow intended for repeated use benefits from one maintained source.'), choice('A logged-in session', 'Machine-local state', 'Authentication and runtime history belong to their local runtime, outside portable setup.')] },
  },
  {
    id: 'workbench-02', slug: 'metacodex', name: 'metacodex', title: 'Share Codex setup while keeping local settings.', topics: ['Configuration', 'Portability'],
    intro: 'I brought the portable workbench to Codex with a base configuration, local overlays and a doctor command for checking the assembled setup.',
    problem: 'A machine may need its own settings while still sharing the same instructions and hooks. A blanket configuration copy can overwrite those differences or carry credentials with it.',
    built: ['metacodex combines portable base configuration with machine and secret overlays. Selective links share managed resources, while generated runtime configuration remains local.', 'The documented workflow includes installation, synchronization, drift adoption, trust management and doctor checks. Adoption gives a legitimate local change somewhere to live rather than treating every difference as an error.'],
    use: [step('Assemble and inspect', 'Install the managed setup and run doctor to check its consistency.'), step('Adopt a legitimate local change', 'Place machine-specific settings in the local layer. Rebuild the runtime configuration and inspect it again.')],
    related: ['metaclaude', 'model-policy', 'workbench-sync'],
    exhibit: { title: 'Three layers make one local configuration', caption: 'An explanatory layer model with no live settings, secrets or machine names.', steps: [node('Portable base', 'Shared instructions and defaults'), node('Local overlays', 'Machine choices and secret values'), node('Runtime config', 'Generated for this machine')], choices: [choice('Update shared instructions', 'Change the portable base', 'A reusable instruction belongs in the versioned configuration that enrolled machines share.'), choice('Keep a machine-specific preference', 'Use the local overlay', 'A legitimate local choice can survive synchronization without becoming a global default.')] },
  },
  {
    id: 'workbench-03', slug: 'model-policy', name: 'Model policy guard', title: 'Check the policy where an agent starts.', topics: ['Configuration', 'Coordination'],
    intro: 'I added a pre-spawn guard for approved model, effort and fork combinations, alongside checks for trusted local configuration.',
    problem: 'Written guidance alone cannot establish that a proposed agent launch uses the permitted configuration.',
    built: ['A configured hook checks proposed agent-spawn arguments before execution. It can block combinations outside the approved policy and explain the rejected parameters.', 'Trust tooling and doctor checks help inspect the installed setup. The guard depends on its hook being installed and trusted; it does not govern a model picker or inference described only in text.'],
    use: [step('Check the installed hook', 'Inspect configuration and trust before depending on the execution guard.'), step('Validate the proposed launch', 'Use permitted arguments. If a combination is rejected, correct it and preserve the intended task.')],
    related: ['metacodex', 'helm'],
    exhibit: { title: 'A policy decision at the execution boundary', caption: 'A simplified decision flow. The controls explain outcomes without launching agents or reading local policy.', steps: [node('Spawn request', 'Model · effort · fork parameters'), node('Installed hook', 'Compare the request with policy'), node('Decision', 'Allow execution or return a reason')], choices: [choice('Parameters meet policy', 'Allow the request', 'The configured execution guard permits a combination that satisfies its policy checks.'), choice('Parameters violate policy', 'Reject with a reason', 'The caller can correct the arguments and retry the same task.'), choice('Hook is not active', 'No guard at this boundary', 'Installation and trust are prerequisites. Written guidance remains distinct from runtime enforcement.')] },
  },
  {
    id: 'workbench-04', slug: 'browser-handoff', name: 'Browser handoff', title: 'Send the page to the session that owns it.', topics: ['Browser', 'Coordination'],
    intro: 'I extended Chrome tab grouping into a bridge that associates pages with agent sessions and sends a selected tab back with optional instructions.',
    problem: 'Several sessions can share one browser. Without ownership, a page opened for one task can be mistaken for another session’s work.',
    built: ['Session-colored groups and per-session tab ownership make agent-opened pages identifiable. The extension’s toolbar can send a chosen page to its session, including an optional prompt.', 'The bridge was developed for Claude and then Codex. The archived October rollout records installation on multiple machines; that history does not establish that every host is currently enrolled.'],
    use: [step('Identify the owning session', 'Use the tab group and ownership information before acting on a shared browser page.'), step('Send a specific page', 'Choose the tab and, if useful, attach a short instruction for its session.')],
    related: ['observer-screenshots', 'browser-evidence', 'metacodex'],
    exhibit: { title: 'Two sessions can share a browser', caption: 'Fictional tabs and sessions demonstrate ownership. No private URLs or browser history are shown.', steps: [node('Session A', 'Opened a documentation page'), node('Owned tab', 'Group and identity retain the link'), node('Handoff', 'Send the selected page to Session A')], choices: [choice('Send the documentation tab', 'Route to Session A', 'The selected tab’s ownership identifies the intended recipient, even in a shared browser.'), choice('A second tab has the same URL', 'Retain its separate identity', 'A URL alone cannot distinguish two independent tabs. The handoff needs the chosen tab’s identity.')] },
  },
  {
    id: 'workbench-05', slug: 'observer-screenshots', name: 'Observer screenshots', title: 'Give the human a view of the browser action.', topics: ['Browser', 'Evidence'],
    intro: 'I added compressed browser screenshots for the human viewer, carried separately from the pixels sent to the model.',
    problem: 'A remote supervisor needs to see whether a browser interaction reached the expected screen. Adding every image to model input also increases the payload.',
    built: ['A browser action can produce a compressed screenshot uploaded separately. A small signed reference appears in the tool card so the human can inspect the image.', 'The browser proxy also preserves named-tab identity. October implementation and verification sessions tested independent tabs with the same URL. Supported engines, retention and mobile behavior need checking before broader current claims.'],
    use: [step('Perform a browser action', 'Use the supported observer path for a specifically targeted tab.'), step('Inspect the human-facing image', 'Check the tool-card screenshot against the intended action. A visual result helps supervision without claiming the interaction passed every functional check.')],
    related: ['browser-handoff', 'flow-pdf'],
    exhibit: { title: 'Two audiences for one action', caption: 'Payload-flow illustration. The page does not contain a real observer image or connect to storage.', steps: [node('Browser action', 'Capture the specifically named tab'), node('Separate upload', 'Compressed image and signed reference'), node('Human tool card', 'Viewer opens the screenshot')], choices: [choice('What the human sees', 'A browser image', 'The viewer can inspect the visible result after the action.'), choice('What the model receives', 'A small reference', 'The observer image travels separately from model content in this design.')] },
  },
  {
    id: 'workbench-06', slug: 'flow-pdf', name: 'Flow screenshots PDF', title: 'Make a browser walkthrough someone can review.', topics: ['Browser', 'Evidence', 'Skills'],
    intro: 'I turned multi-size browser capture into a reusable workflow for captioned, paginated PDF walkthroughs.',
    problem: 'A folder of screenshots loses the order of a user flow. Different screen sizes are also difficult to compare without consistent labels and captions.',
    built: ['The skill walks the real browser flow at selected sizes, records the steps and captions the captures. A template packages them into legible pages.', 'The workflow exists in both agent workbenches. It produces review material; the screenshots still need inspection and do not by themselves establish functional correctness.'],
    use: [step('Walk the complete flow', 'Capture the important steps in order at the requested screen sizes.'), step('Review the PDF', 'Check captions, grouping, page breaks and the images themselves before sharing the artifact.')],
    related: ['browser-evidence', 'observer-screenshots', 'reusable-skills'],
    exhibit: { title: 'A flow becomes a review document', caption: 'An illustrated document sequence. No PDF pages or screenshots are represented as actual captures here.', steps: [node('Capture', 'Ordered steps at several widths'), node('Caption', 'Explain action and visible result'), node('Paginate', 'Readable pages for a reviewer')], choices: [choice('An isolated screenshot', 'One visible state', 'It records what was on screen, but may omit the action that led there.'), choice('A captioned sequence', 'A reviewable flow', 'Ordered actions and results give the reader context and make width differences easier to compare.')] },
  },
  {
    id: 'workbench-07', slug: 'helm', name: 'Helm', title: 'Review delegated work across agent runtimes.', topics: ['Coordination', 'Evidence'],
    intro: 'I built a shared captain protocol for evidence, worker reports, handoffs and reviewed feedback, while keeping each runtime’s coordination tools.',
    problem: 'A delegation practice tied to one assistant breaks when the lead changes runtime. Child reports also need a review step before their suggestions become guidance.',
    built: ['Helm separates the shared reporting and learning protocol from the runtime mechanics. Claude/Bosun and native Codex coordination can use their own tools while following the same evidence and handoff expectations.', 'A captain reviews worker results and proposed instruction changes. The September release history records the first stable protocol and a second-machine test; the portfolio makes no current fleet-wide installation claim.'],
    use: [step('Give a worker a bounded task', 'Specify its scope and the evidence needed in its report.'), step('Review before accepting', 'Check the report and proposed guidance changes. A captain can accept useful feedback or decline a change that is unsupported.')],
    related: ['model-policy', 'reusable-skills', 'browser-evidence'],
    exhibit: { title: 'A report returns to the captain', caption: 'Synthetic task and report flow. No real panes, workers or sessions are displayed.', steps: [node('Captain', 'Assign a bounded investigation'), node('Worker', 'Return findings and supporting evidence'), node('Review', 'Accept result; assess guidance proposal')], choices: [choice('Evidence supports the proposal', 'Review and accept', 'The captain can adopt a useful change after checking its basis.'), choice('The proposal overgeneralizes', 'Decline the rule change', 'A successful task does not automatically establish a general instruction for future work.')] },
  },
  {
    id: 'workbench-08', slug: 'reusable-skills', name: 'Reusable skills', title: 'Package a repeated task with a clear contract.', topics: ['Skills', 'Portability'],
    intro: 'I keep repeatable workflows as named skills with their inputs, tools, output shape and limits close together.',
    problem: 'Explaining a familiar procedure from scratch makes it easy to omit a step. A bare tool name also says little about when or how it should be used.',
    built: ['A skill supplies a procedure when a task calls for it: where to read, which tools to use, what to return and how to handle known failure boundaries.', 'Both workbenches contain portable skills. metacodex’s shared directory link makes the maintained skill set available without copying each file into runtime state.'],
    use: [step('Choose the relevant workflow', 'Invoke the named skill when its scope matches the requested task.'), step('Read the contract', 'Follow its inputs, evidence and output requirements. Apply the user’s scope and preferences to the work.')],
    related: ['find-that', 'flow-pdf', 'metaclaude'],
    exhibit: { title: 'A reusable skill describes more than a tool', caption: 'Two conceptual skill contracts explain the pattern; these are not complete executable instructions.', steps: [node('Trigger', 'A named workflow fits the task'), node('Procedure', 'Inputs · tools · evidence · limits'), node('Output', 'A predictable result to review')], choices: [choice('Archive recall', 'One detail with a source', 'FindThat selects the relevant corpus and retrieves the supporting record.'), choice('Browser walkthrough', 'A captioned document', 'Flow screenshots PDF needs ordered captures and a reviewed, readable artifact.')] },
  },
  {
    id: 'workbench-09', slug: 'workbench-sync', name: 'Workbench sync', title: 'Update the shared setup without copying local state.', topics: ['Configuration', 'Portability'],
    intro: 'I built selective synchronization around portable setup, with local boundaries and checks that make drift visible.',
    problem: 'A configuration update should reach enrolled machines while preserving their credentials, runtime history and valid local differences.',
    built: ['The workbench repositories document selective links and synchronization. Portable files are managed together; authentication, session state and machine-specific overlays stay local.', 'The October archive records a post-push synchronization repair. Doctor checks help inspect consistency, but repository contracts and an earlier rollout are not a current inventory of every machine.'],
    use: [step('Update a portable file', 'Make the shared guidance or configuration change in its versioned source.'), step('Sync and check locally', 'Apply the update to an enrolled machine, then inspect the assembled setup and any legitimate local drift.')],
    related: ['metacodex', 'metaclaude', 'model-policy'],
    exhibit: { title: 'A shared change crosses a local boundary', caption: 'A conceptual sync using disposable machine labels. It does not show live hosts or execute an update.', steps: [node('Shared change', 'Revise a reusable instruction'), node('Sync', 'Update managed portable files'), node('Local boundary', 'Leave authentication and state local')], choices: [choice('A portable instruction changes', 'Sync the managed file', 'The shared setup can change on enrolled machines through its managed update path.'), choice('A local credential exists', 'Preserve local state', 'Portable synchronization should not turn authentication into a repository artifact.')] },
  },
  {
    id: 'workbench-10', slug: 'browser-evidence', name: 'Browser evidence', title: 'Keep a browser result connected to its task.', topics: ['Browser', 'Evidence'],
    intro: 'I connected session-owned browser pages with repeatable capture and handoff practices, so visual evidence can return to the work that produced it.',
    problem: 'A screenshot without a task, action or page identity is difficult to interpret later. Browser exploration can otherwise become detached from the agent’s report.',
    built: ['The browser bridge associates a page with its session. Capture workflows then turn selected states and flows into human-reviewable artifacts, with context in the resulting handoff.', 'This joins the current tab bridge and screenshot-to-PDF workflow. Earlier experiments with GIF exports are a separate historical thread and are not presented as a current capability here.'],
    use: [step('Keep the page associated with the task', 'Work in a tab that the relevant session owns and can identify.'), step('Return evidence with context', 'Include the action, visible result and artifact reference in the handoff. A reviewer should be able to tell what was inspected.')],
    related: ['browser-handoff', 'flow-pdf', 'helm'],
    exhibit: { title: 'From a page to a useful handoff', caption: 'An invented documentation task explains the evidence chain. No logged-in browser material is shown.', steps: [node('Owned page', 'Session A opens documentation'), node('Captured step', 'Action and visible result are labeled'), node('Handoff', 'Report links the evidence artifact')], choices: [choice('Image without context', 'Hard to assess later', 'The reviewer may not know which action or task the image records.'), choice('Image with its handoff', 'A traceable observation', 'Page ownership, the action and a labeled result make the evidence easier to inspect.')] },
  },
];

// Public metadata is deliberately separate from the private research ledger.
const metadata: Record<string, Pick<Feature, 'date' | 'evolution' | 'sources'>> = {
  "memory-01": {
    "date": "2026-03-13",
    "evolution": [
      {
        "date": "2026-03-13",
        "title": "Building conversation analysis and a personal knowledge graph"
      },
      {
        "date": "2026-03-13",
        "title": "Implementing knowledge graph extraction"
      }
    ],
    "sources": {
      "repo": "panel-forge",
      "files": [
        "app/Services/ConversationAnalysisService.php",
        "app/Jobs/AnalyzeConversationJob.php",
        "app/Models/KnowledgeTriple.php",
        "resources/js/pages/KnowledgeGraph/"
      ],
      "status": "source-current",
      "note": "Analysis and graph source inspected. A fresh, public-safe recording verifies graph search, predicate filtering, focus, zoom and fit. Other analysis behavior remains supported by source inspection."
    }
  },
  "memory-02": {
    "date": "2026-03-13",
    "evolution": [
      {
        "date": "2026-03-13",
        "title": "Optimizing the knowledge graph visualization"
      }
    ],
    "sources": {
      "repo": "panel-forge",
      "files": [
        "resources/js/pages/KnowledgeGraph/components/GraphCanvas.vue",
        "resources/js/pages/KnowledgeGraph/components/KnowledgeFullGraph.vue",
        "app/Http/Controllers/KnowledgeGraphController.php"
      ],
      "status": "source-current",
      "note": "Graph components and controller inspected. Search, filtering, entity focus, zoom and fit were exercised in the actual recorded interface. The small illustrative diagram is separate from that capture."
    }
  },
  "memory-03": {
    "date": "2026-03-18",
    "evolution": [
      {
        "date": "2026-03-18",
        "title": "Refining graph extraction and pruning criteria"
      }
    ],
    "sources": {
      "repo": "panel-forge",
      "files": [
        "app/Services/ConversationAnalysisService.php",
        "app/Services/KnowledgeTriplePruningService.php",
        "app/Jobs/AnalyzeConversationJob.php"
      ],
      "status": "historical-shipped",
      "note": "The archive records a March extraction correction. Generated facts still require review."
    }
  },
  "memory-04": {
    "date": "2026-09-17",
    "evolution": [
      {
        "date": "2026-09-17",
        "title": "Testing graph pruning and retention tradeoffs"
      },
      {
        "date": "2026-10-06",
        "title": "Graph ingest, search, and pruning implementation"
      }
    ],
    "sources": {
      "repo": "panel-forge",
      "files": [
        "app/Services/KnowledgeCurationService.php",
        "app/Models/KnowledgePruneRun.php",
        "app/Models/KnowledgePruneRunAction.php",
        "resources/js/pages/KnowledgeGraph/components/KnowledgePruneRuns.vue",
        "resources/js/pages/KnowledgeGraph/components/KnowledgePruneRunActions.vue"
      ],
      "status": "source-current",
      "note": "Curation and action-history source inspected. Some operations may be API-only rather than visible interface controls."
    }
  },
  "memory-05": {
    "date": "2026-08-03",
    "evolution": [
      {
        "date": "2026-08-03",
        "title": "Planning entity and tag grounding"
      },
      {
        "date": "2026-08-04",
        "title": "Rebuilding analysis around canonical reuse"
      }
    ],
    "sources": {
      "repo": "panel-forge",
      "files": [
        "app/Services/ConversationAnalysisGroundingService.php",
        "app/Services/AnalysisCandidateCatalog.php",
        "app/Services/ConversationAnalysisCandidateResolutionService.php",
        "app/Services/ConversationAnalysisService.php"
      ],
      "status": "source-current",
      "note": "Grounding and resolution source inspected. The redesign addresses documented model failures; it does not guarantee canonical reuse on every run."
    }
  },
  "memory-06": {
    "date": "2026-08-02",
    "evolution": [
      {
        "date": "2026-08-02",
        "title": "Designing a maintained assistant profile"
      },
      {
        "date": "2026-08-03",
        "title": "Injecting the profile into engine sessions"
      }
    ],
    "sources": {
      "repo": "panel-forge",
      "files": [
        "app/Services/PersonalContext/PersonalContextService.php",
        "app/Jobs/RefreshPersonalContextJob.php",
        "app/Models/UserPersonalContext.php",
        "app/Models/PersonalContextRevision.php",
        "app/Http/Controllers/Api/PersonalContextController.php"
      ],
      "status": "source-current",
      "note": "Profile service, revisions and refresh source inspected. Only fictional profile content is used in the illustration."
    }
  },
  "memory-07": {
    "date": "2026-08-03",
    "evolution": [
      {
        "date": "2026-08-03",
        "title": "Auto-injecting a personal context profile"
      }
    ],
    "sources": {
      "repo": "panel-forge",
      "files": [
        "app/Services/EnginePersonalContextService.php",
        "app/Services/PersonalContext/PersonalContextService.php",
        "app/Services/ClaudeSessionService.php",
        "app/Services/CodexSessionService.php"
      ],
      "status": "source-current",
      "note": "Context assembly source inspected. Production enablement at every session entry point has not been independently checked."
    }
  },
  "memory-08": {
    "date": "2026-07-20",
    "evolution": [
      {
        "date": "2026-07-20",
        "title": "Documenting the Find That recall workflow"
      },
      {
        "date": "2026-09-08",
        "title": "Navigating threads and refining archive recall"
      }
    ],
    "sources": {
      "repo": "metaclaude",
      "files": [
        "skills/find-that/SKILL.md"
      ],
      "status": "current-archive-contract",
      "note": "The current FindThat skill defines this recall procedure. Its private search infrastructure is not connected to this portfolio."
    }
  },
  "memory-09": {
    "date": "2026-08-24",
    "evolution": [
      {
        "date": "2026-08-24",
        "title": "Using a prior session as context for a new investigation"
      },
      {
        "date": "2026-09-15",
        "title": "Same-Page context without reviving stale work"
      }
    ],
    "sources": {
      "repo": "metaclaude",
      "files": [
        "skills/same-page/SKILL.md"
      ],
      "status": "current-archive-contract",
      "note": "The current Same-Page skill defines analysis-only context loading and fresh verification before action."
    }
  },
  "workbench-01": {
    "date": "2025-12-17",
    "evolution": [
      {
        "date": "2025-12-17",
        "title": "Setting up a Claude Code configuration repository"
      },
      {
        "date": "2025-12-17",
        "title": "Initializing the shared Claude Code repository"
      }
    ],
    "sources": {
      "repo": "metaclaude",
      "files": [
        "CLAUDE.md",
        "settings.base.json",
        "skills/",
        "hooks/",
        "README.md"
      ],
      "status": "source-current",
      "note": "Portable configuration source inspected. Private repository links and machine-specific state are excluded."
    }
  },
  "workbench-02": {
    "date": "2026-09-19",
    "evolution": [
      {
        "date": "2026-09-19",
        "title": "Distributing the portable Codex setup"
      },
      {
        "date": "2026-09-30",
        "title": "Fixing Codex configuration drift"
      }
    ],
    "sources": {
      "repo": "metacodex",
      "files": [
        "README.md",
        "bin/metacodex",
        "config/config.base.toml",
        "config/hooks.json",
        "config/AGENTS.md"
      ],
      "status": "source-current",
      "note": "Tracked configuration and documentation inspected through the v1.0.6 release line. This explains the source contract rather than every machine’s installed state."
    }
  },
  "workbench-03": {
    "date": "2026-09-30",
    "evolution": [
      {
        "date": "2026-09-30",
        "title": "Repairing trust and configuration drift"
      },
      {
        "date": "2026-10-08",
        "title": "Porting model routing guidance to Codex"
      }
    ],
    "sources": {
      "repo": "metacodex",
      "files": [
        "bin/enforce-model-policy.py",
        "bin/codex-trust-everything",
        "config/hooks.json",
        "config/AGENTS.md"
      ],
      "status": "source-current",
      "note": "Guard and trust source inspected. Enforcement requires the corresponding installed and trusted hook."
    }
  },
  "workbench-04": {
    "date": "2026-10-05",
    "evolution": [
      {
        "date": "2026-10-05",
        "title": "Building browser tab groups for coding sessions"
      },
      {
        "date": "2026-10-05",
        "title": "From tab groups to a browser-to-agent bridge"
      },
      {
        "date": "2026-10-05",
        "title": "Rolling out Codex browser tab groups"
      }
    ],
    "sources": {
      "repo": "metaclaude and metacodex",
      "files": [
        "metaclaude/chrome/tab-groups-extension/",
        "metaclaude/chrome/",
        "metacodex/chrome/"
      ],
      "status": "source-current",
      "note": "Bridge source and October rollout records inspected. Current availability on individual machines has not been rechecked."
    }
  },
  "workbench-05": {
    "date": "2026-10-10",
    "evolution": [
      {
        "date": "2026-10-10",
        "title": "Adding human-only browser observer screenshots"
      },
      {
        "date": "2026-10-10",
        "title": "Verifying independent browser tabs"
      }
    ],
    "sources": {
      "repo": "metaclaude, claude-engine, panel-forge",
      "files": [
        "metaclaude/hooks/",
        "metaclaude/chrome/",
        "panel-forge resources for tool-card image display",
        "Chrome DevTools proxy/browser server"
      ],
      "status": "historical-shipped",
      "note": "October implementation and verification records support historical delivery. Supported engines, retention and mobile behavior need a current live check."
    }
  },
  "workbench-06": {
    "date": "2026-10-07",
    "evolution": [
      {
        "date": "2026-10-07",
        "title": "Building a reusable flow screenshot-to-PDF workflow"
      }
    ],
    "sources": {
      "repo": "metaclaude and metacodex",
      "files": [
        "metaclaude/skills/flow-screenshots-pdf/SKILL.md",
        "metaclaude/skills/flow-screenshots-pdf/template.html",
        "metacodex/skills/flow-screenshots-pdf/SKILL.md"
      ],
      "status": "source-current",
      "note": "Both workbenches contain the capture workflow. A PDF walkthrough documents visible states and still needs review."
    }
  },
  "workbench-07": {
    "date": "2026-09-18",
    "evolution": [
      {
        "date": "2026-09-18",
        "title": "Sharing a captain learning loop across runtimes"
      }
    ],
    "sources": {
      "repo": "forge/helm",
      "files": [
        "helm/README.md",
        "helm/protocol.md",
        "helm/rules/retro-loop.md",
        "helm/rules/handoff-lifecycle.md"
      ],
      "status": "source-current",
      "note": "Protocol source and September release records inspected. Historical installation is separate from current availability."
    }
  },
  "workbench-08": {
    "date": "2025-12-17",
    "evolution": [
      {
        "date": "2025-12-17",
        "title": "Building a versioned coding-assistant configuration"
      },
      {
        "date": "2026-07-20",
        "title": "FindThat archive recall skill"
      }
    ],
    "sources": {
      "repo": "metaclaude and metacodex",
      "files": [
        "metaclaude/skills/",
        "metacodex/skills/",
        "metacodex/README.md"
      ],
      "status": "source-current",
      "note": "Skill directories and shared-link documentation inspected. No claim about the number of installed skills is made."
    }
  },
  "workbench-09": {
    "date": "2026-09-19",
    "evolution": [
      {
        "date": "2026-09-19",
        "title": "Distributing a portable agent workbench"
      },
      {
        "date": "2026-10-03",
        "title": "Restoring post-push synchronization"
      }
    ],
    "sources": {
      "repo": "metaclaude, metacodex",
      "files": [
        "metacodex/bin/metacodex",
        "metacodex/README.md",
        "metaclaude/bin/",
        "metaclaude/README.md"
      ],
      "status": "source-current",
      "note": "Source documents managed synchronization and local state boundaries. Historical rollout is separate from a current deployment inventory."
    }
  },
  "workbench-10": {
    "date": "2025-12-18",
    "evolution": [
      {
        "date": "2025-12-18",
        "title": "Testing browser screenshots and GIF exports"
      },
      {
        "date": "2026-10-05",
        "title": "Building a browser-to-agent inbox bridge"
      }
    ],
    "sources": {
      "repo": "metaclaude and metacodex",
      "files": [
        "metaclaude/chrome/",
        "metaclaude/skills/flow-screenshots-pdf/",
        "metacodex/chrome/"
      ],
      "status": "source-current",
      "note": "Current bridge and capture source inspected. Earlier GIF experiments are not evidence of a current export feature."
    }
  }
};

export const featureEvidenceLabels: Record<FeatureEvidence, string> = {
  'source-current': 'Implementation inspected',
  'historical-shipped': 'Historical delivery checked',
  'current-archive-contract': 'Workflow inspected',
};

export const features: Feature[] = stories.map((story) => {
  const proof = metadata[story.id];
  if (!proof) throw new Error(`Feature ${story.id} needs source metadata before publication.`);
  return { ...story, area: story.id.startsWith('memory') ? 'Memory' : 'Workbench', ...proof };
});

export const featureBySlug = (slug: string) => features.find((feature) => feature.slug === slug);
export const formatFeatureDate = (date: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
