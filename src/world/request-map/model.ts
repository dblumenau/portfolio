import { execution, lanes, recordFor, toolNames } from '../../labs/gateway/model';

export const caseDefinitions = [
  { key: 'host-volume-policy-denied', question: 'Why did a listed tool not run?', catalog: 'host-catalog' },
  { key: 'scout-queue-denied', question: 'Can guessing another tool bypass the list?', catalog: 'scout-catalog' },
  { key: 'wrong-resource-scope', question: 'Does a recognized caller automatically reach this resource?', catalog: null },
  { key: 'scout-search', question: 'Can the request choose another account?', catalog: 'scout-catalog' },
] as const;
export type CaseKey = typeof caseDefinitions[number]['key'];
export const fields = [{ key: 'caller', label: 'Caller' }, { key: 'resource', label: 'Resource access' }, { key: 'policy', label: 'Tool list / policy' }] as const;
export type EvidenceField = typeof fields[number]['key'];
export const boundary = 'Recorded gateway result. Fictional local services. This desk builds a diagram; it sends no request.';
export const aliasNote = 'Scout, Host and Limited caller are display aliases for this fixture, not real account names.';
export const artifactBoundary = 'Real gateway code. Fictional supporting services. Recorded outcome. This diagram performs no request.';
export const source = { tag: execution.source.tag, date: execution.executed_at.slice(0, 10), route: '/labs/gateway/' };
export type SafeCase = {
  key: CaseKey; question: string; caller: string; resource: string; tool: string;
  http: number; rpcError: number | null; errorCode: string | null; errorMessage: string | null;
  catalog: { key: string; tools: string[] } | null; upstreamToolCalls: number;
  backendIdentity: string; identityRelation: string; status: string; outcome: string;
  evidence: Record<EvidenceField, string[]>;
};
type CallRequest = { params?: { name?: string; _meta?: { user_id?: string } } };
type CallResponse = { error?: string | { code?: number; message?: string }; error_description?: string; result?: { structuredContent?: { user_id?: string; fixture?: boolean } } };
export function projectCase(key: CaseKey): SafeCase {
  const definition = caseDefinitions.find(item => item.key === key);
  if (!definition) throw new Error('Only the four approved proxy call records can be mapped.');
  const record = recordFor(key), request = record.request as CallRequest, response = record.response.body as CallResponse;
  const tool = request.params?.name ?? 'Tool not recorded';
  const caller = record.identity === 'scout' ? 'Scout' : record.identity === 'host' ? 'Host' : record.identity === 'limited' ? 'Limited caller' : 'Unspecified fixture role';
  const resource = record.path === '/room-host/mcp' ? 'Room Host' : record.path === '/soundtrack-scout/mcp' ? 'Soundtrack Scout' : 'Unspecified fixture resource';
  const catalog = definition.catalog && recordFor(definition.catalog).identity === record.identity ? { key: definition.catalog, tools: toolNames(definition.catalog) } : null;
  const rpcError = typeof response.error === 'object' && typeof response.error?.code === 'number' ? response.error.code : null;
  const errorCode = typeof response.error === 'string' ? response.error : null;
  const errorMessage = typeof response.error === 'object' ? response.error?.message ?? null : response.error_description ?? null;
  const upstreamToolCalls = record.upstream_delta;
  const headers = record.request_headers as Record<string, string>;
  const overwriteObserved = key === 'scout-search' && record.identity === 'scout' && upstreamToolCalls === 1 && request.params?._meta?.user_id === lanes.scout.other && headers['x-mcp-user-id'] === lanes.scout.other && response.result?.structuredContent?.fixture === true && response.result.structuredContent.user_id === lanes.scout.user;
  const backendIdentity = upstreamToolCalls === 0 ? 'No forwarded call' : overwriteObserved ? 'Authenticated Scout' : 'Not established by this case';
  const identityRelation = overwriteObserved ? 'Supplied claim: another fixture role; observed backend identity: authenticated Scout' : upstreamToolCalls === 0 ? 'No forwarded call; no backend identity was observed for this request.' : 'A forwarded call was counted; its identity conclusion is not established by this case.';
  const status = `HTTP ${record.response.status}${rpcError !== null ? ` / JSON-RPC ${rpcError}` : errorCode ? ` / ${errorCode}` : ''}`;
  const outcome = upstreamToolCalls === 1 ? 'One tool call forwarded' : catalog?.tools.includes(tool) && errorCode === 'access_denied' ? 'Listed tool. Policy denied.' : rpcError !== null ? 'HTTP 200. Tool call denied.' : 'Resource access denied.';
  const menu = catalog ? `Recorded catalog ${catalog.key}: ${catalog.tools.join(', ')}.` : 'Tool visibility: not established by this case. No catalog was recorded for this caller/resource pair.';
  const evidence: Record<EvidenceField, string[]> = {
    caller: [`Fixture caller alias: ${caller}.`, identityRelation + (identityRelation.endsWith('.') ? '' : '.'), aliasNote],
    resource: errorCode === 'insufficient_scope' ? [`Recorded resource: ${resource}.`, `${status}: ${errorMessage}.`, 'This is the recorded resource denial. No separate tool-policy verdict is established.'] : [`Recorded resource: ${resource}.`, 'A separate scope pass/fail event is not recorded.', `${upstreamToolCalls} upstream tool ${upstreamToolCalls === 1 ? 'call was' : 'calls were'} observed for this request.`],
    policy: [menu, ...(catalog ? [catalog.tools.includes(tool) ? `${tool} appears in that recorded list.` : `${tool} does not appear in that recorded list.`] : []), errorMessage ? `${status}: ${errorMessage}` : `${status}. One upstream tool call was observed; this does not establish permission for other tools.`],
  };
  return { key, question: definition.question, caller, resource, tool, http: record.response.status, rpcError, errorCode, errorMessage, catalog, upstreamToolCalls, backendIdentity, identityRelation, status, outcome, evidence };
}
export function caseForHash(hash: string): CaseKey | null { const key = /^#request-map\/([^/]+)$/.exec(hash)?.[1]; return caseDefinitions.some(item => item.key === key) ? key as CaseKey : null; }
export const escapeXML = (text: string | number) => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!);
function wrap(text: string, limit: number): string[] { const words = text.split(/\s+/), lines: string[] = []; let line = ''; for (const word of words) { if (line && line.length + word.length + 1 > limit) { lines.push(line); line = word; } else line += `${line ? ' ' : ''}${word}`; } if (line) lines.push(line); return lines; }
export function buildSVG(record: SafeCase, selected: EvidenceField): string {
  const pieces: string[] = []; let y = 58;
  const text = (value: string, x: number, top: number, size = 22, color = '#233f3c', weight = '400', serif = false) => pieces.push(`<text x="${x}" y="${top}" font-family="${serif ? 'serif' : 'sans-serif'}" font-size="${size}" font-weight="${weight}" fill="${color}">${escapeXML(value)}</text>`);
  const paragraph = (value: string, x: number, top: number, size = 21, limit = 70, color = '#354e49') => { const lines = wrap(value, limit); lines.forEach((line, i) => text(line, x, top + i * (size + 7), size, color)); return top + lines.length * (size + 7); };
  const rect = (x: number, top: number, width: number, height: number, fill: string, stroke = '#bcc8b9', radius = 5) => pieces.push(`<rect x="${x}" y="${top}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}"/>`);
  text('CONNECTIONS / ONE RECORDED REQUEST', 56, y, 18, '#526c62', '600'); y += 52;
  y = paragraph(record.question, 56, y, 36, 49, '#233f3c') + 15;
  text(`${record.caller} / ${record.tool}`, 56, y, 24, '#233f3c', '600'); y += 35;
  text(`Case: ${record.key}`, 56, y, 18, '#526c62'); y += 29;
  text(`Recorded ${source.date} / gateway ${source.tag}`, 56, y, 18, '#526c62'); y += 31;
  rect(56, y, 968, 138, record.upstreamToolCalls === 1 ? '#e3eade' : '#f2e4d6'); text(record.outcome, 78, y + 36, 27, record.upstreamToolCalls === 1 ? '#233f3c' : '#814f36', '600'); text(record.status, 78, y + 72, 22); text(`Observed backend tool calls: ${record.upstreamToolCalls}`, 78, y + 110, 23, '#233f3c', '600'); y += 182;
  text('THREE EVIDENCE QUESTIONS / NOT A MIDDLEWARE TIMELINE', 56, y, 17, '#526c62', '600'); y += 25;
  for (const [index, field] of fields.entries()) { const x = 56 + index * 328; rect(x, y, 312, 76, selected === field.key ? '#f0ddb2' : '#f6f4e9', selected === field.key ? '#9a773f' : '#bcc8b9'); text(field.label, x + 18, y + 45, 22, '#233f3c', '600'); }
  y += 116;
  for (const field of fields) { text(field.label.toUpperCase(), 56, y, 18, '#526c62', '600'); y += 32; for (const fact of record.evidence[field.key]) y = paragraph(fact, 56, y, 21, 72) + 6; y += 21; }
  pieces.push(`<path d="M56 ${y}H1024" fill="none" stroke="#bcc8b9"/>`); y += 34;
  y = paragraph(artifactBoundary, 56, y, 19, 81) + 10;
  y = paragraph('The windows arrange separate evidence questions. No internal station timings or universal policy verdicts were recorded here.', 56, y, 18, 86) + 8;
  y = paragraph('OAuth validation, real credentials/provider actions and native-profile fallback behavior are outside this map.', 56, y, 18, 86) + 8;
  text(`Source and original receipt: ${source.route} / ${record.key}`, 56, y, 18, '#526c62');
  const height = Math.max(1320, Math.ceil(y + 62));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}" viewBox="0 0 1080 ${height}" role="img" aria-labelledby="map-title map-description"><title id="map-title">${escapeXML(record.question)}</title><desc id="map-description">${escapeXML(artifactBoundary + ' ' + record.outcome + ' ' + record.status + '. Observed backend tool calls: ' + record.upstreamToolCalls + '. ' + (record.errorMessage ? record.errorMessage + '. ' : '') + record.identityRelation + ' ' + aliasNote)}</desc><rect width="1080" height="${height}" fill="#fbf7ec"/><path d="M24 24H1056V${height - 24}H24Z" fill="none" stroke="#bcc8b9"/>${pieces.join('')}</svg>\n`;
}
