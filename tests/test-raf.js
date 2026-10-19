import { chromium } from 'playwright';

async function testRAF() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  });
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
    deviceScaleFactor: 2,
    isMobile: true,
  });

  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  await page.goto('http://localhost:5173/?intro=0', { waitUntil: 'networkidle' });
  await page.click('#btn-abrir');
  await page.waitForFunction(() => window._escenaRosasPruebas !== undefined);
  await page.waitForTimeout(1000);

  // Comprobar document.hidden
  const vis = await page.evaluate(() => ({ hidden: document.hidden, state: document.visibilityState }));
  console.log('Estado de visibilidad:', vis);

  // Esperar 2 segundos para que el monitor interno de la app calcule FPS reales
  await page.waitForTimeout(2000);
  const monitorFPS = await page.evaluate(() => {
    return {
      monitorFPS: window._monitorRendimiento ? window._monitorRendimiento.fps : 'no monitor',
      nivel: window._monitorRendimiento ? window._monitorRendimiento.nivel : 'no nivel',
    };
  });
  console.log('Monitor interno de la app:', monitorFPS);

  // Ahora con CPU Throttling 4x
  const client = await context.newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  const fpsThrottled = await page.evaluate(async () => {
    return new Promise((resolve) => {
      let frames = 0;
      const start = performance.now();
      function count() {
        frames++;
        if (performance.now() - start < 1500) {
          requestAnimationFrame(count);
        } else {
          resolve(Math.round(frames / ((performance.now() - start) / 1000)));
        }
      }
      requestAnimationFrame(count);
    });
  });
  console.log('FPS Rosas con CPU 4x throttling:', fpsThrottled);

  await browser.close();
}

testRAF().catch(console.error);
