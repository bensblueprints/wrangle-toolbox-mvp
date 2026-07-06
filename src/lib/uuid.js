// uuid.js — UUID v4 (crypto.randomUUID) and v7 (time-ordered), bulk generation.
// Pure JS, no Electron/DOM imports.
import crypto from 'node:crypto';

export function uuidV4() {
  return crypto.randomUUID();
}

export function uuidV7() {
  const bytes = crypto.randomBytes(16);
  const ts = BigInt(Date.now());
  // 48-bit big-endian unix timestamp in ms
  bytes[0] = Number((ts >> 40n) & 0xffn);
  bytes[1] = Number((ts >> 32n) & 0xffn);
  bytes[2] = Number((ts >> 24n) & 0xffn);
  bytes[3] = Number((ts >> 16n) & 0xffn);
  bytes[4] = Number((ts >> 8n) & 0xffn);
  bytes[5] = Number(ts & 0xffn);
  bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function generate({ version = 4, count = 1, uppercase = false } = {}) {
  const n = Math.max(1, Math.min(10000, Math.floor(count) || 1));
  const make = version === 7 ? uuidV7 : uuidV4;
  const list = Array.from({ length: n }, () => make());
  return uppercase ? list.map((u) => u.toUpperCase()) : list;
}
