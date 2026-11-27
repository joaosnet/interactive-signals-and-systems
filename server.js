import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servidor estático apenas para desenvolvimento local (produção é o GitHub Pages).
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon'
};

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(body);
}

const server = http.createServer((req, res) => {
  let reqPath;
  try {
    reqPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  } catch (err) {
    // URL malformada (ex.: "/%") lançava URIError e derrubava o processo
    send(res, 400, 'Bad Request');
    return;
  }
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const filePath = path.resolve(__dirname, '.' + path.posix.normalize('/' + reqPath));

  // Impede path traversal: o arquivo precisa estar DENTRO da raiz (comparar com o
  // separador evita aceitar um diretório irmão com o mesmo prefixo) e fora de pastas ocultas.
  const relative = path.relative(__dirname, filePath);
  const isInside = relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  const isHidden = relative.split(path.sep).some((part) => part.startsWith('.') && part !== '.nojekyll');
  if (!isInside || isHidden) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      send(res, 404, 'Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => res.destroy());
    stream.pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
