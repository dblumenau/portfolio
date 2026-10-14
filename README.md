# David Blumenau’s portfolio

A static Astro site with product screenshots, captioned recordings, keyboard-accessible architecture diagrams and three case studies. nginx serves the production build; browser interactions run without an application server.

Use Node 22.12 or newer, npm, and ffprobe for the media audit.

```sh
npm ci
npx playwright install chromium
npm run dev
```

The development site runs on port 4321. To check the complete production build:

```sh
npm run verify
```

This runs Astro diagnostics, builds static routes, audits links/assets/public media and runs Playwright at phone, tablet and desktop sizes. The browser suite includes WCAG checks through axe, keyboard navigation, architecture tabs, image dialogs and real video playback/captions. It starts its own preview on port 4322. Use `PORTFOLIO_TEST_URL` to test another local server instead.

Create a reviewed deployment bundle with:

```sh
npm run package:release -- /path/to/private/release-output
```

The command repeats verification and produces a compressed static package with a SHA-256 sidecar and release metadata. It records whether the source includes uncommitted work. Reports and release bundles stay outside the served `dist/` directory.

The release command also requires Docker and runs `npm run test:deployment`: an isolated read-only nginx container checks static routes, redirects, 404s, headers, image permissions, video ranges and captions. The test removes its own container and temporary image afterward.

[Publishing and rollback](docs/publishing.md) describes the Docker package and the existing Hetzner routing. [Verification and media review](docs/verification.md) describes the local release gate.
