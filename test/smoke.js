// Wrangle smoke test — exercises every src/lib module with real fixtures
// under plain Node (no Electron, no DOM, no native modules).
// Run: npm test
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
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
const FIXTURE_DIR = path.join(__dirname, '.fixtures');

let passed = 0;
let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok    ${name}`);
  } catch (e) {
    failed++;
    console.error(`  FAIL  ${name}`);
    console.error(`        ${e.message}`);
  }
}

fs.rmSync(FIXTURE_DIR, { recursive: true, force: true });
fs.mkdirSync(FIXTURE_DIR, { recursive: true });

try {
  // ── 1. Convert ────────────────────────────────────────────────────────────
  console.log('convert');

  const people = [
    { name: 'Ada Lovelace', age: 36, meta: { city: 'London', role: 'engineer' }, tags: ['math', 'pioneer'] },
    { name: 'Grace Hopper', age: 85, meta: { city: 'Arlington', role: 'admiral' }, tags: ['navy', 'compiler'] },
    { name: 'Alan Turing', age: 41, meta: { city: 'Wilmslow', role: 'logician' }, tags: ['enigma', 'ai'] },
  ];

  await test('JSON -> CSV -> JSON round-trip (nested field, dot-notation flatten rules)', () => {
    const csv = convert.convert(JSON.stringify(people), 'json', 'csv').output;
    assert.ok(csv.split('\n')[0].includes('meta.city'), 'CSV header should contain dot-notation column');
    const back = convert.parseInput(csv, 'csv');
    assert.deepEqual(back, people);
  });

  await test('JSON -> YAML -> JSON round-trip deep-equal', () => {
    const yamlText = convert.convert(JSON.stringify(people), 'json', 'yaml').output;
    const back = convert.parseInput(yamlText, 'yaml');
    assert.deepEqual(back, people);
  });

  await test('XML -> JSON preserves attributes with @_ prefix', () => {
    const xml = '<library><book id="42" lang="en"><title>Deep Work</title><pages>296</pages></book></library>';
    const obj = convert.parseInput(xml, 'xml');
    assert.equal(obj.library.book['@_id'], '42');
    assert.equal(obj.library.book['@_lang'], 'en');
    assert.equal(obj.library.book.title, 'Deep Work');
    assert.equal(obj.library.book.pages, 296);
  });

  await test('CSV with quoted commas parses to correct cell values', () => {
    const csv = 'name,quote\n"Smith, John","To be, or not to be"\n"Doe, Jane","Hello, world"';
    const rows = convert.parseInput(csv, 'csv');
    assert.equal(rows.length, 2);
    assert.equal(rows[0].name, 'Smith, John');
    assert.equal(rows[0].quote, 'To be, or not to be');
    assert.equal(rows[1].name, 'Doe, Jane');
  });

  await test('auto-detect input format (json / xml / csv / yaml)', () => {
    assert.equal(convert.detectFormat('{"a":1}'), 'json');
    assert.equal(convert.detectFormat('<root><a>1</a></root>'), 'xml');
    assert.equal(convert.detectFormat('a,b\n1,2\n3,4'), 'csv');
    assert.equal(convert.detectFormat('name: Ada\nrole: engineer'), 'yaml');
  });

  // ── 2. Validate ───────────────────────────────────────────────────────────
  console.log('validate');

  await test('malformed JSON reports error with correct line/column (error on line 3)', () => {
    const bad = '{\n  "a": 1,\n  "b" "missing colon"\n}';
    const r = validate.validateJson(bad);
    assert.equal(r.ok, false);
    assert.ok(r.error, 'should include an error message');
    assert.equal(r.line, 3, `expected line 3, got ${r.line}`);
    assert.ok(Number.isInteger(r.column) && r.column > 0, 'should include a column');
  });

  await test('format + minify JSON', () => {
    const f = validate.formatJson('{"a":1,"b":[1,2]}', 2);
    assert.equal(f.output, '{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}');
    assert.equal(validate.minifyJson(f.output).output, '{"a":1,"b":[1,2]}');
  });

  await test('invalid YAML and XML report line numbers', () => {
    const y = validate.validateYaml('a: 1\nb: [unclosed');
    assert.equal(y.ok, false);
    assert.ok(y.line >= 1);
    const x = validate.validateXml('<root><a>1</b></root>');
    assert.equal(x.ok, false);
    assert.ok(x.line >= 1);
  });

  // ── 3. JSONPath ───────────────────────────────────────────────────────────
  console.log('query (JSONPath)');

  const bookstore = {
    store: {
      book: [
        { category: 'reference', author: 'Nigel Rees', title: 'Sayings of the Century', price: 8.95 },
        { category: 'fiction', author: 'Evelyn Waugh', title: 'Sword of Honour', price: 12.99 },
        { category: 'fiction', author: 'Herman Melville', title: 'Moby Dick', isbn: '0-553-21311-3', price: 8.99 },
        { category: 'fiction', author: 'J. R. R. Tolkien', title: 'The Lord of the Rings', isbn: '0-395-19395-8', price: 22.99 },
      ],
      bicycle: { color: 'red', price: 19.95 },
    },
  };

  await test('$.store.book[?(@.price<10)] returns exactly 2 titles', () => {
    const r = query.runJsonPath(JSON.stringify(bookstore), '$.store.book[?(@.price<10)]');
    assert.equal(r.count, 2);
    const titles = r.result.map((b) => b.title).sort();
    assert.deepEqual(titles, ['Moby Dick', 'Sayings of the Century']);
  });

  // ── 4. Diff ───────────────────────────────────────────────────────────────
  console.log('diff');

  await test('one changed key -> exactly one added + one removed hunk', () => {
    const a = '{\n  "name": "wrangle",\n  "version": "1.0.0",\n  "license": "MIT"\n}';
    const b = '{\n  "name": "wrangle",\n  "version": "2.0.0",\n  "license": "MIT"\n}';
    const r = differ.textDiff(a, b);
    assert.equal(r.added, 1, `expected 1 added hunk, got ${r.added}`);
    assert.equal(r.removed, 1, `expected 1 removed hunk, got ${r.removed}`);
  });

  await test('smart JSON diff: shuffled key order -> zero changes', () => {
    const a = '{"z":1,"a":{"y":2,"b":3},"list":[1,2]}';
    const b = '{\n"a": {"b":3, "y":2},\n"list":[1,2],\n"z": 1\n}';
    const r = differ.textDiff(a, b, { smartJson: true });
    assert.equal(r.changed, false);
    assert.equal(r.added + r.removed, 0);
  });

  // ── 5. JWT ────────────────────────────────────────────────────────────────
  console.log('jwt');

  const secret = 'wrangle-test-secret';
  const nowSec = Math.floor(Date.now() / 1000);
  const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const buildToken = (payload) => {
    const h = b64url({ alg: 'HS256', typ: 'JWT' });
    const p = b64url(payload);
    const sig = crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url');
    return `${h}.${p}.${sig}`;
  };

  await test('decode locally-built HS256 token: payload matches, expired=false', () => {
    const payload = { sub: 'user-1', name: 'Ada', iat: nowSec, exp: nowSec + 3600 };
    const d = jwt.decodeJwt(buildToken(payload));
    assert.deepEqual(d.payload, payload);
    assert.equal(d.header.alg, 'HS256');
    assert.equal(d.expired, false);
    assert.ok(d.expiresAt);
  });

  await test('expired token -> expired=true', () => {
    const d = jwt.decodeJwt(buildToken({ sub: 'user-1', exp: nowSec - 60 }));
    assert.equal(d.expired, true);
  });

  await test('HS256 verify: right secret true, wrong secret false', () => {
    const token = buildToken({ sub: 'user-1', exp: nowSec + 60 });
    assert.equal(jwt.verifyHS256(token, secret).valid, true);
    assert.equal(jwt.verifyHS256(token, 'wrong-secret').valid, false);
  });

  // ── 6. Base64 / URL ───────────────────────────────────────────────────────
  console.log('base64 / url');

  await test('text round-trip including UTF-8 emoji', () => {
    const s = 'Wrangle 🛠️ — pay once, own it forever ✓ ünïcodé';
    assert.equal(base64.decodeText(base64.encodeText(s)), s);
    assert.equal(base64.decodeText(base64.encodeText(s, { urlSafe: true })), s);
  });

  await test('URL encode/decode round-trip', () => {
    const s = 'a b&c=d?e/f+g#h';
    assert.equal(base64.urlDecode(base64.urlEncode(s)), s);
  });

  await test('file -> base64 on 1KB binary fixture matches Buffer.toString("base64")', () => {
    const binPath = path.join(FIXTURE_DIR, 'blob.bin');
    const buf = crypto.randomBytes(1024);
    fs.writeFileSync(binPath, buf);
    const r = base64.fileToBase64(binPath);
    assert.equal(r.base64, buf.toString('base64'));
    assert.equal(r.bytes, 1024);
  });

  // ── 7. Hash ───────────────────────────────────────────────────────────────
  console.log('hash');

  await test('SHA-256("abc") matches the known test vector', () => {
    assert.equal(
      hash.hashText('abc', 'sha256'),
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });

  await test('streaming file hash matches direct crypto digest', async () => {
    const filePath = path.join(FIXTURE_DIR, 'hashme.bin');
    const buf = crypto.randomBytes(256 * 1024);
    fs.writeFileSync(filePath, buf);
    const streamed = await hash.hashFile(filePath, 'sha256');
    assert.equal(streamed, crypto.createHash('sha256').update(buf).digest('hex'));
  });

  await test('HMAC-SHA256 matches node:crypto', () => {
    assert.equal(
      hash.hmacText('message', 'key', 'sha256'),
      crypto.createHmac('sha256', 'key').update('message').digest('hex')
    );
  });

  // ── 8. UUID ───────────────────────────────────────────────────────────────
  console.log('uuid');

  await test('100 v4 UUIDs: all unique, regex-valid, version nibble 4', () => {
    const list = uuid.generate({ version: 4, count: 100 });
    assert.equal(new Set(list).size, 100);
    const re = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    for (const u of list) assert.match(u, re);
  });

  await test('v7 UUIDs: valid format, version nibble 7, time-ordered prefix', () => {
    const list = uuid.generate({ version: 7, count: 50 });
    const re = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    for (const u of list) assert.match(u, re);
    assert.equal(new Set(list).size, 50);
  });

  // ── 9. Regex ──────────────────────────────────────────────────────────────
  console.log('regex');

  await test('(\\w+)@(\\w+)\\.com extracts correct groups', async () => {
    const r = await regex.testRegex('(\\w+)@(\\w+)\\.com', 'g', 'mail ada@lovelace.com and grace@hopper.com ok');
    assert.equal(r.count, 2);
    assert.deepEqual(r.matches[0].groups, ['ada', 'lovelace']);
    assert.deepEqual(r.matches[1].groups, ['grace', 'hopper']);
    assert.equal(r.matches[0].match, 'ada@lovelace.com');
  });

  await test('catastrophic pattern (a+)+$ times out (no hang) within 3s', async () => {
    const started = Date.now();
    const r = await regex.testRegex('(a+)+$', '', 'a'.repeat(40) + 'b', { timeoutMs: 2000 });
    const elapsed = Date.now() - started;
    assert.equal(r.timedOut, true, 'expected a timeout result');
    assert.ok(r.error.includes('timed out'), 'timeout error message expected');
    assert.ok(elapsed < 3000, `expected < 3000ms, took ${elapsed}ms`);
  });

  await test('replace preview', async () => {
    const r = await regex.replaceRegex('(\\d{4})-(\\d{2})-(\\d{2})', 'g', 'due 2026-07-06', '$3/$2/$1');
    assert.equal(r.output, 'due 06/07/2026');
  });

  // ── 10. Timestamp ─────────────────────────────────────────────────────────
  console.log('timestamp');

  await test('1700000000 -> 2023-11-14T22:13:20.000Z (auto-detected seconds)', () => {
    const r = timestamp.convertTimestamp('1700000000');
    assert.equal(r.detected, 's');
    assert.equal(r.iso, '2023-11-14T22:13:20.000Z');
    assert.equal(r.unixMs, 1700000000000);
  });

  await test('13-digit input auto-detects as milliseconds', () => {
    const r = timestamp.convertTimestamp('1700000000000');
    assert.equal(r.detected, 'ms');
    assert.equal(r.iso, '2023-11-14T22:13:20.000Z');
    assert.equal(r.unixSeconds, 1700000000);
  });

  await test('ISO string parses back to unix', () => {
    const r = timestamp.convertTimestamp('2023-11-14T22:13:20.000Z');
    assert.equal(r.unixSeconds, 1700000000);
  });
} finally {
  // Cleanup: delete generated fixtures. No processes were spawned — worker
  // threads are terminated inline — so there is nothing to kill.
  fs.rmSync(FIXTURE_DIR, { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
