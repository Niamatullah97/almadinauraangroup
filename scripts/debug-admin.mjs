import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const logs = [];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('pageerror', (error) => logs.push(`PAGEERROR: ${error.message}`));
page.on('console', (msg) => logs.push(`CONSOLE[${msg.type()}]: ${msg.text()}`));
page.on('requestfailed', (req) =>
  logs.push(`REQFAIL: ${req.url()} -> ${req.failure()?.errorText ?? 'unknown'}`),
);

try {
  await page.goto('http://localhost:4200/', { waitUntil: 'networkidle', timeout: 30000 });
} catch (error) {
  logs.push(`GOTOERR: ${error.message}`);
}

await page.waitForTimeout(8000);

const info = await page.evaluate(() => ({
  url: location.href,
  rootHtml: document.querySelector('app-root')?.innerHTML ?? '',
  bodyText: document.body.innerText,
}));

writeFileSync(
  'admin-debug.json',
  JSON.stringify({ info, logs }, null, 2),
);

console.log(JSON.stringify({ url: info.url, rootLen: info.rootHtml.length, logCount: logs.length }, null, 2));
await browser.close();
