import { chromium } from 'playwright';
import path from 'path';

async function testMobileDevices() {
  const browser = await chromium.launch({ headless: true });
  
  const devices = [
    { name: 'iphone_se_375x667', width: 375, height: 667, scale: 2 },
    { name: 'iphone_14_390x844', width: 390, height: 844, scale: 3 },
    { name: 'iphone_14_pro_max_430x932', width: 430, height: 932, scale: 3 },
    { name: 'android_compact_360x780', width: 360, height: 780, scale: 2 },
    { name: 'android_small_320x568', width: 320, height: 568, scale: 2 },
    { name: 'mobile_landscape_667x375', width: 667, height: 375, scale: 2 }
  ];

  for (const d of devices) {
    const context = await browser.newContext({
      viewport: { width: d.width, height: d.height },
      deviceScaleFactor: d.scale,
      isMobile: true,
      hasTouch: true
    });
    const page = await context.newPage();
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const outPath = `C:/Users/david/.gemini/antigravity-ide/brain/7bded585-d060-483f-ac9e-473647873415/portada_${d.name}.png`;
    await page.screenshot({ path: outPath });
    console.log(`Saved: ${outPath}`);
    await context.close();
  }

  await browser.close();
}

testMobileDevices().catch(console.error);
