import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';

const root = resolve(process.env.PORTFOLIO_DIST_ROOT ?? 'dist');
const port = Number(process.env.PORTFOLIO_PREVIEW_PORT ?? 4322);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORTFOLIO_PREVIEW_PORT must be a valid TCP port.');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.mp4': 'video/mp4', '.wav': 'audio/wav', '.vtt': 'text/vtt; charset=utf-8', '.pdf': 'application/pdf', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation', '.xml': 'application/xml', '.txt': 'text/plain' };

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    let file = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (file !== root && !file.startsWith(root + '/')) { response.writeHead(403).end(); return; }
    let info;
    try {
      info = await stat(file);
      if (info.isDirectory()) { file = resolve(file, 'index.html'); info = await stat(file); }
    } catch {
      file = resolve(root, '404.html'); info = await stat(file);
      response.statusCode = 404;
    }
    response.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
    response.setHeader('Accept-Ranges', 'bytes');
    const match = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range ?? '');
    let start = 0, end = info.size - 1;
    if (match && response.statusCode !== 404) {
      start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), end) : end;
      if (start > end) { response.writeHead(416, { 'Content-Range': `bytes */${info.size}` }).end(); return; }
      response.statusCode = 206;
      response.setHeader('Content-Range', `bytes ${start}-${end}/${info.size}`);
    }
    response.setHeader('Content-Length', end - start + 1);
    if (request.method === 'HEAD') response.end();
    else createReadStream(file, { start, end }).pipe(response);
  } catch { response.writeHead(500).end(); }
}).listen(port, '127.0.0.1', () => console.log(`Serving ${root} at http://127.0.0.1:${port}`));
