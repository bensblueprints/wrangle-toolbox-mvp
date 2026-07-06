// Wrangle preload — minimal, explicit bridge. The renderer gets exactly these
// capabilities and nothing else. No network APIs are exposed anywhere.
const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('wrangle', {
  // Run a pure-JS lib function in the main process: run('hash', 'hashText', ['abc', 'sha256'])
  run: (mod, fn, args = []) => ipcRenderer.invoke('tool:run', mod, fn, args),

  prefsGet: () => ipcRenderer.invoke('prefs:get'),
  prefsSet: (prefs) => ipcRenderer.invoke('prefs:set', prefs),

  openFile: (opts) => ipcRenderer.invoke('file:open', opts),
  saveFile: (content, defaultName) => ipcRenderer.invoke('file:save', content, defaultName),

  copy: (text) => ipcRenderer.invoke('clipboard:write', text),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  version: () => ipcRenderer.invoke('app:version'),

  // Resolve the absolute path of a drag-dropped File (for hashing / base64 of big files)
  pathForFile: (file) => webUtils.getPathForFile(file),
});
