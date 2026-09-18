import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:5173";
const OUTPUT_DIR = "D:\\DEV\\JS\\pizza-snack-play\\outputs\\screenshots";

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log("Testing puppeteer launch with Chrome:", CHROME_PATH);
const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,800"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
console.log("Navigated to /login. Title:", await page.title());
await browser.close();
console.log("Puppeteer launch test successful!");
