// Copia a public/ las cuatro fuentes que usa el video (licencia SIL OFL 1.1, paquetes @fontsource).
import {mkdirSync, copyFileSync} from 'node:fs';
const files = {
  'display-800.woff2': '@fontsource/big-shoulders-display/files/big-shoulders-display-latin-800-normal.woff2',
  'ibm-plex-sans-latin-400-normal.woff2': '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2',
  'ibm-plex-sans-latin-600-normal.woff2': '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2',
  'ibm-plex-mono-latin-500-normal.woff2': '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2',
};
mkdirSync('public', {recursive:true});
for (const [name, from] of Object.entries(files)) copyFileSync(`node_modules/${from}`, `public/${name}`);
console.log(`Fuentes copiadas a public/: ${Object.keys(files).length}`);
