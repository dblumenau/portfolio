# Pencil Page timing replay

This exhibit selects recorded decisions from the unmodified Pencil Page Swift scheduler. It does not translate or recalculate that policy in JavaScript. `model.ts` formats the recorded states and adds explanatory copy; `controller.ts` selects a scenario and a recorded decision, then renders it.

## Executed source

- Revision: `07474bfebc6bd7411ead7ab91ee6a3feb66c4484` (`v0.0.1`).
- File: `App/Observe/ReviewScheduler.swift`.
- Scheduler SHA-256: `d21f2900bd5039dcbcef7cbc15e99c11355d6abed9269491750dd585b9dcb519`.
- Only extra fixture dependency: the exact `ReviewTrigger` enum excerpt from the same revision.
- Apple Swift 6.3.2 compiled the original source on macOS. The source checkout stayed clean before and after.
- Nine synthetic scenarios yielded 34 actual review/presentation decisions, all matching expected sequences.
- Eleven original extracted XCTest bodies from SchedulerTests and LedgerTests passed through a disposable SwiftPM target.

`execution.json` preserves all scenario events, source revision, source hash and scope from that run. Its added `verification` object summarizes the separately recorded successful source tests and tested boundary. The public `receipt.json` is identical to this curated execution file. Public `scenarios.json` is the original fictional input fixture, unchanged.

## Scope

Drawing changes and timestamps are fictional. Request begin, success, failure, note-shown transitions and response readiness are supplied events. Visible-note counts are fixture inputs. Evaluations happen at the selected input times. The fixture did not invoke any model, network, recognition, PencilKit, native presentation layout or app coordinator timer.

The ruled notebook is a crafted SVG illustration. Visible pen lines summarize the existence and amount of supplied writing, without depicting real handwriting or recognizing text. The note slot illustrates permission and placement. It contains no invented AI response. JavaScript navigation makes no live request.

Review permission and note presentation permission are shown separately. “Last review check” means the last recorded review decision, not a currently executing request. A permitted presentation means the policy permits it at that check; no native presentation is asserted.

## Separate native recording

`/media/pencil-page-workflow.mp4`, its approved WebP poster and VTT are reused. This authentic native iPad Simulator capture used synthetic PencilKit strokes, manual Review and actual Opus 5.5 feedback, follow-up, and card folding. It is a separate demonstration, not an automatic timing run end to end. Its existing approved provenance remains authoritative.

## Public asset boundary

Only the curated JSON receipt and fictional input fixture are new public files. They contain source hashes and clear boundary statements, with no machine paths, session identifiers, credentials, original source archive or raw test transcript. Source-test output and the SDK's decorative footer are private. The notebook SVG lives in authored component source rather than a captured-media file.
