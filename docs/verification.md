# Verification and public media

Run `npm run verify` before creating a release. The browser tests cover the home page and all case studies at 390 × 844, 768 × 1024 and 1440 × 1000. They check image decoding, document overflow, page errors and automated WCAG A/AA rules. Separate flows cover navigation, keyboard controls, dialog focus/escape, reduced motion, video playback, loaded captions and the missing-page route.

The static audit checks generated routes and anchors, referenced local assets, canonical URLs, recording controls/captions, approved public media names and accidental private/source files in the web root. Every planned screenshot, video and caption file is mandatory even when a component could hide unavailable media. `ffprobe` verifies MP4 decoding metadata and H.264 video streams.

```sh
PORTFOLIO_AUDIT_REPORT=/private/path/static-audit.json npm run audit -- --external
```

The optional remote check sends HEAD requests to public links. Blocked or unsupported requests need a real-browser review because a service may reject automated clients or HEAD requests. Network failures are recorded for review. Route and asset failures always stop the local gate.

Playwright saves failure traces and screenshots under `test-results/`, with an HTML report under `playwright-report/`. Both are private build outputs. `npm audit` checks the locked JavaScript dependency tree separately.

After a build, `npm run test:deployment` checks the Docker/Compose package in an isolated container on a dynamically assigned localhost port. It exercises real nginx routing, redirects, 404 status, file permissions, video byte ranges, caption MIME type and isolation of source/private files. Add `-- --browser` to run the browser suite against that nginx container too; the release package command requires this. Set `PORTFOLIO_DEPLOYMENT_REPORT` for a JSON evidence file. `PORTFOLIO_BROWSER_REPORT` selects the browser suite’s JSON evidence path.

Public files belong in `public/`; raw captures, research, credentials and private verification evidence belong outside the repository. `scripts/audit-static.mjs` contains the curated media allowlist. When adding a capture, review the complete image or video for personal content, add its filename to the allowlist, provide descriptive text and captions, and record the capture provenance in `public/media/media-provenance.json`. Inspect video frames and the actual playback, including transitions and any hidden UI that opens during the flow.

Automated checks complement visual and editorial review. They cannot decide whether a recording is safe to publish, confirm a historical claim, or assess the quality of an image crop. Review those before marking the site ready to publish.
