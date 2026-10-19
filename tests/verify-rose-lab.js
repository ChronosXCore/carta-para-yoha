import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function testRoseLab() {
  console.log('🔬 Verificando /rose-lab.html en iPhone 11 (414x896 @ DPR 2)...');
  const outDir = path.resolve('tests/screenshots/rose-lab');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-gpu', '--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist']
  });

  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.error(`[Browser Error]: ${msg.text()}`);
  });

  await page.goto('http://localhost:5173/rose-lab.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // 1. Distancia Media (por defecto)
  await page.click('#cam-media');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '01_lab_distancia_media.png') });
  console.log('📸 01_lab_distancia_media.png capturada');

  // 2. Distancia Cerca
  await page.click('#cam-cerca');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '02_lab_distancia_cerca.png') });
  console.log('📸 02_lab_distancia_cerca.png capturada');

  // 3. Distancia Lejos
  await page.click('#cam-lejos');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '03_lab_distancia_lejos.png') });
  console.log('📸 03_lab_distancia_lejos.png capturada');

  // 4. Semiabierta (apertura = 0.5)
  await page.evaluate(() => {
    if (window._labRosa) {
      window._labRosa.rosa.setApertura(0.5);
      window._labRosa.distanciaObjetivo = 3.6;
    }
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '04_lab_semiabierta.png') });
  console.log('📸 04_lab_semiabierta.png capturada');

  // 5. Capullo cerrado (apertura = 0.0)
  await page.evaluate(() => {
    if (window._labRosa) {
      window._labRosa.rosa.setApertura(0.0);
    }
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '05_lab_capullo_cerrado.png') });
  console.log('📸 05_lab_capullo_cerrado.png capturada');

  await browser.close();
  console.log('✅ Verificación de laboratorio completada.');
}

testRoseLab().catch(err => {
  console.error('Error en testRoseLab:', err);
  process.exit(1);
});
