import { lanes, recordFor, requestState, toolNames, type Lane } from './model';
function icon(kind: 'music' | 'arrow') { const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('width', '20'); svg.setAttribute('height', '20'); svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '1.6'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round'); svg.setAttribute('aria-hidden', 'true'); svg.classList.add('gl-icon'); const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', kind === 'music' ? 'M9 17V5l11-2v12M9 7l11-2M9 17c0 2-6 4-6 1s6-4 6-1Zm11-2c0 2-6 4-6 1s6-4 6-1Z' : 'M4 12h15m-6-6 6 6-6 6'); svg.append(path); return svg; }
const nativeCopy: Record<string, { title: string; copy: string }> = {
  'native-scout-profile': { title: 'Scout receives one native tool.', copy: 'The real profile lookup and MCP registration exposed list_conversations for user 101.' },
  'native-host-profile': { title: 'Host receives a different native tool.', copy: 'The same profile slug exposed get_personal_context for user 202. The lookup is per user.' },
  'native-scout-off-profile': { title: 'The guessed tool did not run.', copy: 'The actual MCP SDK returned isError: true and “Tool get_personal_context not found”. HTTP was 200; native data calls increased by zero.' },
  'native-unknown-profile-fallback': { title: 'An unknown name returned the master catalog.', copy: 'This is the current source contract. A profile URL is a curated surface; a typo does not create a restrictive permission policy.' },
  'native-outage-catalog-fallback': { title: 'The failed profile lookup returned the master catalog.', copy: 'The fictional permission service returned HTTP 503 for a fresh user. Profile discovery fell back to the master list.' },
  'native-outage-call-fails-closed': { title: 'Execution failed closed during the same outage.', copy: 'A fresh PermissionCache check denied the tool call with HTTP 403 / backend_unreachable. No native data handler ran.' },
};
export function initGateway(root: HTMLElement) {
  const get = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  let state = requestState(location.search);
  get('[data-fallback]').hidden = true;
  const set = (selector: string, text: string) => { get(selector).textContent = text; };
  function render() {
    const lane = lanes[state.lane];
    root.querySelectorAll<HTMLButtonElement>('[data-lane]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lane === state.lane)));
    set('[data-catalog-count]', `${toolNames(lane.catalog).length} ${state.lane === 'scout' ? 'tool' : 'tools'}`);
    get('[data-tools]').replaceChildren(...toolNames(lane.catalog).map(name => { const li = document.createElement('li'); const glyph = icon('music'); const code = document.createElement('code'); code.textContent = name; li.append(glyph, code); return li; }));
    get('[data-actions]').replaceChildren(...lane.actions.map(action => { const button = document.createElement('button'); button.type = 'button'; button.dataset.attempt = action.key; button.textContent = action.label; button.setAttribute('aria-pressed', String(state.action === action.key)); const arrow = icon('arrow'); button.append(arrow); return button; }));
    set('[data-auth-user]', lane.user); set('[data-claimed-user]', lane.other); set('[data-path-user]', `user ${lane.user}`);
    if (!state.action) {
      root.dataset.outcome = 'ready'; set('[data-result-badge]', 'Ready to replay'); set('[data-gate-result]', 'checks the request'); set('[data-path-backend]', 'fictional music');
      set('[data-result-title]', 'What should this task be able to do?'); set('[data-result-copy]', state.lane === 'scout' ? 'Find tracks, then try to add one. The second action is outside the Scout’s published tool set.' : 'Add a track, then try to change the volume. The volume tool is published, but user policy denies it.');
      ['[data-http]', '[data-forwarded]', '[data-backend-user]'].forEach(selector => set(selector, '—'));
      set('[data-inspect-label]', 'Choose an action first'); set('[data-record-path]', `/${lane.resource}/mcp`); set('[data-observed-duration]', 'Observed duration appears after a replay'); set('[data-request]', 'Choose an action to see its actual request.'); set('[data-response]', 'Choose an action to see its actual response.'); set('[data-counter-proof]', 'The local backend counted every tool call.'); return;
    }
    const record = recordFor(state.action); const forwarded = record.upstream_delta === 1; const policy = record.response.status === 403;
    root.dataset.outcome = forwarded ? 'forwarded' : 'denied';
    set('[data-result-badge]', forwarded ? 'Allowed · forwarded' : 'Denied · no forwarding'); set('[data-gate-result]', forwarded ? 'passed the checks' : policy ? 'user policy denied' : 'off-list tool denied'); set('[data-path-backend]', forwarded ? 'received one call' : 'received zero calls');
    set('[data-result-title]', forwarded ? state.lane === 'scout' ? 'The search reached the Scout’s account.' : 'The queue action reached the Host’s account.' : policy ? 'Published does not mean permitted.' : 'Guessing a tool name does not open the gate.');
    set('[data-result-copy]', forwarded ? `The fictional backend received one tool call for authenticated user ${lane.user}. The supplied user ${lane.other} did not change the account.` : policy ? 'set_volume was in the catalog. The user’s permission rule blocked it before the proxy reached the backend.' : 'queue_specific_song was outside this resource’s allowlist. The gateway returned a JSON-RPC -32602 error before contacting the backend.');
    set('[data-http]', `HTTP ${record.response.status}`); set('[data-forwarded]', `+${record.upstream_delta}`); set('[data-backend-user]', forwarded ? lane.user : 'No call');
    set('[data-inspect-label]', record.key); set('[data-record-path]', record.path); set('[data-observed-duration]', `${record.duration_ms} ms observed in the local run`); set('[data-request]', JSON.stringify({ headers: record.request_headers, body: record.request }, null, 2)); set('[data-response]', JSON.stringify(record.response.body, null, 2));
    set('[data-counter-proof]', `Fake upstream tool counter: ${record.counters_before.upstreamToolCalls} to ${record.counters_after.upstreamToolCalls}. ${forwarded ? 'One observed forwarding.' : 'No forwarding for this denied attempt.'}`);
  }
  function update(lane: Lane, action: string | null) { state = { lane, action }; const params = new URLSearchParams(); if (lane === 'host') params.set('task', lane); if (action) params.set('attempt', action); history.pushState({}, '', `${location.pathname}${params.size ? `?${params}` : ''}`); render(); if (action) { get<HTMLButtonElement>(`[data-attempt="${action}"]`).focus({ preventScroll: true }); if (matchMedia('(max-width: 760px)').matches) get('.gl-boundary').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }
  root.addEventListener('click', event => {
    const target = (event.target as Element).closest<HTMLButtonElement>('button'); if (!target) return;
    if (target.dataset.lane) update(target.dataset.lane as Lane, null);
    if (target.dataset.attempt) update(state.lane, target.dataset.attempt);
    if (target.dataset.native && nativeCopy[target.dataset.native]) {
      const key = target.dataset.native; const record = recordFor(key); const words = nativeCopy[key];
      root.querySelectorAll<HTMLButtonElement>('[data-native]').forEach(button => button.setAttribute('aria-pressed', String(button === target)));
      set('[data-native-title]', words.title); set('[data-native-copy]', words.copy);
      const catalog = toolNames(key); const payload = catalog.length ? { recorded_http_status: record.response.status, tools: catalog, native_data_calls: record.native_data_delta } : { recorded_http_status: record.response.status, response: record.response.body, native_data_calls: record.native_data_delta };
      set('[data-native-response]', JSON.stringify(payload, null, 2)); get('[data-native-response]').hidden = false;
    }
  });
  window.addEventListener('popstate', () => { state = requestState(location.search); render(); });
  render();
}
