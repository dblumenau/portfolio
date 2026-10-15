# Listening Lab

This route uses actual Waveform and TimedView implementation from Saturation Listening at revision `5c925b1de588f1f668648774925d8cca5efbcf39`. Immutable original TSX text is retained under `vendor/source/`; deterministic compiled JavaScript is under `vendor/components/`. `provenance.json` records both hashes.

Run `node src/labs/listening/vendor/compile.mjs --check` to verify compiled output against retained source. The compiler uses the already-installed TypeScript dependency, ES2022/ESNext and automatic React JSX. This avoids a global Astro renderer/configuration change. React is manually mounted only by this route. Page hide unmounts the island and pauses its audio; a persisted page-show event remounts it for browser back/forward-cache restoration. Its distributed MIT notices, and Scheduler's notice, are in the curated lowercase `public/media/listening/` directory.

The adapter supplies one original fictional 39-word Danish fixture with AI-generated standard Cedar narration, fresh reviewed ASR timing estimates and real PCM-derived waveform peaks. Independent CPU medium ASR recovered 39/39 normalized source words, without a text prompt. A separate recorded-audio comparison matched 10/10 sampled source windows. These are content/routing observations, not alignment precision or learning outcomes. Three short-word timing overrides are declared in the public receipt.

The actual waveform owns selection, touch hold threshold, looping, clearing and zoom. It offers no controlled region API. The adapter's keyboard-accessible sentence button therefore dispatches an explicitly untrusted synthetic pointer sequence through those same handlers, enables the component’s own loop toggle when needed, then uses the actual audio element. Tests exercise it after zoom/resize, alongside ordinary trusted browser mouse/touch input. Synthetic helper events are never called trusted gestures.

The adapter scopes keyboard controls to its player, adds a native seek range and in-memory reading settings, and uses shared portfolio SVG paths. A small baseline ORP facade avoids importing corpus vocabulary/wordlist requests. Karaoke, guide and subtitle modes use the original timed-view functions. The original app server, database, corpus, credentials, progress, history, router, fonts and session APIs are excluded. No iframe, storage write or outbound mutation is used.

The curated public package includes only the original sample, two genuine recordings, two encoded genuine stills, ordered English action-caption files, a redacted receipt and source/library notices. Desktop footage contains actual synchronized browser output; touch footage is silent Chromium emulation at 390 × 844, without a physical-device claim. The full authored story is readable beside the player; action captions describe the recorded workflow without pretending the entire story plays continuously through seek/loop actions.

No subjective human listening, original PDF/SRT alignment accuracy, learner improvement, physical touch or native Safari result is claimed. AI-generated voice disclosure accompanies the interactive sample and the footage descriptions. No extra synthesis was performed for this integration.

## Separate study-plan check

The section after the listening recordings presents a saved actual local-app workflow with an explicitly unreleased callback-scope correction. Its history, question and duration metadata are fictional; no audio was played. It is separate from the retained playback component proof. The scoped new section pauses only its own optional recording on disclosure close/pagehide. See `../../showcases/listening-plan/PROVENANCE.md` and the public selected receipt.
