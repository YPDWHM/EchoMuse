'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { app, BrowserWindow, Menu, Tray, nativeImage, shell, screen } = require('electron');

let mainWindow = null;
let tray = null;
let serverStarted = false;
let isQuitting = false;
let windowStateSaveTimer = 0;
const DESKTOP_LOAD_NONCE = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const WINDOW_STATE_FILE = 'window-state.json';
const WINDOW_STATE_DEBOUNCE_MS = 320;
const DEFAULT_WINDOW_BOUNDS = Object.freeze({
  width: 1380,
  height: 920,
  minWidth: 1024,
  minHeight: 700
});

function ensureDesktopServerEnv() {
  if (!process.env.HOST) process.env.HOST = '127.0.0.1';
  if (!process.env.SHARE_MODE) process.env.SHARE_MODE = '0';
  if (!process.env.ALLOW_PUBLIC) process.env.ALLOW_PUBLIC = '0';
  if (!process.env.ELECTRON_DESKTOP) process.env.ELECTRON_DESKTOP = '1';
  if (!process.env.PORT) process.env.PORT = process.env.ELECTRON_APP_PORT || '53173';
  if (!process.env.RATE_LIMIT_PER_MIN) process.env.RATE_LIMIT_PER_MIN = '600';
  if (!process.env.RATE_LIMIT_TRANSLATE_PER_MIN) process.env.RATE_LIMIT_TRANSLATE_PER_MIN = '1200';
}

function getServerBaseUrl() {
  const host = process.env.HOST || '127.0.0.1';
  const port = Number(process.env.PORT || 53173);
  return `http://${host}:${port}`;
}

function startEmbeddedServer() {
  if (serverStarted) return;
  ensureDesktopServerEnv();
  // server.js starts listening when required.
  require(path.join(__dirname, '..', 'server.js'));
  serverStarted = true;
}

function httpGetText(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https:') ? https : http;
    const req = mod.get(url, (res) => {
      let buf = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { buf += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) return resolve(buf);
        return reject(new Error(`HTTP ${res.statusCode || 0}`));
      });
    });
    req.on('error', reject);
    req.setTimeout(2500, () => req.destroy(new Error('timeout')));
  });
}

async function waitForServerReady(baseUrl, timeoutMs = 25000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      await httpGetText(`${baseUrl}/api/info`);
      return true;
    } catch (error) {
      lastError = error;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw lastError || new Error('server not ready');
}

function getWindowStatePath() {
  return path.join(app.getPath('userData'), WINDOW_STATE_FILE);
}

function rectsIntersect(a, b) {
  return a.x < (b.x + b.width) &&
    (a.x + a.width) > b.x &&
    a.y < (b.y + b.height) &&
    (a.y + a.height) > b.y;
}

function isBoundsVisible(bounds) {
  if (!bounds || !Number.isFinite(bounds.width) || !Number.isFinite(bounds.height)) return false;
  const displays = screen.getAllDisplays();
  return displays.some((d) => rectsIntersect(bounds, d.workArea));
}

function loadWindowState() {
  const fallback = { width: DEFAULT_WINDOW_BOUNDS.width, height: DEFAULT_WINDOW_BOUNDS.height, isMaximized: false };
  try {
    const raw = fs.readFileSync(getWindowStatePath(), 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fallback;
    const width = Math.max(DEFAULT_WINDOW_BOUNDS.minWidth, Number(parsed.width) || fallback.width);
    const height = Math.max(DEFAULT_WINDOW_BOUNDS.minHeight, Number(parsed.height) || fallback.height);
    const candidate = {
      x: Number.isFinite(Number(parsed.x)) ? Number(parsed.x) : undefined,
      y: Number.isFinite(Number(parsed.y)) ? Number(parsed.y) : undefined,
      width,
      height
    };
    const boundsForCheck = {
      x: Number.isFinite(candidate.x) ? candidate.x : 0,
      y: Number.isFinite(candidate.y) ? candidate.y : 0,
      width: candidate.width,
      height: candidate.height
    };
    if (!Number.isFinite(candidate.x) || !Number.isFinite(candidate.y) || !isBoundsVisible(boundsForCheck)) {
      delete candidate.x;
      delete candidate.y;
    }
    candidate.isMaximized = Boolean(parsed.isMaximized);
    return candidate;
  } catch (_) {
    return fallback;
  }
}

function getPersistableWindowState(win) {
  if (!win || win.isDestroyed()) return null;
  const bounds = win.getBounds();
  return {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    isMaximized: win.isMaximized()
  };
}

function saveWindowStateNow(win) {
  const state = getPersistableWindowState(win);
  if (!state) return;
  try {
    fs.mkdirSync(path.dirname(getWindowStatePath()), { recursive: true });
    fs.writeFileSync(getWindowStatePath(), JSON.stringify(state, null, 2), 'utf8');
  } catch (_) {
    // Ignore local persistence failures.
  }
}

function scheduleSaveWindowState(win) {
  if (windowStateSaveTimer) {
    clearTimeout(windowStateSaveTimer);
    windowStateSaveTimer = 0;
  }
  windowStateSaveTimer = setTimeout(() => {
    windowStateSaveTimer = 0;
    saveWindowStateNow(win);
  }, WINDOW_STATE_DEBOUNCE_MS);
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (!mainWindow.isVisible()) mainWindow.show();
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
  updateTrayMenu();
}

function hideMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.hide();
  updateTrayMenu();
}

