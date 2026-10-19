import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function runVerification() {
  console.log('🚀 Iniciando verificación de Playwright (iPhone 11: 414x896 @ DPR 2)...');

  const outDir = path.resolve('tests/screenshots');
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
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.error(`[Browser Error]: ${msg.text()}`);
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // 1. Captura pantalla de entrada
  await page.screenshot({ path: path.join(outDir, '01_pantalla_entrada.png'), timeout: 10000 });
  console.log('📸 01_pantalla_entrada.png capturada');

  // 2. Tocar botón "Abrir"
  await page.click('#btn-abrir');
  await page.waitForTimeout(3500); // Esperar que el ramo se abra suavemente

  // 3. Captura distancia media (vista por defecto)
  await page.screenshot({ path: path.join(outDir, '02_ramo_distancia_media.png'), timeout: 10000 });
  console.log('📸 02_ramo_distancia_media.png capturada');

  // 4. Captura distancia cerca
  await page.evaluate(() => {
    if (window._escenaRosasPruebas) {
      window._escenaRosasPruebas.distanciaObjetivo = 4.2;
      window._escenaRosasPruebas.distanciaCamara = 4.2;
    }
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '03_ramo_distancia_cerca.png'), timeout: 10000 });
  console.log('📸 03_ramo_distancia_cerca.png capturada');

  // 5. Captura distancia lejos
  await page.evaluate(() => {
    if (window._escenaRosasPruebas) {
      window._escenaRosasPruebas.distanciaObjetivo = 8.2;
      window._escenaRosasPruebas.distanciaCamara = 8.2;
    }
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '04_ramo_distancia_lejos.png'), timeout: 10000 });
  console.log('📸 04_ramo_distancia_lejos.png capturada');

  // Restaurar distancia media
  await page.evaluate(() => {
    if (window._escenaRosasPruebas) {
      window._escenaRosasPruebas.distanciaObjetivo = 6.2;
      window._escenaRosasPruebas.distanciaCamara = 6.2;
    }
  });
  await page.waitForTimeout(600);

  // 6. Abrir carta completa (bottom sheet)
  await page.click('#btn-abrir-sheet');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '05_carta_completa_abierta.png'), timeout: 10000 });
  console.log('📸 05_carta_completa_abierta.png capturada');

  // 7. Cerrar carta completa
  await page.click('#btn-cerrar-sheet');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '06_carta_cerrada.png'), timeout: 10000 });
  console.log('📸 06_carta_cerrada.png capturada');

  // 8. Medición de FPS con CPU Throttling 4x mediante CDP
  console.log('⏱️ Configurando CDP con CPU Throttling 4x para prueba de rendimiento...');
  const client = await context.newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  const fpsMetrics = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const times = [];
      let frames = 0;
      let lastTime = performance.now();

      function check(now) {
        const delta = now - lastTime;
        lastTime = now;
        if (delta > 0) times.push(1000 / delta);
        frames++;

        if (frames < 90) {
          requestAnimationFrame(check);
        } else {
          const valid = times.slice(10);
          const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
          const min = Math.min(...valid);
          const sorted = [...valid].sort((a, b) => a - b);
          const p1 = sorted[Math.floor(sorted.length * 0.01)] || min;
          resolve({ avgFPS: Math.round(avg), minFPS: Math.round(min), p1FPS: Math.round(p1) });
        }
      }

      requestAnimationFrame(check);
    });
  });

  console.log('📊 Métricas de rendimiento con 4x CPU Throttling (iPhone 11 emulado):');
  console.log(`   - FPS Promedio: ${fpsMetrics.avgFPS} fps`);
  console.log(`   - FPS Mínimo: ${fpsMetrics.minFPS} fps`);
  console.log(`   - 1% Low: ${fpsMetrics.p1FPS} fps`);

  await browser.close();
  console.log('✅ Verificación completada con éxito.');
}

runVerification().catch(err => {
  console.error('Error durante la verificación:', err);
  process.exit(1);
});
