const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { _electron: electron } = require('playwright');

const APP_ROOT = path.resolve(__dirname, '..', '..');
const ELECTRON_BIN = require('electron');
const EXPECTED_ELECTRON_VERSION = require('electron/package.json').version;

function createUserDataDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'vertical-spanish-electron-'));
}

async function launchApp(options = {}) {
  const userDataDir = createUserDataDir();
  const app = await electron.launch({
    executablePath: ELECTRON_BIN,
    args: [APP_ROOT],
    env: {
      ...process.env,
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
      VS_ELECTRON_USER_DATA_DIR: userDataDir,
    },
    timeout: 90000,
    ...options,
  });

  return { app, userDataDir };
}

async function closeApp(app, userDataDir) {
  await app.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
}

test('loads Vertical Spanish with browser-only storage', async () => {
  const { app, userDataDir } = await launchApp();

  try {
    const page = await app.firstWindow();
    await page.waitForURL(/https:\/\/(www\.)?verticalspanish\.com\//, { timeout: 90000 });
    await page.waitForLoadState('domcontentloaded');

    assert.match(await page.title(), /Vertical Spanish/);
    assert.equal(await page.evaluate(() => typeof process), 'undefined');

    const desktopRuntime = await page.evaluate(() => window.verticalSpanishDesktop);
    assert.deepEqual(Object.keys(desktopRuntime).sort(), ['electronVersion', 'isElectron', 'platform']);
    assert.equal(desktopRuntime.isElectron, true);
    assert.equal(desktopRuntime.electronVersion, EXPECTED_ELECTRON_VERSION);
    assert.equal(desktopRuntime.platform, process.platform);
    assert.equal(await page.evaluate(() => Boolean(window.verticalSpanishDesktop?.isElectron)), true);

    await page.waitForFunction(
      async () => {
        if (!indexedDB.databases) {
          return true;
        }

        const databases = await indexedDB.databases();
        return databases.some((database) => database.name === 'VerticalSpanishDB');
      },
      null,
      { timeout: 120000 },
    );
  } finally {
    await closeApp(app, userDataDir);
  }
});

test('installs a native draggable top hit-region', async () => {
  const { app, userDataDir } = await launchApp();

  try {
    const page = await app.firstWindow();
    await page.waitForURL(/https:\/\/(www\.)?verticalspanish\.com\//, { timeout: 90000 });
    await page.waitForSelector('#vs-electron-drag-bar', { timeout: 30000 });

    const dragBar = page.locator('#vs-electron-drag-bar');
    const appRegion = await dragBar.evaluate((element) => getComputedStyle(element).getPropertyValue('-webkit-app-region'));
    const box = await dragBar.boundingBox();
    assert.equal(appRegion, 'drag');
    assert.ok(box);
    assert.equal(box.x, 0);
    assert.equal(box.y, 0);
    assert.equal(box.height, 40);
    assert.ok(box.width >= 390);

    const browserWindow = await app.browserWindow(page);
    assert.equal(await browserWindow.evaluate((window) => window.isMovable()), true);

    const hitTarget = await page.evaluate(() => {
      const element = document.elementFromPoint(Math.round(window.innerWidth / 2), 20);
      return element?.id;
    });
    assert.equal(hitTarget, 'vs-electron-drag-bar');
  } finally {
    await closeApp(app, userDataDir);
  }
});

test('keeps top-page controls clickable under the drag bar', async () => {
  const { app, userDataDir } = await launchApp();

  try {
    const page = await app.firstWindow();
    await page.waitForURL(/https:\/\/(www\.)?verticalspanish\.com\//, { timeout: 90000 });
    await page.goto('https://verticalspanish.com/conjugate/hacer');
    await page.waitForSelector('#vs-electron-drag-bar', { timeout: 30000 });

    const startDrawingButton = page.getByRole('button', { name: /start drawing/i });
    await startDrawingButton.waitFor({ timeout: 30000 });
    const buttonHitTarget = await startDrawingButton.evaluate((button) => {
      const rect = button.getBoundingClientRect();
      const element = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return element === button || button.contains(element);
    });
    assert.equal(buttonHitTarget, true);

    await startDrawingButton.click();
    await page.getByRole('toolbar', { name: /drawing controls/i }).waitFor({ timeout: 30000 });
  } finally {
    await closeApp(app, userDataDir);
  }
});

test('shows the local error screen when the site is unreachable', async () => {
  const { app, userDataDir } = await launchApp({ offline: true });

  try {
    const page = await app.firstWindow();
    await page.waitForSelector('text=Vertical Spanish is offline.', { timeout: 90000 });

    assert.match(await page.url(), /^file:/);
    assert.equal(await page.getAttribute('a[href="https://verticalspanish.com/"]', 'href'), 'https://verticalspanish.com/');
  } finally {
    await closeApp(app, userDataDir);
  }
});
