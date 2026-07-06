// regex.js — regex testing with match/group extraction and replace preview.
// User patterns ALWAYS run inside a worker thread with a hard timeout, so
// catastrophic backtracking (e.g. (a+)+$) can never hang the app.
// Pure JS, no Electron/DOM imports (node:worker_threads only).
import { Worker } from 'node:worker_threads';

export const CHEATSHEET = [
  { name: 'Email', pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.]+' },
  { name: 'URL', pattern: 'https?://[\\w.-]+(?:/[\\w./?%&=+-]*)?' },
  { name: 'IPv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b' },
  { name: 'UUID', pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' },
  { name: 'ISO date', pattern: '\\d{4}-\\d{2}-\\d{2}' },
  { name: 'Hex color', pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b' },
  { name: 'Number', pattern: '-?\\d+(?:\\.\\d+)?' },
  { name: 'Trailing whitespace', pattern: '[ \\t]+$' },
];

// Worker source is evaluated as CommonJS (Node treats eval'd worker code as CJS).
const WORKER_CODE = `
const { workerData, parentPort } = require('node:worker_threads');
const { mode, pattern, flags, text, replacement } = workerData;
try {
  const gFlags = flags.includes('g') ? flags : flags + 'g';
  if (mode === 'replace') {
    const re = new RegExp(pattern, flags); // respect user's g flag for replace
    parentPort.postMessage({ output: text.replace(re, replacement ?? '') });
  } else {
    const re = new RegExp(pattern, gFlags);
    const matches = [];
    for (const m of text.matchAll(re)) {
      matches.push({
        match: m[0],
        index: m.index,
        end: m.index + m[0].length,
        groups: m.slice(1),
        named: m.groups ? { ...m.groups } : null,
      });
      if (matches.length >= 5000) break;
    }
    parentPort.postMessage({ matches, count: matches.length, truncated: matches.length >= 5000 });
  }
} catch (e) {
  parentPort.postMessage({ error: e.message });
}
`;

function runInWorker(workerData, timeoutMs) {
  return new Promise((resolve) => {
    let worker;
    try {
      worker = new Worker(WORKER_CODE, { eval: true, workerData });
    } catch (e) {
      resolve({ error: e.message });
      return;
    }
    let done = false;
    const finish = (result) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    };
    const timer = setTimeout(() => {
      finish({
        error: `Pattern timed out after ${timeoutMs}ms — likely catastrophic backtracking. Simplify nested quantifiers like (a+)+.`,
        timedOut: true,
      });
    }, timeoutMs);
    worker.once('message', (msg) => finish(msg));
    worker.once('error', (e) => finish({ error: e.message }));
  });
}

export function testRegex(pattern, flags = '', text = '', { timeoutMs = 2000 } = {}) {
  if (!pattern) return Promise.resolve({ matches: [], count: 0 });
  if (/[^dgimsuvy]/.test(flags)) return Promise.resolve({ error: `Invalid flags: "${flags}"` });
  return runInWorker({ mode: 'match', pattern, flags, text }, timeoutMs);
}

export function replaceRegex(pattern, flags = '', text = '', replacement = '', { timeoutMs = 2000 } = {}) {
  if (!pattern) return Promise.resolve({ output: text });
  if (/[^dgimsuvy]/.test(flags)) return Promise.resolve({ error: `Invalid flags: "${flags}"` });
  return runInWorker({ mode: 'replace', pattern, flags, text, replacement }, timeoutMs);
}
