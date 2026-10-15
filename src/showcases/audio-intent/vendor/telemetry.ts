/** Local bounded diagnostics only. No network, storage or production telemetry. */
export const localAudioTelemetry: Array<{ message: string; data: Record<string, unknown>; level: string }> = [];
export function logTelemetry(message: string, data: Record<string, unknown> = {}, level = 'info'): void {
  localAudioTelemetry.push({ message, data, level });
  if (localAudioTelemetry.length > 12) localAudioTelemetry.shift();
}
