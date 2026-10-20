import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function verificarIntro() {
  const dirCapturas = path.resolve('tests/screenshots/intro');
  if (!fs.existsSync(dirCapturas)) {
    fs.mkdirSync(dirCapturas, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  console.log('--- Iniciando verificación de Intro "Una libélula de luz" ---');
  await page.goto('http://localhost:5173/?intro=1', { waitUntil: 'networkidle' });

  // Iniciar experiencia haciendo click en "Abrir"
  await page.click('#btn-abrir');
  await page.waitForTimeout(600);

  // Asegurar que introInstance esté listo
  await page.waitForFunction(() => window._introInstance !== null && window._introInstance !== undefined);

  // Lista de instantes de la nueva intro: Galaxia -> Yohandry -> Corazón Te amo -> Explosión
  const instantes = [
    { t: 3.5, desc: '01_intro_t_02s_formacion_galaxia.png' },
    { t: 9.0, desc: '02_intro_t_06s_nombre_yohandry.png' },
    { t: 13.5, desc: '03_intro_t_10s_corazon_te_amo.png' },
    { t: 16.5, desc: '04_intro_t_14s_explosion_particulas.png' }
  ];

  for (const item of instantes) {
    console.log(`Evaluando instante t = ${item.t}s...`);
    await page.evaluate((t) => {
      if (window.saltarIntroATiempo) {
        window.saltarIntroATiempo(t);
      }
    }, item.t);

    // Esperar varios frames para renderizado y estabilización
    await page.waitForTimeout(400);

    const rutaCaptura = path.join(dirCapturas, item.desc);
    await page.screenshot({ path: rutaCaptura, fullPage: false });
    console.log(`Captura guardada: ${item.desc}`);
  }

  // --- Medición de FPS con CPU Throttling 4x (CDP) ---
  console.log('\n--- Midiendo FPS con CPU Throttling 4x en Intro ---');
  const client = await context.newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  // Medir FPS en intro con CPU Throttling 4x
  const fpsIntro = await page.evaluate(async () => {
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
  console.log(`FPS Intro (CPU 4x throttling): ${fpsIntro} fps`);

  // Saltar intro hacia la escena del ramo en la misma página
  console.log('\n--- Saltando intro y midiendo rendimiento en escena de rosas ---');
  await page.evaluate(() => {
    if (window._introInstance) {
      window._introInstance.saltar();
    }
  });

  await page.waitForFunction(() => window._escenaRosasPruebas !== undefined && window._escenaRosasPruebas !== null, { timeout: 10000 });
  await page.waitForTimeout(1500);

  // Medición de tiempo de ejecución de frame en escena de rosas
  const frameStats = await page.evaluate(() => {
    const t0 = performance.now();
    for (let i = 0; i < 30; i++) {
      window._escenaRosasPruebas.actualizar();
    }
    const t1 = performance.now();
    const msFrame = (t1 - t0) / 30;
    const fpsTeorico = Math.min(60, Math.round(1000 / msFrame));
    return { msFrame: msFrame.toFixed(2), fps: fpsTeorico };
  });
  console.log(`Rendimiento Escena Rosas (CPU 4x throttling): ${frameStats.msFrame} ms/frame (~${frameStats.fps} fps capacidad)`);

  // Captura de la escena de rosas en móvil
  const rutaEscena = path.join(dirCapturas, '08_escena_ramo_completa.png');
  await page.screenshot({ path: rutaEscena, fullPage: false });
  console.log(`Captura guardada: 08_escena_ramo_completa.png`);

  await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await browser.close();

  console.log('\nVerificación completa con éxito.');
}

verificarIntro().catch((err) => {
  console.error('Error durante la verificación:', err);
  process.exit(1);
});
