import type { CaseStudy } from './projects';

export const conferenceCaseStudy: CaseStudy = {
  slug: 'conference-notes', number: '06', name: 'Conference Notes',
  category: 'A mobile notebook + organiser insight',
  context: 'Demonstrated with fictional conference data',
  title: 'Keep the ideas after the room empties.',
  intro: 'A conference notebook that carries a participant’s notes into an organiser’s review and an editable presentation. Writing works through a connection loss, and a generated theme keeps a path back to the notes behind it.',
  premise: 'The useful part starts after the talk.',
  problem: [
    'A conference produces more than a set of slides. People leave with questions, suggestions and ideas that are easy to lose between the session and the follow-up meeting. I built a notebook around that journey: capture a takeaway, find the recurring themes, and bring the material into the next discussion.',
    'The attendee view has a short agenda and one place to write for each session. The organiser view brings together participation, searchable responses and an optional analysis. A theme can be opened to reveal its supporting notes before it reaches the presentation.',
    'The details matter in a room full of phones. An interrupted connection should not discard a draft. Finishing a response offline should be a clear state. And the exported deck needs editable text, tables and charts so the organiser can make it their own.',
  ],
  workflow: [
    { title: 'Write while the idea is fresh', description: 'Choose a session and start writing. Each edit reaches device storage before the network request; a visible save status explains where the draft is held.' },
    { title: 'Keep going offline', description: 'A local outbox queues the draft and finalisation. When the connection returns, the notebook synchronises the response. Finalised notes can be reopened for further edits.' },
    { title: 'Read the notes behind a theme', description: 'Organisers review participation and responses, then inspect an analysis with source-note links. Support counts are recalculated from validated citations; interpretation stays distinct from quoted material.' },
    { title: 'Take an editable result away', description: 'Select the presentation sections and download a PowerPoint. The output retains native text, tables and charts for the follow-up meeting.' },
  ],
  decisions: [
    { title: 'Store the edit before sending it', description: 'The device keeps the draft and retries queued changes. Monotonic edit timestamps handle a clock moving backwards; version history preserves rejected stale writes for recovery.' },
    { title: 'Keep collection independent of analysis', description: 'A Cloudflare Worker and Durable Object collect the notes. A separate processor handles queued analysis, so an unavailable model processor can delay insights without stopping note-taking.' },
    { title: 'Make the interpretation inspectable', description: 'Analysis receives note text and role context without attendee names or email addresses. Validated source references let an organiser inspect the evidence and decide what deserves a place in the deck.' },
  ],
  releases: [
    { kind: 'Minor', version: 'v0.1.0', date: 'September 2026', title: 'Keep the edit that arrived late', description: 'Stale writes gained retained history and monotonic edit times, addressing a race found while testing offline finalisation.', project: 'Conference Notes' },
    { kind: 'Major', version: 'v1.0.0', date: 'October 2026', title: 'Give note collection its own home', description: 'Conference collection moved to Cloudflare with a separate analysis processor. Capturing and exporting responses no longer depended on the model-processing host.', project: 'Conference Notes' },
    { kind: 'Patch', version: 'v1.1.1', date: 'October 2026', title: 'Let a filter fit on a small phone', description: 'Attendee filter chips wrap as whole pills on narrow screens. This tagged source is the version used for the captured demonstration.', project: 'Conference Notes' },
  ],
  current: 'The captures show an isolated run of the real v1.1.1 application with fictional attendees and notes. The actual Claude subscription pipeline analysed 27 notes from 12 fictional attendees across three invented sessions. The recording reviews that completed analysis, then downloads a presentation. Counts shown here describe the demonstration, not a real event.',
  evidence: 'The original September 2026 build conversation establishes the notebook-to-presentation workflow. Source tags verify the collection split, retained write history and small-phone refinement. This demonstration independently exercised Chromium, an emulated phone viewport, offline finalisation, real analysis and the PowerPoint export; 49 existing API, analysis and deck tests passed. It does not establish current production deployment or physical Safari behavior.',
  stack: ['Vue 3', 'Hono', 'Cloudflare Workers', 'Durable Object SQLite', 'Claude CLI', 'PowerPoint'],
  image: '/media/conference-notes.webp',
  imageAlt: 'Organiser participation dashboard in Conference Notes, showing fictional attendees, completion by session and recent activity.',
  imageCaption: 'The actual application with fictional conference data. Desktop shows the organiser view; phone shows an attendee’s saved note.',
  video: '/media/conference-notes-workflow.mp4',
  captions: '/media/conference-notes-workflow.vtt',
  videoDescription: 'An attendee writes a response, finalises it offline and reconnects. The organiser reviews participation, searches responses, opens the source notes behind a completed analysis and downloads an editable PowerPoint. Analysis was completed before recording.',
  mediaCaption: 'Fictional conference data · actual application and Claude analysis · real-time recording',
};
