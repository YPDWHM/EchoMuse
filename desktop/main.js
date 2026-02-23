'use strict';

const path = require('path');
const http = require('http');
const https = require('https');
const { app, BrowserWindow, shell } = require('electron');

let mainWindow = null;
let serverStarted = false;

function ensureDesktopServerEnv() {
  if (!process.env.HOST) process.env.HOST = '127.0.0.1';
  if (!process.env.SHARE_MODE) process.env.SHARE_MODE = '0';
  if (!process.env.ALLOW_PUBLIC) process.env.ALLOW_PUBLIC = '0';
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
  // server.js starts listening on require()
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
    req.setTimeout(2500, () => {
      req.destroy(new Error('timeout'));
    });
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
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
    if (mainWindow) mainWindow.show();
  });
}

async function bootDesktopApp() {
  createWindow();
  const baseUrl = getServerBaseUrl();
  try {
    startEmbeddedServer();
    await waitForServerReady(baseUrl, 25000);
    await mainWindow.loadURL(baseUrl);
  } catch (error) {
    const msg = String(error && (error.message || error) || 'unknown error');
    const html = `<!doctype html><meta charset="utf-8"><title>EchoMuse 启动失败</title><style>body{font-family:Segoe UI,system-ui,sans-serif;background:#f8fafc;color:#0f172a;padding:24px}pre{background:#fff;border:1px solid #cbd5e1;border-radius:10px;padding:12px;white-space:pre-wrap}</style><h2>EchoMuse Desktop 启动失败</h2><p>本地服务未能正常启动，请检查 Node 版本、模型服务和端口占用。</p><pre>${msg.replace(/[<&>]/g, (m) => ({ '<':'&lt;','>':'&gt;','&':'&amp;' }[m]))}</pre><p>预期地址：${baseUrl}</p>`;
    await mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    if (mainWindow) mainWindow.show();
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(bootDesktopApp);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      bootDesktopApp().catch(() => {});
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
