import { createDoc, backgrounds } from '../../labs/studio/model';
import { render } from '../../labs/studio/render';
import { createExportCanvas, canvasToBlob, type ExportSurface } from '../../labs/studio/canvas';
import type { DecodedBackground, KitDoc } from '../../labs/studio/types';
import type { Draft } from './model';
export { backgrounds, createExportCanvas, canvasToBlob };
export function printDocument(draft: Draft, background: DecodedBackground): KitDoc {
  const doc = createDoc();
  doc.templateId = 'custom'; doc.customTemplate = { prefix: 'A SMALL EDITION', headline: draft.headline };
  doc.eventName = { text: draft.smallLine, visible: !!draft.smallLine.trim() };
  doc.name.visible = doc.title.visible = doc.company.visible = doc.photo.visible = false;
  doc.companyLogo.image = doc.eventLogo.image = null;
  doc.font = 'sans'; doc.textColor = '#ffffff'; doc.composition = draft.arrangement;
  doc.background = background; doc.backgroundId = draft.look;
  return doc;
}
export function drawDraft(surface: ExportSurface, draft: Draft, background: DecodedBackground): void { render(surface.ctx, printDocument(draft, background), 0); }
export function freezeDraft(canvas: ExportSurface['canvas']): ExportSurface { const frozen = createExportCanvas(); frozen.ctx.drawImage(canvas, 0, 0); return frozen; }
export function releaseSurface(surface: ExportSurface): void { surface.canvas.width = surface.canvas.height = 0; }
