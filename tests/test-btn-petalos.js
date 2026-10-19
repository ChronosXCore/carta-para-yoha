import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  
  // Capturar console logs y errores
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1000);

  // Abrir la experiencia
  await page.click('#btn-abrir');
  await page.waitForTimeout(1500);

  // Saltar intro si existe
  const btnSaltar = await page.$('#btn-saltar-intro');
  if (btnSaltar && await btnSaltar.isVisible()) {
    await btnSaltar.click();
    await page.waitForTimeout(1000);
  }

  // Abrir ramo
  const btnFloral = await page.$('#btn-abrir-carta-floral');
  if (btnFloral && await btnFloral.isVisible()) {
    await btnFloral.click();
    await page.waitForTimeout(2000);
  }

  // Abrir modal del ramo de regalo directamente
  await page.evaluate(() => {
    if (typeof window.abrirModalRamoRegalo === 'function') {
      window.abrirModalRamoRegalo();
    }
  });
  await page.waitForTimeout(1000);

  const btnAcariciar = await page.$('#btn-ramo-acariciar');
  console.log('btn-ramo-acariciar exists?', !!btnAcariciar);
  if (btnAcariciar) {
    const isVisible = await btnAcariciar.isVisible();
    console.log('btn-ramo-acariciar isVisible?', isVisible);
    
    // Evaluar estado de petalosSistema antes del click
    const antes = await page.evaluate(() => {
      const e = window._escenaRosasPruebas;
      if (!e || !e.petalosSistema) return 'No petalosSistema';
      return {
        activos: e.petalosSistema.datos.filter(d => d.activo).length,
        total: e.petalosSistema.datos.length
      };
    });
    console.log('Estado antes del click:', antes);

    // Click en el botón
    await btnAcariciar.click();
    await page.waitForTimeout(200);

    const despues = await page.evaluate(() => {
      const e = window._escenaRosasPruebas;
      if (!e || !e.petalosSistema) return 'No petalosSistema';
      return {
        activos: e.petalosSistema.datos.filter(d => d.activo).length,
        total: e.petalosSistema.datos.length
      };
    });
    console.log('Estado despues del click:', despues);
  }

  await page.screenshot({ path: 'C:/Users/david/.gemini/antigravity-ide/brain/7bded585-d060-483f-ac9e-473647873415/modal_ramo_click.png' });

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
