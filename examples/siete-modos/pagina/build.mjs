// Une las piezas de la página en dos salidas:
//   docs/ejemplos/siete-modos/index.html   página completa para GitHub Pages
//   out/artefacto.html                     fragmento para publicar como artefacto de claude.ai
// Uso: node examples/siete-modos/pagina/build.mjs
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, join, relative} from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');
const THREE_VERSION = '0.180.0';
const read = name => readFile(join(here, name), 'utf8');
const [head, body, common, three] = await Promise.all(['head.html', 'body.html', 'common.js', 'three.js'].map(read));

const importmap = JSON.stringify({imports:{
  three:`https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/build/three.module.min.js`,
  'three/addons/':`https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/examples/jsm/`,
}});
const fragment = `${head}\n${body}\n<script type="importmap">${importmap}</script>\n<script>\n${common}\n</script>\n<script type="module">\n${three}\n</script>\n`;

// Mismo esqueleto mínimo que añade la publicación de artefactos, para que ambas salidas se vean igual.
const page = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Siete temas de ingeniería explicados con los siete modos de VisualGraficEyes: anatomía 3D, laboratorio, engranajes, pasos, video, mapa y datos.">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
${head}
</head>
<body>
${body}
<script type="importmap">${importmap}</script>
<script>
${common}
</script>
<script type="module">
${three}
</script>
</body>
</html>
`;

const pagePath = join(root, 'docs/ejemplos/siete-modos/index.html');
const fragmentPath = join(root, 'out/siete-modos/artefacto.html');
await mkdir(dirname(pagePath), {recursive:true});
await mkdir(dirname(fragmentPath), {recursive:true});
await writeFile(pagePath, page);
await writeFile(fragmentPath, fragment);
console.log(`Página:    ${relative(root, pagePath)} · ${Buffer.byteLength(page)} bytes`);
console.log(`Fragmento: ${relative(root, fragmentPath)} · ${Buffer.byteLength(fragment)} bytes`);
