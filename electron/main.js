// Wrangle — Electron main process. All tool logic lives in pure-JS modules
// under src/lib and runs here (Node context) via a single tool:run IPC channel,
// so the renderer stays fully sandboxed and nothing ever touches the network.
import { app, BrowserWindow, ipcMain, dialog, clipboard, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import * as convert from '../src/lib/convert.js';
import * as validate from '../src/lib/validate.js';
import * as query from '../src/lib/query.js';
import * as differ from '../src/lib/differ.js';
import * as jwt from '../src/lib/jwt.js';
import * as base64 from '../src/lib/base64.js';
import * as hash from '../src/lib/hash.js';
import * as uuid from '../src/lib/uuid.js';
import * as regex from '../src/lib/regex.js';
import * as timestamp from '../src/lib/timestamp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const registry = { convert, validate, query, differ, jwt, base64, hash, uuid, regex, timestamp };

const DEFAULT_PREFS = { theme: 'dark', lastTool: 'convert', recentByTool: {}, toolOptions: {} };
const prefsPath = () => path.join(app.getPath('userData'), 'wrangle-prefs.json');

function readPrefs() {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(fs.readFileSync(prefsPath(), 'utf8')) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function writePrefs(prefs) {
  fs.writeFileSync(prefsPath(), JSON.stringify(prefs, null, 2), 'utf8'); // Node fs only, never PowerShell
}

// ── IPC ─────────────────────────────────────────────────────────────────────
ipcMain.handle('tool:run', async (_e, mod, fn, args = []) => {
  try {
    const m = registry[mod];
    if (!m || typeof m[fn] !== 'function') throw new Error(`Unknown tool function ${mod}.${fn}`);
    const result = await m[fn](...args);
    return { ok: true, result };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
});

ipcMain.handle('prefs:get', () => readPrefs());
ipcMain.handle('prefs:set', (_e, prefs) => {
  writePrefs(prefs);
  return true;
});

ipcMain.handle('file:open', async (_e, opts = {}) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: opts.filters,
  });
  if (canceled || !filePaths.length) return null;
  const filePath = filePaths[0];
  const stat = fs.statSync(filePath);
  if (opts.pathOnly || stat.size > 10 * 1024 * 1024) {
    return { path: filePath, name: path.basename(filePath), size: stat.size, content: null };
  }
  return {
    path: filePath,
    name: path.basename(filePath),
    size: stat.size,
    content: fs.readFileSync(filePath, 'utf8'),
  };
});

ipcMain.handle('file:save', async (_e, content, defaultName = 'output.txt') => {
  const { canceled, filePath } = await dialog.showSaveDialog({ defaultPath: defaultName });
  if (canceled || !filePath) return null;
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
});

ipcMain.handle('clipboard:write', (_e, text) => {
  clipboard.writeText(String(text ?? ''));
  return true;
});

ipcMain.handle('app:version', () => app.getVersion());

ipcMain.handle('shell:openExternal', (_e, url) => {
  if (/^https:\/\//.test(url)) shell.openExternal(url);
  return true;
});

// ── Window ──────────────────────────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0b0f14',
    autoHideMenuBar: true,
    title: 'Wrangle',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // preload needs webUtils for drag-dropped file paths
    },
  });

  win.loadFile(path.join(__dirname, '..', 'dist', 'renderer', 'index.html'));

  if (process.env.WRANGLE_SMOKE) {
    win.webContents.on('console-message', (_e, level, message) => {
      if (level >= 2) console.log('WRANGLE RENDERER CONSOLE:', message);
    });
    win.webContents.once('did-finish-load', async () => {
      setTimeout(async () => {
        try {
          const mounted = await win.webContents.executeJavaScript(
            "document.getElementById('root').children.length > 0"
          );
          const ipc = await win.webContents.executeJavaScript(
            "window.wrangle.run('hash','hashText',['abc','sha256'])"
          );
          const ipcOk = ipc?.ok && ipc.result?.startsWith('ba7816bf');
          console.log(mounted && ipcOk ? 'WRANGLE BOOT OK (React mounted, IPC verified)' : `WRANGLE BOOT FAIL (mounted=${mounted}, ipc=${JSON.stringify(ipc)})`);
          app.exit(mounted && ipcOk ? 0 : 1);
        } catch (e) {
          console.error('WRANGLE BOOT FAIL', e.message);
          app.exit(1);
        }
      }, 1500);
    });
    win.webContents.once('did-fail-load', (_e, code, desc) => {
      console.error('WRANGLE BOOT FAIL', code, desc);
      app.exit(1);
    });
  }
  return win;
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
