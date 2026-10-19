import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function testPortada() {
  const browser = await chromium.launch({ headless: true });
  
  // 1. Mobile (iPhone 12/13/14)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  
  const mobileShot = 'C:/Users/david/.gemini/antigravity-ide/brain/7bded585-d060-483f-ac9e-473647873415/portada_mobile.png';
  await mobilePage.screenshot({ path: mobileShot });
  console.log('Mobile screenshot saved to', mobileShot);

  // 2. Desktop
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1000);

  const desktopShot = 'C:/Users/david/.gemini/antigravity-ide/brain/7bded585-d060-483f-ac9e-473647873415/portada_desktop.png';
  await desktopPage.screenshot({ path: desktopShot });
  console.log('Desktop screenshot saved to', desktopShot);

  // 3. Test clicking "Abrir"
  await mobilePage.click('#btn-abrir');
  await mobilePage.waitForTimeout(1200);
  const clickShot = 'C:/Users/david/.gemini/antigravity-ide/brain/7bded585-d060-483f-ac9e-473647873415/portada_abriendo.png';
  await mobilePage.screenshot({ path: clickShot });
  console.log('Click transition screenshot saved to', clickShot);

  await browser.close();
}

testPortada().catch(err => {
  console.error('Error during testPortada:', err);
  process.exit(1);
});
