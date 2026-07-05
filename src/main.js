const path = require('node:path');
const { app, BrowserWindow, Menu, session, shell } = require('electron');
const { classifyNavigation, isAllowedInternalUrl } = require('./url-policy');

const APP_URL = 'https://verticalspanish.com/';
const APP_PARTITION = 'persist:verticalspanish';
const ERROR_PAGE_PATH = path.join(__dirname, 'error.html');
const ICON_PATH = path.join(__dirname, '..', 'assets', 'icon.png');
const DRAG_BAR_ID = 'vs-electron-drag-bar';
const TITLEBAR_GUARD_CSS = `
  #${DRAG_BAR_ID} {
    -webkit-app-region: drag;
    app-region: drag;
    position: fixed;
    inset: 0 0 auto 0;
    height: 40px;
    z-index: 99999990;
    pointer-events: auto;
    background:
      linear-gradient(180deg, rgba(17, 18, 34, 0.82), rgba(17, 18, 34, 0.44)),
      linear-gradient(90deg, rgba(124, 99, 184, 0.16), rgba(255, 255, 255, 0.04), rgba(124, 99, 184, 0.1));
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(14px);
  }

  button,
  a,
  input,
  select,
  textarea,
  summary,
  [role="button"],
  [role="link"],
  [role="menuitem"],
  [contenteditable="true"],
  .draw-launcher,
  .draw-toolbar,
  .desktop-app-rail {
    -webkit-app-region: no-drag;
    app-region: no-drag;
  }

  :has(> .draw-launcher),
  :has(> .draw-toolbar) {
    top: 52px !important;
  }

  @media (min-width: 1024px) {
    .desktop-app-rail > div:first-child {
      padding-top: 52px !important;
    }
  }

  @media (max-width: 1023px) {
    body > header:first-of-type > div:first-child {
      padding-top: 34px !important;
    }
  }
`;
const INSTALL_DRAG_BAR_SCRIPT = `
  (() => {
    const dragBarId = ${JSON.stringify(DRAG_BAR_ID)};
    if (document.getElementById(dragBarId)) {
      return;
    }

    const dragBar = document.createElement('div');
    dragBar.id = dragBarId;
    dragBar.setAttribute('aria-hidden', 'true');
    (document.body || document.documentElement).appendChild(dragBar);
  })();
`;

if (process.env.VS_ELECTRON_USER_DATA_DIR) {
  app.setPath('userData', process.env.VS_ELECTRON_USER_DATA_DIR);
}

let mainWindow;

function openExternalUrl(rawUrl) {
  if (classifyNavigation(rawUrl) !== 'external') {
    return;
  }

  shell.openExternal(rawUrl).catch((error) => {
    console.error(`Failed to open external URL: ${rawUrl}`, error);
  });
}

function createApplicationMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'zoom' }, ...(isMac ? [{ type: 'separator' }, { role: 'front' }] : [])],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function configureSession() {
  const appSession = session.fromPartition(APP_PARTITION);

  appSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  appSession.setPermissionCheckHandler(() => false);

  return appSession;
}

function configureWebContents(webContents) {
  webContents.setWindowOpenHandler(({ url }) => {
    openExternalUrl(url);
    return { action: 'deny' };
  });

  webContents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });

  webContents.on('will-navigate', (event, url) => {
    const classification = classifyNavigation(url);
    if (classification === 'allow') {
      return;
    }

    event.preventDefault();
    openExternalUrl(url);
  });
}

async function loadErrorPage(window, errorDescription) {
  const query = {
    description: errorDescription || 'Vertical Spanish could not be reached.',
  };

  await window.loadFile(ERROR_PAGE_PATH, { query });
}

function injectElectronChrome(window) {
  const currentUrl = window.webContents.getURL();
  if (!isAllowedInternalUrl(currentUrl)) {
    return;
  }

  window.webContents.insertCSS(TITLEBAR_GUARD_CSS).catch((error) => {
    console.error('Failed to inject Electron chrome CSS', error);
  });

  window.webContents.executeJavaScript(INSTALL_DRAG_BAR_SCRIPT).catch((error) => {
    console.error('Failed to inject Electron drag bar', error);
  });
}

function createWindow() {
  configureSession();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 390,
    minHeight: 640,
    show: false,
    title: 'Vertical Spanish',
    backgroundColor: '#111124',
    icon: ICON_PATH,
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : 'default',
    trafficLightPosition: process.platform === 'darwin' ? { x: 16, y: 16 } : undefined,
    webPreferences: {
      partition: APP_PARTITION,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      webviewTag: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('dom-ready', () => {
    injectElectronChrome(mainWindow);
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, _validatedUrl, isMainFrame) => {
    if (!isMainFrame || errorCode === -3) {
      return;
    }

    loadErrorPage(mainWindow, errorDescription).catch((error) => {
      console.error('Failed to load error page', error);
    });
  });

  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });

  mainWindow.loadURL(APP_URL);
}

app.name = 'Vertical Spanish';

app.whenReady().then(() => {
  createApplicationMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('web-contents-created', (_event, webContents) => {
  configureWebContents(webContents);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
