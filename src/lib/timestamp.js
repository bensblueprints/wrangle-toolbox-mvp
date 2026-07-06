// timestamp.js — unix s/ms ⇄ ISO 8601 ⇄ UTC ⇄ local, with s-vs-ms
// auto-detection by magnitude. Pure JS, no Electron/DOM imports.

export function detectUnit(numericString) {
  // 10-digit unix seconds cover 2001–2286; 13 digits = milliseconds.
  const digits = numericString.replace(/^-/, '').length;
  return digits >= 12 ? 'ms' : 's';
}

function relativeTime(date) {
  const diffMs = date.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const units = [
    ['year', 31557600000],
    ['month', 2629800000],
    ['day', 86400000],
    ['hour', 3600000],
    ['minute', 60000],
    ['second', 1000],
  ];
  for (const [unit, ms] of units) {
    if (abs >= ms || unit === 'second') {
      return rtf.format(Math.round(diffMs / ms), unit);
    }
  }
}

export function convertTimestamp(input) {
  const t = String(input ?? '').trim();
  if (!t) throw new Error('Enter a unix timestamp (seconds or ms) or a date string.');
  let date;
  let detected;
  if (/^-?\d+$/.test(t)) {
    detected = detectUnit(t);
    const n = Number(t);
    date = new Date(detected === 'ms' ? n : n * 1000);
  } else {
    detected = 'date';
    date = new Date(t);
  }
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Could not parse "${t}" as a timestamp or date.`);
  }
  return {
    input: t,
    detected,
    unixSeconds: Math.floor(date.getTime() / 1000),
    unixMs: date.getTime(),
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toString(),
    relative: relativeTime(date),
  };
}

export function now() {
  return convertTimestamp(String(Date.now()));
}
