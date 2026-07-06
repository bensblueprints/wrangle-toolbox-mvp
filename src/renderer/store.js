// Tiny prefs store backed by userData/wrangle-prefs.json (written by main via Node fs).
let prefs = { theme: 'dark', lastTool: 'convert', recentByTool: {}, toolOptions: {} };

export async function loadPrefs() {
  try {
    prefs = { ...prefs, ...(await window.wrangle.prefsGet()) };
  } catch { /* first run */ }
  return prefs;
}

export function getPrefs() {
  return prefs;
}

export function updatePrefs(patch) {
  prefs = { ...prefs, ...patch };
  window.wrangle.prefsSet(prefs);
  return prefs;
}

const MAX_RECENT = 10;
const MAX_LEN = 50 * 1024; // truncate stored inputs at 50 KB

export function saveRecent(toolId, input) {
  if (!input || !input.trim()) return;
  const entry = { input: input.slice(0, MAX_LEN), at: Date.now() };
  const list = prefs.recentByTool[toolId] || [];
  if (list[0]?.input === entry.input) return;
  const next = [entry, ...list.filter((e) => e.input !== entry.input)].slice(0, MAX_RECENT);
  prefs = { ...prefs, recentByTool: { ...prefs.recentByTool, [toolId]: next } };
  window.wrangle.prefsSet(prefs);
}

export function getRecents(toolId) {
  return prefs.recentByTool?.[toolId] || [];
}

export function clearHistory() {
  prefs = { ...prefs, recentByTool: {} };
  window.wrangle.prefsSet(prefs);
}