function createTrayIcon() {
  try {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">',
      '<rect x="4" y="4" width="56" height="56" rx="14" fill="#0f172a"/>',
      '<path d="M19 18h27v7H28v8h16v7H28v14h-9V18z" fill="#f8fafc"/>',
      '</svg>'
    ].join('');
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
    let icon = nativeImage.createFromDataURL(dataUrl);
    if (icon.isEmpty()) icon = nativeImage.createEmpty();
    if (process.platform === 'win32') icon = icon.resize({ width: 16, height: 16 });
    if (process.platform === 'linux') icon = icon.resize({ width: 22, height: 22 });
    return icon;
  } catch (_) {
    return nativeImage.createEmpty();
  }
}

function buildTrayMenu() {
  const visible = Boolean(mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible());
  return Menu.buildFromTemplate([
    { label: visible ? 'Hide Window' : 'Show Window', click: () => (visible ? hideMainWindow() : showMainWindow()) },
    { label: 'Reload', click: () => mainWindow && !mainWindow.isDestroyed() && mainWindow.reload() },
    { label: 'Reload (Ignore Cache)', click: () => mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents.reloadIgnoringCache() },
    { type: 'separator' },
    { label: 'Quit', click: () => { isQuitting = true; app.quit(); } }
  ]);
}

function updateTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(buildTrayMenu());
  tray.setToolTip('EchoMuse Desktop');
}

function ensureTray() {
  if (tray) return tray;
  tray = new Tray(createTrayIcon());
  tray.on('click', () => {
    const visible = Boolean(mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible());
    if (visible) hideMainWindow();
    else showMainWindow();
  });
  tray.on('double-click', showMainWindow);
  updateTrayMenu();
  return tray;
}

function createWindow() {
  const saved = loadWindowState();
  mainWindow = new BrowserWindow({
    width: saved.width || DEFAULT_WINDOW_BOUNDS.width,
    height: saved.height || DEFAULT_WINDOW_BOUNDS.height,
    x: Number.isFinite(saved.x) ? saved.x : undefined,
    y: Number.isFinite(saved.y) ? saved.y : undefined,
    minWidth: DEFAULT_WINDOW_BOUNDS.minWidth,
    minHeight: DEFAULT_WINDOW_BOUNDS.minHeight,
    show: false,
    backgroundColor: '#f8fafc',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url).catch(() => {});
    return { action: 'deny' };
  });

  mainWindow.on('ready-to-show', () => {
    if (saved.isMaximized) mainWindow.maximize();
    mainWindow.show();
    updateTrayMenu();
  });

  mainWindow.on('move', () => {
    if (!mainWindow.isMaximized()) scheduleSaveWindowState(mainWindow);
  });
  mainWindow.on('resize', () => {
    if (!mainWindow.isMaximized()) scheduleSaveWindowState(mainWindow);
  });
  mainWindow.on('maximize', () => scheduleSaveWindowState(mainWindow));
  mainWindow.on('unmaximize', () => scheduleSaveWindowState(mainWindow));

  mainWindow.on('minimize', (event) => {
    if (tray && process.platform === 'win32') {
      event.preventDefault();
      hideMainWindow();
    }
  });

  mainWindow.on('close', (event) => {
    if (isQuitting) {
      saveWindowStateNow(mainWindow);
      return;
    }
    if (!tray) return;
    event.preventDefault();
    hideMainWindow();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    updateTrayMenu();
  });
}

async function bootDesktopApp() {
  app.setAppUserModelId('com.echomuse.desktop');
  ensureTray();
  if (!mainWindow || mainWindow.isDestroyed()) createWindow();

  const baseUrl = getServerBaseUrl();
  try {
    startEmbeddedServer();
    await waitForServerReady(baseUrl, 25000);
    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        const session = mainWindow.webContents.session;
        await session.clearCache();
        await session.clearStorageData({
          storages: ['serviceworkers', 'cachestorage']
        });
      } catch (_) {
        // Ignore cache clear failures; load with nonce below still helps.
      }
      const url = new URL(baseUrl);
      url.searchParams.set('_desktop_nonce', DESKTOP_LOAD_NONCE);
      url.searchParams.set('_ts', String(Date.now()));
      await mainWindow.loadURL(url.toString());
    }
  } catch (error) {
    const msg = String(error && (error.message || error) || 'unknown error');
    const escaped = msg.replace(/[<&>]/g, (m) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[m]));
    const html = [
      '<!doctype html><meta charset="utf-8"><title>EchoMuse Desktop Startup Failed</title>',
      '<style>body{font-family:Segoe UI,system-ui,sans-serif;background:#f8fafc;color:#0f172a;padding:24px}pre{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:12px;white-space:pre-wrap}</style>',
      '<h2>EchoMuse Desktop Startup Failed</h2>',
      '<p>The local server did not start successfully. Check Node version, model service status, and port usage.</p>',
      `<pre>${escaped}</pre>`,
      `<p>Expected URL: ${baseUrl}</p>`
    ].join('');
    if (mainWindow && !mainWindow.isDestroyed()) {
      await mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
      if (!mainWindow.isVisible()) mainWindow.show();
    }
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    showMainWindow();
  });

  app.whenReady().then(bootDesktopApp);

  app.on('before-quit', () => {
    isQuitting = true;
    if (windowStateSaveTimer) {
      clearTimeout(windowStateSaveTimer);
      windowStateSaveTimer = 0;
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      saveWindowStateNow(mainWindow);
    }
  });

  app.on('activate', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      bootDesktopApp().catch(() => {});
      return;
    }
    showMainWindow();
  });

  app.on('window-all-closed', () => {
    // Keep tray behavior on desktop platforms. Quit explicitly from tray menu.
    if (process.platform === 'darwin') return;
  });
}
