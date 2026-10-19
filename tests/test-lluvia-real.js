import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navegando a la app con ?intro=0...');
  await page.goto('http://localhost:5173/?intro=0');
  await page.waitForTimeout(1000);

  // Clic en abrir experiencia inicial
  console.log('Pulsando botón inicial...');
  await page.click('#btn-abrir');
  await page.waitForTimeout(1500);

  // Clic en abrir carta floral
  console.log('Pulsando abrir carta floral...');
  await page.click('#btn-abrir-carta-floral');
  await page.waitForTimeout(2000);

  // Abrir modal de aprecio de ramo
  console.log('Abriendo modal de ramo de regalo...');
  await page.evaluate(() => {
    if (typeof window.abrirModalRamoRegalo === 'function') {
      window.abrirModalRamoRegalo();
    }
  });
  await page.waitForTimeout(1200);

  const btnAcariciar = await page.$('#btn-ramo-acariciar');
  const isVis = await btnAcariciar.isVisible();
  console.log('¿btn-ramo-acariciar es visible en pantalla?:', isVis);

  // Estado antes del clic
  const particulasAntes = await page.evaluate(() => {
    return {
      petalos2D: window._petalosTacto ? window._petalosTacto.particulas.length : 'no 2d',
      petalos3D: window._escenaRosasPruebas && window._escenaRosasPruebas.petalosSistema
        ? window._escenaRosasPruebas.petalosSistema.datos.filter(d => d.activo).length
        : 'no 3d'
    };
  });
  console.log('Pétalos antes del clic:', particulasAntes);

  // Clic en el botón Lluvia de pétalos
  console.log('Haciendo clic en Lluvia de pétalos...');
  await btnAcariciar.click();
  await page.waitForTimeout(300);

  const particulasDespues = await page.evaluate(() => {
    return {
      petalos2D: window._petalosTacto ? window._petalosTacto.particulas.length : 'no 2d',
      petalos3D: window._escenaRosasPruebas && window._escenaRosasPruebas.petalosSistema
        ? window._escenaRosasPruebas.petalosSistema.datos.filter(d => d.activo).length
        : 'no 3d'
    };
  });
  console.log('Pétalos después del clic:', particulasDespues);

  // Tomar captura a los 800ms cuando los pétalos están cayendo por la pantalla
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'C:/Users/david/.gemini/antigravity-ide/brain/7bded585-d060-483f-ac9e-473647873415/lluvia_petalos_modal.png' });

  // Cambiar a vista despejada
  console.log('Probando botón de pétalos en Vista Despejada 360...');
  await page.click('#btn-ramo-giro');
  await page.waitForTimeout(800);

  await page.click('#btn-despejado-petalos');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'C:/Users/david/.gemini/antigravity-ide/brain/7bded585-d060-483f-ac9e-473647873415/lluvia_petalos_despejado.png' });

  await browser.close();
  console.log('Test finalizado con éxito.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
