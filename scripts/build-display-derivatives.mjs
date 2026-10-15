import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const check = process.argv.includes('--check');
const sources = [
  { file: 'studio/sample-print.png', sha256: 'fd603ddc3e93133215f019a905a1996a31664c6b285db65504c1749c5b77f14a', widths: [480, 960], product: 'Studio Lab', content: 'Display preview of the actual exported fictional Sunday Studio composition.' },
  { file: 'image-revision/original.jpg', sha256: '30a1dc254b749affc24493d9ed9ddef9ea55da983287db274a39f7386b406fb4', widths: [480, 960, 1264], product: 'PanelForge', content: 'Display preview of the original generated teapot. The exact saved JPEG is available separately.' },
  { file: 'image-revision/revision.jpg', sha256: '0a88b6ca8c77d834a580d289a95024f246258149054a9e47e33a99cae1eb9ea6', widths: [480, 960, 1264], product: 'PanelForge', content: 'Display preview of the generated colour revision. The exact saved JPEG is available separately.' },
];
const encoding = { format: 'webp', quality: 90, effort: 6, smartSubsample: true, resize_kernel: 'lanczos3', without_enlargement: true, crop: false, metadata: 'stripped by Sharp default' };
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
const assets = [];

for (const source of sources) {
  const sourceURL = new URL(`public/media/${source.file}`, root);
  const input = await readFile(sourceURL);
  if (hash(input) !== source.sha256) throw new Error(`Source hash differs: ${source.file}`);
  const original = await sharp(input).metadata();
  for (const width of source.widths) {
    const file = source.file.replace(/\.[^.]+$/, `-preview-${width}.webp`);
    const buffer = await sharp(input).resize({ width, withoutEnlargement: true, kernel: 'lanczos3' }).webp({ quality: encoding.quality, effort: encoding.effort, smartSubsample: encoding.smartSubsample }).toBuffer();
    const metadata = await sharp(buffer).metadata();
    const outputURL = new URL(`public/media/${file}`, root);
    if (check) {
      if (!(await readFile(outputURL)).equals(buffer)) throw new Error(`Derivative differs: ${file}`);
    } else await writeFile(outputURL, buffer);
    assets.push({ file, product: source.product, captured: '2026-10-15', method: 'Deterministic resized and compressed display derivative of an existing saved asset; no generative editing or cropping.', content: source.content, redactions: [], bytes: buffer.length, sha256: hash(buffer), width: metadata.width, height: metadata.height, source: { file: source.file, sha256: source.sha256, bytes: input.length, width: original.width, height: original.height }, encoding: { ...encoding, sharp: sharp.versions.sharp, libvips: sharp.versions.vips, libwebp: sharp.versions.webp }, pixel_identity_with_source: false });
  }
  if (hash(await readFile(sourceURL)) !== source.sha256) throw new Error(`Source changed: ${source.file}`);
}
const fragmentURL = new URL('src/showcases/display-derivatives/media-provenance.fragment.json', root);
const fragment = JSON.stringify({ assets }, null, 2) + '\n';
if (check) {
  if (await readFile(fragmentURL, 'utf8') !== fragment) throw new Error('Display derivative provenance differs.');
} else await writeFile(fragmentURL, fragment);
console.log(`${check ? 'Verified' : 'Wrote'} ${assets.length} display derivatives and ${fileURLToPath(fragmentURL)}; original hashes unchanged.`);
