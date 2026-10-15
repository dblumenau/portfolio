# David Blumenau’s portfolio

A static Astro site with six case studies, a Three.js world, 30 feature stories, twelve interactive labs and a release explorer. The labs explore memory, configuration, recovery, browser graphics, gateway boundaries, preserved conversation branches, native questions, terminal-to-Mac Attention, notebook timing, Danish listening, archive reconstruction and audited graph edits. Inside the World, visitors can carry a recorded Attention answer, make two real PNG prints in the Small Edition Press, or compare three historical names and download a source evidence card. The voice feature also runs PanelForge’s retained ordered audio queue behind an explicit Listen action. A 78-second homepage film introduces the work. Product screenshots, captioned recordings and inspectable execution receipts accompany the stories. nginx serves the production build; browser interactions run without an application server.

The Workspace feature shows a real isolated move and reload with fictional data and a disclosed unreleased destination-dialog fix. Its public derivatives hide the image identifier; native captions, an HTML text alternative and an after-move phone tree keep the story readable. The concise receipt separates persisted-row/file checks from mocked client UI tests.

The footer offers a six-page selected-work PDF. It is a curated artifact from source checkpoint `a75d722`, with reviewed product captures, embedded fonts and links back to the site. Site builds retain its exact bytes; a revised edition needs a new review and updated `public/sample-files/sample-provenance.json`.

Use Node 22.12 or newer, npm, ffprobe and exiftool for the media audit.

```sh
npm ci
npx playwright install chromium
npm run dev
```

The development site runs on port 4321. To check the complete production build:

```sh
npm run verify
```

This checks the retained Listening and Audio Intent source against their deterministic compiled outputs, runs Astro diagnostics, builds static routes, audits links/assets/public media and runs Playwright at phone, tablet and desktop sizes. The browser suite includes WCAG checks through axe, keyboard navigation, architecture tabs, image dialogs and real video playback/captions. It starts its own preview on port 4322. Use `PORTFOLIO_TEST_URL` to test another local server instead.

For concurrent verification, build to a private directory with `npm run build -- --outDir /private/build`, then set `PORTFOLIO_DIST_ROOT=/private/build` for the audit, browser preview and Docker smoke scripts. `PORTFOLIO_PREVIEW_PORT` selects an available local preview port. Default behavior remains `dist/` on port 4322.

Create a reviewed deployment bundle with:

```sh
npm run package:release -- /path/to/private/release-output
```

The command repeats verification and produces a compressed static package with a SHA-256 sidecar and release metadata. It records whether the source includes uncommitted work. Reports and release bundles stay outside the served `dist/` directory.

The release command also requires Docker and runs `npm run test:deployment`: an isolated read-only nginx container checks static routes, redirects, 404s, headers, image permissions, video ranges and captions. The test removes its own container and temporary image afterward.

[Publishing and rollback](docs/publishing.md) describes the Docker package and the existing Hetzner routing. [Verification and media review](docs/verification.md) describes the local release gate.

Interface icons are SVGs from `src/components/Icon.astro` and `src/ui/icons.ts`. Use those for arrows, controls and decorative marks; do not add emoji or text glyphs as interface icons.

The existing Grounded Analysis feature presents actual saved extraction from an authored fictional transcript. `src/showcases/grounded-analysis/` records the selection, source-navigation edit and limits; semantic review is editorial and saved output is unchanged.
