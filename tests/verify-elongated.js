import { chromium } from 'playwright';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/david/.gemini/antigravity-ide/brain/02ead787-c81d-45c3-8352-4fb8aee384ae';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  console.log('Navigating to rose-lab...');
  await page.goto('http://localhost:5173/rose-lab.html');
  await page.waitForTimeout(2000);

  // 1. Rosa Abierta
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'lab_elongated_abierta.png') });
  console.log('1. Captured lab_elongated_abierta.png');

  // 2. Rosa Capullo
  await page.click('#btn-capullo');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'lab_elongated_capullo.png') });
  console.log('2. Captured lab_elongated_capullo.png');

  // 3. Rosa Semi
  await page.click('#btn-semi');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'lab_elongated_semi.png') });
  console.log('3. Captured lab_elongated_semi.png');

  // 4. Volver a Abierta y cambiar a Ramo 12
  await page.click('#btn-abierta');
  await page.click('#mod-ramo');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'lab_ramo12_elongated.png') });
  console.log('4. Captured lab_ramo12_elongated.png');

  // 5. Cenital view del ramo 12
  await page.click('#cam-cenital');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'lab_ramo12_cenital.png') });
  console.log('5. Captured lab_ramo12_cenital.png');

  // 6. Test index.html audio playlist
  console.log('Navigating to main card...');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1000);

  // Check playlist in JS
  const playlistInfo = await page.evaluate(() => {
    return {
      audioSrc: window._musicaSistema ? window._musicaSistema.audio.src : null,
      playlistLength: window._musicaSistema ? window._musicaSistema.playlist.length : null,
      playlist: window._musicaSistema ? window._musicaSistema.playlist : null
    };
  });
  console.log('Main page audio config:', JSON.stringify(playlistInfo, null, 2));

  await browser.close();
  console.log('Done!');
}

run().catch(console.error);
