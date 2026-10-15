# Archive Lab

The first exhibit replays an actual isolated Photo Archive CLI execution recorded on 15 October 2026. The second section is a separate visitor-side Web Crypto illustration that verifies three synthetic PNG files and can change one byte in a temporary memory copy. Neither section invokes an archive backend.

## Executed source and inputs

Photo Archive revision `7ecfaf029f48a41323e42f80e6f2fe238e99d60a` was exported with an explicit 23-file committed-code/test/configuration allowlist. The original checkout stayed clean and unchanged. The public receipt identifies and hashes the four relevant CLI, staging, storage and index source files.

Three deterministic 640 × 400 PNG color studies were generated from code-native RGB formulas. The files contain PNG header, pixel data and end chunks only. No real photographs, EXIF, faces, GPS, library identifiers, user files, production rows or existing catalog were used. Minimal input JSONs contain generated `DE...` identifiers and synthetic filenames.

The actual unchanged Typer CLI ran through a guarded Python launcher. It initialized a fresh volume, refused the existing volume, staged each supplied original, verified the archive, and rebuilt SQLite at an explicit `--destination`. The driver removed only that exact disposable index and rebuilt it from the same manifests. All roots, fixture paths, metadata paths, index destinations and temporary paths were explicit. Bubblewrap hid the original home/real-volume trees and isolated the network namespace. Full private stdout, stderr, syscall traces, test attempts, source archives and receipts remain outside the public repository.

## Observed results

Both indexes contain 3 assets, 3 original resources, 3 metadata resources and 3 synthetic identity rows. Both integrity checks return `ok`; all database rows match. Every original source/archived PNG matches its recorded SHA-256 and size. The 13 canonical files—3 PNGs, 3 metadata JSONs, 3 manifests, 3 event ledgers and 1 volume sentinel—retain identical hashes and lengths. Six narrow, existing source tests pass.

Staging retains the supplied metadata JSON as a second hashed resource, so the earlier feasibility note's three-total-resources expectation was corrected to three originals / six total resources. The optional index destination is a Typer `--destination` option: the positional sample returns exit 2 before creating the database. Existing-volume initialization returns exit 1 with `FileExistsError` and leaves the volume unchanged. These are observations from unmodified source, not isolated source patches.

Two pytest setup attempts encountered the sandbox's read-only device restriction. Disabling pytest capture and logging let the same six tests pass. A browser recording attempt encountered Chromium's Unix socket path limit before loading the page; the installed headless shell recorded successfully. Setup and failure records are retained privately.

## Public derivatives and redaction

`execution.json` and `/media/archive/receipt.json` are identical curated derivatives. Disposable data-root prefixes are consistently replaced with `$DEMO_ROOT`. Commands use the `photo-archive` entrypoint name; the invocation disclosure identifies the actual guarded Python launcher. Successful stdout is retained exactly apart from that path substitution. Expected refusal messages are explicitly labeled exact-text excerpts, with private stack traces and wrapped paths omitted. Raw private stdout/stderr SHA-256 values identify the complete retained records. The public transcript follows the same policy.

The receipt retains before/after canonical file identities, source hashes, initial/rebuilt SQLite rows, index-removal identity, synthetic fixture hashes, invocation timings and scope. It contains no private absolute path. The nine public media files are explicitly curated; full source exports, runtime dependency copies and raw private traces are excluded.

`archive-boundary.png` is an actual element screenshot of this integrated exhibit in its rebuilt recorded state. `recorded-replay.mp4` is a 17.68-second recording of the earlier private static prototype replaying saved results, transcoded to H.264. Its commands ran before filming. It is not live CLI footage, and its display pacing is editorial. `replay-poster.png` is a full-page screenshot of that earlier private prototype's rebuilt state; the film retains that prototype's private-preview label. English WebVTT and a complete text transcript provide text alternatives.

## Visitor-side illustration

The browser fetches only the three hosted PNG files through same-origin static GET requests and calculates SHA-256 with Web Crypto. It compares both byte count and digest with the recorded originals. Its optional edit copies the original buffers, toggles the first byte of one memory copy, then hashes all three copies again. Restoring the copied bytes recreates unmodified copies. It never modifies hosted files or downloaded originals, sends an upload, contacts an archive service, or writes application state to browser storage. Fetch errors and unavailable Web Crypto produce a readable fallback. Recorded results, source hashes, downloads and full command evidence remain readable without JavaScript.

The run proves storage/index reconstruction only. It does not demonstrate physical backup redundancy, long-term durability, Apple Photos behavior, real archive safety, enrichment or machine-learning results.
