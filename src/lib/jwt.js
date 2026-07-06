// jwt.js — JWT decoding (offline, signature NOT verified by default) and
// optional HS256 verification via node:crypto. Pure JS, no Electron/DOM imports.
import crypto from 'node:crypto';

const b64u = {
  decode: (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64'),
  encode: (buf) =>
    Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
};

export function decodeJwt(token) {
  const parts = (token || '').trim().split('.');
  if (parts.length !== 3) throw new Error('Not a JWT — expected 3 dot-separated base64url segments.');
  let header, payload;
  try {
    header = JSON.parse(b64u.decode(parts[0]).toString('utf8'));
  } catch {
    throw new Error('Invalid JWT header (segment 1 is not base64url-encoded JSON).');
  }
  try {
    payload = JSON.parse(b64u.decode(parts[1]).toString('utf8'));
  } catch {
    throw new Error('Invalid JWT payload (segment 2 is not base64url-encoded JSON).');
  }
  const nowSec = Date.now() / 1000;
  const hasExp = typeof payload.exp === 'number';
  return {
    header,
    payload,
    algorithm: header.alg || null,
    expired: hasExp ? payload.exp < nowSec : false,
    expiresAt: hasExp ? new Date(payload.exp * 1000).toISOString() : null,
    issuedAt: typeof payload.iat === 'number' ? new Date(payload.iat * 1000).toISOString() : null,
    notBefore: typeof payload.nbf === 'number' ? new Date(payload.nbf * 1000).toISOString() : null,
    signature: parts[2],
  };
}

export function verifyHS256(token, secret) {
  const parts = (token || '').trim().split('.');
  if (parts.length !== 3) throw new Error('Not a JWT — expected 3 dot-separated segments.');
  if (!secret) throw new Error('Provide a secret to verify against.');
  const expected = b64u.encode(
    crypto.createHmac('sha256', secret).update(`${parts[0]}.${parts[1]}`).digest()
  );
  const a = Buffer.from(expected);
  const b = Buffer.from(parts[2]);
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
  return { valid };
}

// Test helper / power feature: build an HS256 token locally.
export function signHS256(payload, secret, header = { alg: 'HS256', typ: 'JWT' }) {
  const h = b64u.encode(Buffer.from(JSON.stringify(header), 'utf8'));
  const p = b64u.encode(Buffer.from(JSON.stringify(payload), 'utf8'));
  const sig = b64u.encode(crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest());
  return `${h}.${p}.${sig}`;
}
