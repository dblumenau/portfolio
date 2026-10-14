# Verification and public media

Run `npm run verify` before creating a release. The browser tests cover the home page and all six case studies at phone, tablet and desktop sizes. They check image decoding, document overflow, page errors and automated WCAG A/AA rules. Separate flows cover the mobile menu, navigation, keyboard controls, architecture and workbench tabs, dialog focus/escape, reduced motion, video playback, loaded captions and the missing-page route. Conference tests open the source drawer, enlarge its capture and verify the downloaded PowerPoint and PDF against their reviewed hashes. The Kitforge output test decodes the actual 1080-pixel export.

The feature atlas suite checks every story route, combined filters, URL state, empty results and native disclosure controls. The memory lab suite exercises the exported sample, unknown and versioned labels, reversible curation, recorded before-state restoration, pagination, keyboard controls and its readable view without JavaScript.

The release explorer suite checks researched source coverage, inclusive date filters, marker focus, combined filters, invalid dates, lazy inventory loading, safe filtered downloads and the complete readable story without JavaScript. Responsive checks exercise its inventory and inspect marker overlap.

Forge World uses real WebGL in the browser suite with Chromium’s software renderer. Tests cover all six districts across screen sizes, canvas raycasting, deep links and browser history, resize, the guided route, actual recording playback/captions, touch rotation and pinch, and readable alternatives when WebGL or JavaScript is unavailable. Software-renderer results establish behavior and rendering; they do not measure hardware frame rate.

The static audit checks generated routes and anchors, referenced local assets, responsive image candidates, canonical/social metadata, complete sitemap coverage, recording controls/captions, approved public media names and accidental private/source files in the web root. Every planned screenshot, video and caption file is mandatory even when a component could hide unavailable media. Every curated media file and downloadable artifact must have a provenance record whose SHA-256 and byte length match the deployed file. `ffprobe` verifies MP4 decoding metadata and H.264 video streams; `exiftool` rejects public image GPS tags. Caption intervals must stay within their paired recording. Dependency licenses must be present in the public build. Reviewed local search/filter forms are allowed; external actions, mutation methods and embedded remote pages are rejected.

```sh
PORTFOLIO_AUDIT_REPORT=/private/path/static-audit.json npm run audit -- --external
```

The optional remote check sends HEAD requests to public links. Blocked or unsupported requests need a real-browser review because a service may reject automated clients or HEAD requests. Network failures are recorded for review. Route and asset failures always stop the local gate.

Playwright saves failure traces and screenshots under a separate `test-results/run-PID/` directory for each runner, with its HTML report under `playwright-report/run-PID/`. Concurrent local suites therefore keep their artifacts independent. `PORTFOLIO_TEST_ARTIFACTS` selects another private output directory. `npm audit` checks the locked JavaScript dependency tree separately.

After a build, `npm run test:deployment` checks the Docker/Compose package in an isolated container on a dynamically assigned localhost port. It exercises real nginx routing, redirects, 404 status, file permissions, video byte ranges, caption MIME type and isolation of source/private files. Add `-- --browser` to run the browser suite against that nginx container too; the release package command requires this. Set `PORTFOLIO_DEPLOYMENT_REPORT` for a JSON evidence file. `PORTFOLIO_BROWSER_REPORT` selects the browser suite’s JSON evidence path.

Public files belong in `public/`; raw captures, research, credentials and private verification evidence belong outside the repository. `scripts/audit-static.mjs` contains the curated media allowlist. When adding a capture, review the complete image or video for personal content, add its filename to the allowlist, provide descriptive text and captions, and record the capture provenance in `public/media/media-provenance.json`. Inspect video frames and the actual playback, including transitions and any hidden UI that opens during the flow.

Automated checks complement visual and editorial review. They cannot decide whether a recording is safe to publish, confirm a historical claim, or assess the quality of an image crop. Review those before marking the site ready to publish.
