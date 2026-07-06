// base64.js — Base64 / base64url / URL encode-decode for text and files.
// Pure JS, no Electron/DOM imports (node:fs only for file mode).
import fs from 'node:fs';
import path from 'node:path';

const toUrlSafe = (s) => s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromUrlSafe = (s) => s.replace(/-/g, '+').replace(/_/g, '/');

export function encodeText(text, { urlSafe = false } = {}) {
  const out = Buffer.from(text ?? '', 'utf8').toString('base64');
  return urlSafe ? toUrlSafe(out) : out;
}

export function decodeText(b64) {
  const norm = fromUrlSafe((b64 ?? '').trim().replace(/\s+/g, ''));
  if (norm && !/^[A-Za-z0-9+/]+={0,2}$/.test(norm)) {
    throw new Error('Input is not valid base64 / base64url.');
  }
  return Buffer.from(norm, 'base64').toString('utf8');
}

export function urlEncode(text, { component = true } = {}) {
  return component ? encodeURIComponent(text ?? '') : encodeURI(text ?? '');
}

export function urlDecode(text, { component = true } = {}) {
  try {
    return component ? decodeURIComponent(text ?? '') : decodeURI(text ?? '');
  } catch {
    throw new Error('Input is not a valid URL-encoded string.');
  }
}

const MAX_FILE = 64 * 1024 * 1024; // 64 MB — base64 of larger files is rarely what you want

export function fileToBase64(filePath, { urlSafe = false } = {}) {
  const stat = fs.statSync(filePath);
  if (stat.size > MAX_FILE) {
    throw new Error(`File is ${(stat.size / 1048576).toFixed(1)} MB — max for base64 is 64 MB.`);
  }
  const buf = fs.readFileSync(filePath);
  const base64 = urlSafe ? toUrlSafe(buf.toString('base64')) : buf.toString('base64');
  return {
    name: path.basename(filePath),
    bytes: buf.length,
    base64,
    dataUri: `data:application/octet-stream;base64,${buf.toString('base64')}`,
  };
}
