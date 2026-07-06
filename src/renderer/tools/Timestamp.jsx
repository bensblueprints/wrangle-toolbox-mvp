import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { run, useDebounced, Row, CopyButton, ErrorBanner } from '../ui.jsx';

const ROWS = [
  ['unixSeconds', 'Unix (seconds)'],
  ['unixMs', 'Unix (milliseconds)'],
  ['iso', 'ISO 8601 (UTC)'],
  ['utc', 'UTC string'],
  ['local', 'Local time'],
  ['relative', 'Relative'],
];

export default function Timestamp() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const dInput = useDebounced(input, 250);

  useEffect(() => {
    let live = true;
    (async () => {
      if (!dInput.trim()) { setResult(null); setError(null); return; }
      try {
        const r = await run('timestamp', 'convertTimestamp', [dInput]);
        if (!live) return;
        setResult(r); setError(null);
      } catch (e) {
        if (!live) return;
        setResult(null); setError(e.message);
      }
    })();
    return () => { live = false; };
  }, [dInput]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <Row>
        <input
          type="text"
          className="mono"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="1700000000  ·  1700000000000  ·  2023-11-14T22:13:20Z  ·  Nov 14 2023"
          style={{ flex: 1, padding: '10px 12px', fontSize: 14 }}
        />
        <button className="btn btn-primary" onClick={async () => {
          const r = await run('timestamp', 'now', []);
          setInput(String(r.unixMs));
        }}>
          <Clock size={14} /> Now
        </button>
        {result && (
          <span className="badge badge-blue">
            detected: {result.detected === 's' ? 'unix seconds' : result.detected === 'ms' ? 'unix milliseconds' : 'date string'}
          </span>
        )}
      </Row>
      {error && <ErrorBanner error={error} />}
      <div className="panel" style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 6 }}>
        {ROWS.map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 12px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ width: 170, color: 'var(--muted)', fontSize: 12.5, fontWeight: 600 }}>{label}</span>
            <span className="mono" style={{ flex: 1, fontSize: 13.5, color: result ? 'var(--text)' : 'var(--muted)' }}>
              {result ? String(result[key]) : '—'}
            </span>
            <CopyButton text={result ? String(result[key]) : ''} />
          </div>
        ))}
        <div style={{ padding: '12px 12px', fontSize: 12, color: 'var(--muted)' }}>
          Auto-detection: 10-digit numbers are unix seconds, 13-digit numbers are milliseconds. Anything else parses as a date string.
        </div>
      </div>
    </div>
  );
}
