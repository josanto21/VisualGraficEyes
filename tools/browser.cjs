const path = require('node:path');
const {existsSync} = require('node:fs');
const {chromium} = require('playwright');
const config = require('./browser.json');

const installOptions = {...config, cacheDir:path.resolve(__dirname, '../.cache/vge-browser')};
const launchArgs = [
  '--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader',
  '--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader'
];

// El navegador fijado tiene prioridad. VGE_BROWSER es una salida explícita para entornos
// sin acceso a Chrome for Testing; su resultado se marca como no reproducible.
async function browserInfo(env = process.env) {
  const {computeExecutablePath} = await import('@puppeteer/browsers');
  const pinned = computeExecutablePath(installOptions);
  if (existsSync(pinned)) return {executablePath:pinned, source:'fijado', buildId:config.buildId, reproducible:true};
  if (env.VGE_BROWSER) {
    if (!existsSync(env.VGE_BROWSER)) throw new Error(`VGE_BROWSER apunta a un archivo inexistente: ${env.VGE_BROWSER}`);
    return {executablePath:env.VGE_BROWSER, source:'VGE_BROWSER', buildId:null, reproducible:false};
  }
  throw new Error('Falta el navegador fijado. Ejecuta npm run browser:install o, si no hay acceso a Chrome for Testing, define VGE_BROWSER con la ruta de un Chrome existente (resultado no reproducible).');
}

async function launchBrowser() {
  const info = await browserInfo();
  const browser = await chromium.launch({executablePath:info.executablePath, args:launchArgs});
  browser.vgeInfo = {...info, version:browser.version()};
  return browser;
}

module.exports = {launchBrowser,browserInfo,installOptions};
