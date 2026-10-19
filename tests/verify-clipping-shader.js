import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto('http://localhost:5173/rose-lab.html');
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Ramo 12")');
  await page.waitForTimeout(600);
  await page.click('button:has-text("Pausar")');
  await page.waitForTimeout(300);

  // 1. Vista trasera exacta (180 deg) mirando ligeramente desde abajo hacia arriba como la foto del usuario
  await page.evaluate(() => {
    window._labRosa.girando = false;
    window._labRosa.ramoGrupo.rotation.y = Math.PI;
    window._labRosa.ramoGrupo.rotation.x = -0.15; // Inclinación hacia la cámara para ver la parte trasera baja
    window._labRosa.camera.position.set(0, 0.4, 4.2);
    window._labRosa.camera.lookAt(0, 0.1, 0);
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'C:/Users/david/.gemini/antigravity-ide/brain/7bded585-d060-483f-ac9e-473647873415/test_shader_rear_low.png' });

  // 2. Vista trasera media (180 deg) estándar
  await page.evaluate(() => {
    window._labRosa.ramoGrupo.rotation.x = 0.22;
    window._labRosa.camera.position.set(0, 1.8, 4.8);
    window._labRosa.camera.lookAt(0, -0.15, 0);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'C:/Users/david/.gemini/antigravity-ide/brain/7bded585-d060-483f-ac9e-473647873415/test_shader_rear_mid.png' });

  // 3. Vista frontal (0 deg) para verificar que las flores se sigan viendo intactas
  await page.evaluate(() => {
    window._labRosa.ramoGrupo.rotation.y = 0;
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'C:/Users/david/.gemini/antigravity-ide/brain/7bded585-d060-483f-ac9e-473647873415/test_shader_front.png' });

  // 4. Vista cenital (desde arriba) para verificar que por dentro todas las rosas estén completas
  await page.evaluate(() => {
    window._labRosa.camera.position.set(0, 4.5, 0.01);
    window._labRosa.camera.lookAt(0, 0, 0);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'C:/Users/david/.gemini/antigravity-ide/brain/7bded585-d060-483f-ac9e-473647873415/test_shader_top.png' });

  await browser.close();
  console.log('Shader test screenshots captured!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
