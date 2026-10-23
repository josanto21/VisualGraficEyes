const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {chmodSync,statSync} = require('node:fs');
const {installOptions} = require('./browser.cjs');

(async () => {
  const args = process.argv.slice(2);
  if (args.some(a => a !== '--with-deps')) throw new Error('Opción válida: --with-deps');
  if (args.includes('--with-deps')) {
    const cli = path.join(path.dirname(require.resolve('playwright/package.json')), 'cli.js');
    const result = spawnSync(process.execPath, [cli,'install-deps','chromium'], {stdio:'inherit'});
    if (result.error || result.status !== 0) throw result.error ?? new Error('No se pudieron instalar las bibliotecas del sistema.');
  }
  const {install} = await import('@puppeteer/browsers');
  console.log(`Descargando ${installOptions.browser} ${installOptions.buildId} desde Chrome for Testing (Google).`);
  const browser = await install(installOptions);
  // Algunas extracciones ZIP no conservan los permisos Unix del ejecutable.
  if (process.platform !== 'win32') chmodSync(browser.executablePath,statSync(browser.executablePath).mode | 0o111);
  const check = spawnSync(browser.executablePath,['--version'],{encoding:'utf8'});
  if (check.error || check.status !== 0) throw check.error ?? new Error(`El navegador no arranca: ${check.stderr}`);
  if (!check.stdout.includes(installOptions.buildId)) throw new Error('La versión del navegador descargado no coincide con la fijada.');
  console.log(check.stdout.trim());
  console.log(`Navegador preparado: ${browser.executablePath}`);
})().catch(error => {console.error(error);process.exitCode=1;});
