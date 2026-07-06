// differ.js — line diff with optional "smart JSON" normalization
// (key order + whitespace insensitive). Pure JS, no Electron/DOM imports.
import { diffLines } from 'diff';

function sortKeysDeep(v) {
  if (Array.isArray(v)) return v.map(sortKeysDeep);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeysDeep(v[k])]));
  }
  return v;
}

export function normalizeJson(text) {
  return JSON.stringify(sortKeysDeep(JSON.parse(text)), null, 2);
}

export function textDiff(a, b, { smartJson = false } = {}) {
  let left = a ?? '';
  let right = b ?? '';
  let normalized = false;
  if (smartJson) {
    try {
      left = normalizeJson(left);
      right = normalizeJson(right);
      normalized = true;
    } catch {
      // not valid JSON on both sides — fall back to raw text diff
    }
  }
  if (left && !left.endsWith('\n')) left += '\n';
  if (right && !right.endsWith('\n')) right += '\n';
  const raw = diffLines(left, right);
  const parts = raw.map((p) => ({
    value: p.value,
    added: !!p.added,
    removed: !!p.removed,
    count: p.count,
  }));
  const added = parts.filter((p) => p.added).length;
  const removed = parts.filter((p) => p.removed).length;
  const addedLines = parts.filter((p) => p.added).reduce((n, p) => n + p.count, 0);
  const removedLines = parts.filter((p) => p.removed).reduce((n, p) => n + p.count, 0);
  return { parts, added, removed, addedLines, removedLines, normalized, changed: added + removed > 0 };
}
