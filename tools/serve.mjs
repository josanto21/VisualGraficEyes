import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { buildDemo } from './build.mjs';
await buildDemo();
const port = Number(process.env.VGE_PORT ?? 5173);
createServer(async (request,response) => {
  if (!['/','/index.html'].includes(request.url.split('?')[0])) { response.writeHead(404); response.end('No encontrado'); return; }
  try { const html = await readFile(new URL('../dist/index.html',import.meta.url)); response.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}); response.end(html); }
  catch { response.writeHead(500); response.end('Ejecuta npm run build para generar la demo.'); }
}).listen(port,'127.0.0.1',()=>console.log(`VGE Fase 2: http://127.0.0.1:${port}`));
