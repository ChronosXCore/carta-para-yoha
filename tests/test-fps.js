import { chromium } from 'playwright';

async function testFPS() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
    deviceScaleFactor: 2,
    isMobile: true,
  });

  const page = await context.newPage();
  await page.goto('http://localhost:5173/?intro=0', { waitUntil: 'networkidle' });

  // Click btnAbrir
  await page.click('#btn-abrir');
  await page.waitForFunction(() => window._escenaRosasPruebas !== undefined);
  await page.waitForTimeout(2000);

  // Medir tiempo por frame en escena rosas sin throttling
  const statsNormal = await page.evaluate(() => {
    const t0 = performance.now();
    for (let i = 0; i < 60; i++) {
      window._escenaRosasPruebas.actualizar();
    }
    const t1 = performance.now();
    return { msTotal: t1 - t0, msPorFrame: (t1 - t0) / 60 };
  });
  console.log('Rosas sin throttling:', statsNormal);

  // Ahora con CDP 4x CPU throttling
  const client = await context.newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  const stats4x = await page.evaluate(() => {
    const t0 = performance.now();
    for (let i = 0; i < 30; i++) {
      window._escenaRosasPruebas.actualizar();
    }
    const t1 = performance.now();
    return { msTotal: t1 - t0, msPorFrame: (t1 - t0) / 30 };
  });
  console.log('Rosas con CPU 4x throttling:', stats4x);

  // Medir FPS continuo por requestAnimationFrame
  const rAFResult = await page.evaluate(async () => {
    return new Promise((resolve) => {
      let frames = 0;
      let start = performance.now();
      function tick() {
        frames++;
        if (performance.now() - start < 1000) {
          requestAnimationFrame(tick);
        } else {
          resolve({ frames, fps: frames / ((performance.now() - start) / 1000) });
        }
      }
      requestAnimationFrame(tick);
    });
  });
  console.log('rAF con CPU 4x throttling:', rAFResult);

  await browser.close();
}

testFPS().catch(console.error);
