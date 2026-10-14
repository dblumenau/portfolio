# Gateway Lab

The interactive exhibit replays an actual isolated gateway execution, recorded on 14 October 2026. It does not run a gateway or send a provider request in the visitor's browser.

## Executed source

`dblumenau/panelforge-mcp`, commit `40185b05486ff5c3ed8c6b1ff6f7653851f4080c`, tagged `v5.11.24`, exported with `git archive` into a private fixture. The production/source checkout was read only. TypeScript compiled the archived source; the complete archived `dist/server.js` entrypoint ran with a fake configuration. Six relevant source files were independently hashed and compared with the committed blobs.

The actual gateway executed its Express routing, Sanctum verifier and dispatch, MCP SDK bearer middleware, resource-scope middleware, PermissionCache, metering middleware, proxy catalog/call allowlist, user metadata injection, and native MCP profile registration/tool handlers.

## Substituted services

A separate loopback HTTP fixture supplied fictional Sanctum verification answers, users 101/202/303, permission rules/profiles/budget snapshots, native data responses, music MCP tool responses, and usage ingestion. The gateway's service key and bearer values were fabricated for this run. No Redis was needed. No production catalog, OAuth login, provider credential, external operation, real user data or notification delivery was used.

The gateway used an explicit method/origin/path fetch allowlist restricted to the local fixture. Its process environment was constructed from PATH and fake fixture values; ambient credentials were excluded. Recorded network requests stayed on this allowlist. The child exited 0 and the owned HTTP fixture shut down after execution.

## Observed boundaries

17 HTTP/MCP requests were asserted. The Scout's `search` reached the fictional backend; off-list `queue_specific_song` returned JSON-RPC -32602 with zero forwarding. The Host's queue action reached the backend; published `set_volume` was denied by per-user policy with HTTP 403 and zero forwarding. A caller with the wrong resource scope received HTTP 403. Both allowed calls carried the authenticated user ID despite supplying the other fictional user's `_meta.user_id`; the Scout also supplied a spoofed `X-MCP-User-Id` header. Caller bearer tokens were absent at the fake upstream.

Native `/mcp/task` listed different tools for users 101 and 202. Allowed actual handlers called the fictional native API. An off-profile call returned HTTP 200 with MCP `isError: true` and no data call. The empty profile's `tools/list` returned -32601 (no tools capability was registered). An unknown profile fell back to the master catalog. A failed fresh profile lookup also fell back; the subsequent failed fresh permission lookup denied execution with HTTP 403 / `backend_unreachable`. These native profiles curate the catalog; they do not constitute an independent fail-closed permission policy.

65 existing source tests passed across six relevant suites. The exhibit has separate browser tests covering action results, URL state, native fallback disclosure, focus retention, responsive overflow, axe checks and absence of live POST requests.

## Public evidence

`execution.json` is a compact derivative of the raw private receipt: catalog responses retain actual tool names but omit verbose descriptions/schemas. The public `/media/gateway/receipt.json` preserves recorded tool-call response bodies and counters. Catalog responses are shortened to actual tool names and include raw-response SHA-256 values; complete raw catalogs remain in the private receipt. Ephemeral origins are replaced with reserved `gateway.fixture.invalid` and `services.fixture.invalid` domains; fictional bearer strings in request headers use descriptive labels. No status, result or counter was invented.

The 9.04-second MP4 is an actual Playwright Chromium recording of the interactive exhibit replaying those results. Browser action dwell times are editorial; they do not represent original gateway duration. The initial 0.7 seconds were trimmed. The poster is a frame from that recording. `gateway-boundary.png` is an actual element screenshot of the exhibit. The film, poster and UI state explicitly identify the interaction as a replay.

OAuth issuance/consent/introspection, real Spotify credential lookup and operations, native engine/client permission systems, batch identity isolation, profile editing and cache-refresh timing were not tested.
