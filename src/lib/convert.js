// convert.js — any-to-any conversion between JSON / CSV / YAML / XML.
// Pure JS, no Electron/DOM imports. Runs under plain Node for tests.
//
// CSV flatten rules (documented, deterministic):
//   - Nested objects flatten with dot notation:  { a: { b: 1 } }  ->  column "a.b"
//   - Arrays serialize as JSON strings:          { tags: ["x"] }  ->  column "tags" = '["x"]'
//   - On CSV -> JSON, dot columns un-flatten and JSON-looking cells parse back.
import Papa from 'papaparse';
import yaml from 'js-yaml';
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';

export const FORMATS = ['json', 'csv', 'yaml', 'xml'];

// Locked fast-xml-parser options (attributes preserved with @_ prefix).
export const XML_OPTS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: true,
  trimValues: true,
};

export function detectFormat(text) {
  const t = (text || '').trim();
  if (!t) return null;
  if (t.startsWith('{') || t.startsWith('[')) {
    try { JSON.parse(t); return 'json'; } catch { /* fall through */ }
  }
  if (t.startsWith('<')) return 'xml';
  const lines = t.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length >= 2) {
    const cols = lines[0].split(',').length;
    if (cols > 1 && lines.slice(1, 6).every((l) => l.split(',').length >= cols)) return 'csv';
  }
  try {
    const y = yaml.load(t);
    if (y && typeof y === 'object') return 'yaml';
  } catch { /* not yaml */ }
  return null;
}

export function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else if (Array.isArray(v)) out[key] = JSON.stringify(v);
    else out[key] = v;
  }
  return out;
}

export function unflatten(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    let val = v;
    if (typeof val === 'string') {
      const t = val.trim();
      if ((t.startsWith('[') && t.endsWith(']')) || (t.startsWith('{') && t.endsWith('}'))) {
        try { val = JSON.parse(t); } catch { /* keep string */ }
      }
    }
    const parts = k.split('.');
    let cur = out;
    for (let i = 0; i < parts.length - 1; i++) {
      if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
  }
  return out;
}

export function parseInput(text, format, opts = {}) {
  switch (format) {
    case 'json':
      return JSON.parse(text);
    case 'yaml':
      return yaml.load(text);
    case 'xml': {
      const v = XMLValidator.validate(text);
      if (v !== true) throw new Error(`Invalid XML: ${v.err.msg} (line ${v.err.line})`);
      return new XMLParser({ ...XML_OPTS, ...(opts.xml || {}) }).parse(text);
    }
    case 'csv': {
      const r = Papa.parse(text.trim(), {
        header: opts.header !== false,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimiter: opts.delimiter || '',
      });
      if (r.errors.length) {
        const e = r.errors[0];
        throw new Error(`CSV parse error: ${e.message}${e.row != null ? ` (row ${e.row + 1})` : ''}`);
      }
      return opts.header !== false ? r.data.map(unflatten) : r.data;
    }
    default:
      throw new Error(`Unknown input format: ${format}`);
  }
}

export function serializeOutput(data, format, opts = {}) {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, opts.indent ?? 2);
    case 'yaml':
      return yaml.dump(data, { indent: opts.indent ?? 2, lineWidth: 120 });
    case 'xml': {
      const builder = new XMLBuilder({
        ...XML_OPTS,
        format: true,
        indentBy: ' '.repeat(opts.indent ?? 2),
      });
      let wrapped = data;
      if (Array.isArray(data)) wrapped = { root: { item: data } };
      else if (data === null || typeof data !== 'object') wrapped = { root: data };
      else if (Object.keys(data).length !== 1) wrapped = { root: data };
      return builder.build(wrapped);
    }
    case 'csv': {
      const rows = Array.isArray(data) ? data : [data];
      if (!rows.length) return '';
      if (!rows.every((r) => r && typeof r === 'object' && !Array.isArray(r))) {
        throw new Error(
          'This structure cannot map to CSV: expected an object or an array of objects. ' +
          'Nested objects flatten with dot notation; arrays become JSON strings.'
        );
      }
      const flat = rows.map((r) => flatten(r));
      const fields = [...new Set(flat.flatMap((r) => Object.keys(r)))];
      return Papa.unparse(flat, { columns: fields, delimiter: opts.delimiter || ',' });
    }
    default:
      throw new Error(`Unknown output format: ${format}`);
  }
}

export function convert(text, from, to, opts = {}) {
  const src = !from || from === 'auto' ? detectFormat(text) : from;
  if (!src) throw new Error('Could not auto-detect the input format — pick one manually.');
  if (!FORMATS.includes(src)) throw new Error(`Unknown format: ${src}`);
  if (!FORMATS.includes(to)) throw new Error(`Unknown format: ${to}`);
  const data = parseInput(text, src, opts);
  return { from: src, to, output: serializeOutput(data, to, opts) };
}
