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

  // Vista frontal (0 rad)
  await page.evaluate(() => {
    window._labRosa.girando = false;
    window._labRosa.ramoGrupo.rotation.y = 0;
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'C:/Users/david/.gemini/antigravity-ide/brain/7bded585-d060-483f-ac9e-473647873415/origami_front_v3.png' });

  // Vista lateral (90 deg = PI/2)
  await page.evaluate(() => {
    window._labRosa.ramoGrupo.rotation.y = Math.PI * 0.5;
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'C:/Users/david/.gemini/antigravity-ide/brain/7bded585-d060-483f-ac9e-473647873415/origami_90_v3.png' });

  // Vista trasera (180 deg = PI)
  await page.evaluate(() => {
    window._labRosa.ramoGrupo.rotation.y = Math.PI;
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'C:/Users/david/.gemini/antigravity-ide/brain/7bded585-d060-483f-ac9e-473647873415/origami_180_v3.png' });

  // Vista lateral izquierda (270 deg = 3*PI/2)
  await page.evaluate(() => {
    window._labRosa.ramoGrupo.rotation.y = Math.PI * 1.5;
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'C:/Users/david/.gemini/antigravity-ide/brain/7bded585-d060-483f-ac9e-473647873415/origami_270_v3.png' });

  // Vista móvil de la carta interactiva (index.html)
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobilePage.goto('http://localhost:5173/');
  await mobilePage.waitForTimeout(2000);
  await mobilePage.screenshot({ path: 'C:/Users/david/.gemini/antigravity-ide/brain/7bded585-d060-483f-ac9e-473647873415/origami_mobile_v3.png' });

  await browser.close();
  console.log('All 5 views captured successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
