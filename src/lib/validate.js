// validate.js — validate / pretty-print / minify JSON, YAML, XML with
// precise error line/column reporting. Pure JS, no Electron/DOM imports.
import yaml from 'js-yaml';
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';
import { XML_OPTS } from './convert.js';

function jsonErrorLocation(message, text) {
  // Node/V8 messages: "... at position 25 (line 3 column 8)" or just "... at position 25"
  let m = message.match(/line (\d+) column (\d+)/i);
  if (m) return { line: +m[1], column: +m[2] };
  m = message.match(/position (\d+)/i);
  if (m) {
    const pos = +m[1];
    const before = text.slice(0, pos);
    const line = before.split('\n').length;
    const column = pos - before.lastIndexOf('\n');
    return { line, column };
  }
  return { line: null, column: null };
}

export function validateJson(text) {
  try {
    JSON.parse(text);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message, ...jsonErrorLocation(e.message, text) };
  }
}

export function validateYaml(text) {
  try {
    yaml.load(text);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e.reason || e.message,
      line: e.mark ? e.mark.line + 1 : null,
      column: e.mark ? e.mark.column + 1 : null,
    };
  }
}

export function validateXml(text) {
  const r = XMLValidator.validate(text);
  if (r === true) return { ok: true };
  return { ok: false, error: r.err.msg, line: r.err.line ?? null, column: r.err.col ?? null };
}

export function validate(text, format) {
  if (format === 'json') return validateJson(text);
  if (format === 'yaml') return validateYaml(text);
  if (format === 'xml') return validateXml(text);
  throw new Error(`Unknown format: ${format}`);
}

export function formatJson(text, indent = 2) {
  const v = validateJson(text);
  if (!v.ok) return v;
  return { ok: true, output: JSON.stringify(JSON.parse(text), null, indent) };
}

export function minifyJson(text) {
  const v = validateJson(text);
  if (!v.ok) return v;
  return { ok: true, output: JSON.stringify(JSON.parse(text)) };
}

export function formatYaml(text, indent = 2) {
  const v = validateYaml(text);
  if (!v.ok) return v;
  return { ok: true, output: yaml.dump(yaml.load(text), { indent, lineWidth: 120 }) };
}

export function formatXml(text, indent = 2) {
  const v = validateXml(text);
  if (!v.ok) return v;
  const parsed = new XMLParser(XML_OPTS).parse(text);
  const out = new XMLBuilder({ ...XML_OPTS, format: true, indentBy: ' '.repeat(indent) }).build(parsed);
  return { ok: true, output: out.trimEnd() };
}

export function minifyXml(text) {
  const v = validateXml(text);
  if (!v.ok) return v;
  const parsed = new XMLParser(XML_OPTS).parse(text);
  return { ok: true, output: new XMLBuilder({ ...XML_OPTS, format: false }).build(parsed) };
}

export function run(text, format, action, indent = 2) {
  if (action === 'validate') return validate(text, format);
  if (action === 'format') {
    if (format === 'json') return formatJson(text, indent);
    if (format === 'yaml') return formatYaml(text, indent);
    if (format === 'xml') return formatXml(text, indent);
  }
  if (action === 'minify') {
    if (format === 'json') return minifyJson(text);
    if (format === 'yaml') return formatYaml(text, 2); // YAML has no meaningful minified form
    if (format === 'xml') return minifyXml(text);
  }
  throw new Error(`Unknown action/format: ${action}/${format}`);
}
