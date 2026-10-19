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

  // Vista cenital con el botón HUD
  await page.click('#cam-cenital');
  await page.waitForTimeout(1200); // Dar tiempo a la animación suave de cámara
  await page.screenshot({ path: 'C:/Users/david/.gemini/antigravity-ide/brain/7bded585-d060-483f-ac9e-473647873415/test_shader_cenital_real.png' });

  await browser.close();
  console.log('Cenital screenshot done!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
