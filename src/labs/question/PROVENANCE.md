# Question Lab

The exhibit replays a completed private native execution. It starts no engine, model, notification, API action or storage-backed task. The controls choose recorded story panels and seek the actual film to visually inspected moments. Only the recorded Quick setup answer has a result; More customization is an inert description of the other option shown by the original question.

## Actual execution

- Claude Engine source: bf89abc1646bd12133a0f22bc2d51f3286813250.
- Native app base: 48d380467d270c6f5fb10cbfd68923985a973c3b plus the explicitly unreleased isolated Claude-only answer-key correction.
- iPhone 17 Pro Simulator, iOS 26.5, Xcode 26.5, macOS 26.7.1.
- Actual subscription inference through Claude Agent SDK 0.2.164 and its bundled CLI, reported model claude-haiku-5-5.
- Original invocation began 2026-10-14T23:08:56.026370Z, 15 October in Copenhagen.
- One built-in AskUserQuestion call. An automated XCUITest participant selected Quick setup in the actual native card and sent it.
- Question +2.075 s, native answer +10.727 s, original done +12.551 s.
- Matching original request, stream and tool-use identities were checked privately. Actual tool_result confirms Quick setup; 25 text events followed the answer; final text is 232 characters.
- Final native checks: 2 passed, 0 failed. One expected failing answer-map regression and the first real unsuccessful header-key run are preserved privately.

The original native card, chat controller, SSE decoder and response API ran. A minimal local PanelForge API compatibility shim forwarded original SSE bytes and the native response body unchanged to original Claude Engine handlers. It supplied a fictional conversation and token, retained actual completion text in a synthetic transcript and emitted a saved event for normal native reconciliation. Laravel persistence, ownership checks, deployed routing and production health were not exercised.

The model had only the actual built-in question tool, no other action tools, no MCP configuration, no settings sources or plugins. No action described by the final plan was performed. No APNs, Attention, email, push or outreach ran.

## The unreleased correction

The first native run sent a header-keyed answer map. HTTP returned answered, while the actual built-in tool reported that the user did not answer. The installed CLI schema defines answers by full question text. A focused regression failed with the incorrect map, then passed with the isolated correction. That correction applies only to the Claude chat provider; existing non-Claude serialization was preserved. Native Codex, voice, macOS, multi-select and reconnect behavior were not validated.

This is a successful isolated corrected build, not proof of an unmodified released native client. All original repositories/authentication and production endpoints were preserved; the native patch was not released.

## Public receipt

execution.json and /media/question/receipt.json contain the same sanitized recorded execution. ui_selection represents the visible card state under header Priority. It is explicitly distinct from native_answer_payload, the ACTUAL captured native POST with opaque request_id omitted. The answers map is keyed by the full question text and was verified against the private captured request. Equality-check flags are retained; opaque request, stream, session and tool identities are absent.

The task, original question/options, actual tool result and final plan are fictional workshop content. No synthetic model answer or More customization outcome is provided. The public receipt retains original captured artifact filenames/hashes; the delivery assets use the shorter question/ paths listed below.

## Authentic media

- /media/question/execution.mp4: continuous original-speed segment of actual simctl recording, 720 x 1566, 30 fps, encoded duration 22.133333 s. The first playable encoded frame begins at 0.433008 s; replay reset seeks that measured frame rather than assuming a PTS-zero frame exists.
- /media/question/execution.vtt: four accurate English cues. The first discloses the Simulator, local shim and unreleased answer-key correction; another identifies the automated participant. Last cue ends at 22.133 s, within encoded duration. Maximum density is 2.222 words per second.
- /media/question/question.png, selected.png, completed.png: actual untouched full-resolution 1206 x 2622 XCTest screenshots. CSS previews crop the pixels for readability; links expose each full-size original. No native screen is recreated.
- /media/question/receipt.json: sanitized causal receipt and boundaries.

Nearby disclosures identify Simulator / automated participant / local API shim / unreleased Claude-only correction. Generic prose/text alongside the media makes the actual result readable at 390 px without pretending to be another native screenshot. The video, text alternative, original still links and recorded outcome remain available without JavaScript.

Only the six curated media files above are public. Raw recordings/SSE, original identities, Xcode bundles, private failures, authentication diagnostics and desktop captures remain outside the site. The public media bytes match the original reviewed capture hashes. No authored emoji; icons use the shared SVG system.

## Verification

Focused Chromium checks cover replay and reset, same recorded outcome, only static GETs to the local origin, zero storage, exact actual payload and causal receipt, reviewed media bytes, responsive overflow and axe checks at 390/821/1440 px, keyboard operation, decoding/playback/seeking/caption limits and no-JavaScript access.

The initial browser reset assertion assumed timestamp zero; the authentic encoding starts at 0.433008 s. It was corrected against ffprobe and actual browser playback, preserving the original film. The final checks use that measured first frame. Private build/report/captures and the initial failure remain under previews/native-question/site-verification in the portfolio project evidence tree.

Final private check: Astro check reported zero errors/warnings and three existing vendor hints; the 51-page build completed into the owned outDir; all eight focused browser tests passed. Six public media hashes and the exact native payload were independently rechecked. Actual viewport screenshots were also inspected. Tall Chromium QA screenshots suppress only the unfocused offscreen skip link, which Chromium otherwise paints inside capture-beyond-viewport output; this temporary screenshot style does not change the application, keyboard behavior or any native capture.
