import { chromium, firefox, webkit } from "playwright";
import { pathToFileURL } from "node:url";

const url = pathToFileURL(new URL(process.argv[2] ?? "./index.html", import.meta.url).pathname).href;
const channel = process.argv[3];

for (const type of [chromium, firefox, webkit]) {
  const browser = await type.launch(channel && type === chromium ? { channel } : {});
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForFunction(() => document.title.startsWith("done"));
  console.log(`\n${type.name()} ${browser.version()}`);
  console.log(await page.locator("#out").textContent());
  await browser.close();
}
