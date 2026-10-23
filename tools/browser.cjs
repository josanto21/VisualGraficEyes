const path = require('node:path');
const {existsSync} = require('node:fs');
const {chromium} = require('playwright');
const config = require('./browser.json');

const installOptions = {...config, cacheDir:path.resolve(__dirname, '../.cache/vge-browser')};
async function launchBrowser() {
  const {computeExecutablePath} = await import('@puppeteer/browsers');
  const executablePath = computeExecutablePath(installOptions);
  if (!existsSync(executablePath)) throw new Error('Falta el navegador fijado. Ejecuta npm run browser:install.');
  return chromium.launch({executablePath,args:[
    '--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader',
    '--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader'
  ]});
}

module.exports = {launchBrowser,installOptions};
