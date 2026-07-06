// hash.js — MD5/SHA-1/SHA-256/SHA-512 of text or files (streaming), plus HMAC.
// Pure JS, no Electron/DOM imports (node:crypto + node:fs).
import crypto from 'node:crypto';
import fs from 'node:fs';

export const ALGORITHMS = ['md5', 'sha1', 'sha256', 'sha512'];

function assertAlgo(algorithm) {
  if (!ALGORITHMS.includes(algorithm)) {
    throw new Error(`Unknown algorithm "${algorithm}" — use one of: ${ALGORITHMS.join(', ')}`);
  }
}

export function hashText(text, algorithm = 'sha256', { uppercase = false } = {}) {
  assertAlgo(algorithm);
  const d = crypto.createHash(algorithm).update(text ?? '', 'utf8').digest('hex');
  return uppercase ? d.toUpperCase() : d;
}

export function hmacText(text, key, algorithm = 'sha256', { uppercase = false } = {}) {
  assertAlgo(algorithm);
  if (!key) throw new Error('HMAC mode needs a key.');
  const d = crypto.createHmac(algorithm, key).update(text ?? '', 'utf8').digest('hex');
  return uppercase ? d.toUpperCase() : d;
}

// Streaming — safe for multi-GB files.
export function hashFile(filePath, algorithm = 'sha256', { uppercase = false } = {}) {
  assertAlgo(algorithm);
  return new Promise((resolve, reject) => {
    const h = crypto.createHash(algorithm);
    const s = fs.createReadStream(filePath);
    s.on('data', (chunk) => h.update(chunk));
    s.on('error', reject);
    s.on('end', () => {
      const d = h.digest('hex');
      resolve(uppercase ? d.toUpperCase() : d);
    });
  });
}

export async function hashFileAll(filePath, opts = {}) {
  const out = {};
  for (const algo of ALGORITHMS) out[algo] = await hashFile(filePath, algo, opts);
  return out;
}

export function hashTextAll(text, opts = {}) {
  const out = {};
  for (const algo of ALGORITHMS) out[algo] = hashText(text, algo, opts);
  return out;
}
