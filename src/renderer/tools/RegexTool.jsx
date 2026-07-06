import React, { useEffect, useMemo, useState } from 'react';
import { run, useDebounced, TextBox, Row, PaneLabel, CopyButton, ErrorBanner } from '../ui.jsx';
import { Recents } from '../recents.jsx';
import { saveRecent } from '../store.js';

const CHEATSHEET = [
  { name: 'Email', pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.]+' },
  { name: 'URL', pattern: 'https?://[\\w.-]+(?:/[\\w./?%&=+-]*)?' },
  { name: 'IPv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b' },
  { name: 'UUID', pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' },
  { name: 'ISO date', pattern: '\\d{4}-\\d{2}-\\d{2}' },
  { name: 'Hex color', pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b' },
];

function Highlighted({ text, matches }) {
  const chunks = useMemo(() => {
    if (!matches?.length) return [{ t: text }];
    const out = [];
    let pos = 0;
    for (const m of matches) {
      if (m.index > pos) out.push({ t: text.slice(pos, m.index) });
      out.push({ t: text.slice(m.index, m.end), hit: true });
      pos = m.end;
    }
    if (pos < text.length) out.push({ t: text.slice(pos) });
    return out;
  }, [text, matches]);
  return (
    <pre className="mono" style={{ margin: 0, padding: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflow: 'auto', flex: 1 }}>
      {chunks.map((c, i) => (c.hit ? <mark key={i} className="rx">{c.t}</mark> : <span key={i}>{c.t}</span>))}
    </pre>
  );
}

export default function RegexTool() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('');
  const [replacement, setReplacement] = useState('');
  const [result, setResult] = useState(null);
  const [replaced, setReplaced] = useState(null);

  const dPattern = useDebounced(pattern, 300);
  const dFlags = useDebounced(flags, 300);
  const dText = useDebounced(text, 300);
  const dRepl = useDebounced(replacement, 300);

  useEffect(() => {
    let live = true;
    (async () => {
      if (!dPattern || !dText) { setResult(null); setReplaced(null); return; }
      const r = await run('regex', 'testRegex', [dPattern, dFlags, dText]).catch((e) => ({ error: e.message }));
      if (!live) return;
      setResult(r);
      if (!r.error) saveRecent('regex', dText);
      if (dRepl !== '' && !r.error) {
        const rep = await run('regex', 'replaceRegex', [dPattern, dFlags, dText, dRepl]).catch((e) => ({ error: e.message }));
        if (live) setReplaced(rep);
      } else {
        setReplaced(null);
      }
    })();
    return () => { live = false; };
  }, [dPattern, dFlags, dText, dRepl]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <Row>
        <span className="mono" style={{ color: 'var(--muted)' }}>/</span>
        <input type="text" className="mono" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="(\\w+)@(\\w+)\\.com" style={{ flex: 1 }} />
        <span className="mono" style={{ color: 'var(--muted)' }}>/</span>
        <input type="text" className="mono" value={flags} onChange={(e) => setFlags(e.target.value)} placeholder="gim" style={{ width: 70 }} />
        {result && !result.error && <span className="badge badge-blue">{result.count} match{result.count === 1 ? '' : 'es'}</span>}
        {result?.timedOut && <span className="badge badge-red">timed out</span>}
      </Row>
      <Row style={{ gap: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Common patterns:</span>
        {CHEATSHEET.map((c) => (
          <button key={c.name} className="btn btn-sm" onClick={() => setPattern(c.pattern)}>{c.name}</button>
        ))}
        <div style={{ flex: 1 }} />
        <Recents toolId="regex" onPick={setText} />
      </Row>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <PaneLabel>Test text</PaneLabel>
          <TextBox value={text} onChange={setText} placeholder="Paste text to test against — or drop a file." />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <PaneLabel>Matches (highlighted)</PaneLabel>
          <div className="panel" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {result?.error ? <ErrorBanner error={result.error} /> : <Highlighted text={dText} matches={result?.matches} />}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, flex: 1, minHeight: 0 }}>
        <div className="panel" style={{ minHeight: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ color: 'var(--muted)', textAlign: 'left', position: 'sticky', top: 0, background: 'var(--panel)' }}>
                <th style={{ padding: '8px 10px' }}>#</th>
                <th style={{ padding: '8px 10px' }}>Index</th>
                <th style={{ padding: '8px 10px' }}>Match</th>
                <th style={{ padding: '8px 10px' }}>Groups</th>
              </tr>
            </thead>
            <tbody className="mono">
              {(result?.matches || []).map((m, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 10px', color: 'var(--muted)' }}>{i + 1}</td>
                  <td style={{ padding: '6px 10px' }}>{m.index}</td>
                  <td style={{ padding: '6px 10px', wordBreak: 'break-all' }}>{m.match}</td>
                  <td style={{ padding: '6px 10px', wordBreak: 'break-all', color: 'var(--accent)' }}>
                    {m.groups.map((g, gi) => `$${gi + 1}=${g ?? '∅'}`).join('  ')}
                    {m.named ? '  ' + Object.entries(m.named).map(([k, v]) => `${k}=${v}`).join('  ') : ''}
                  </td>
                </tr>
              ))}
              {!result?.matches?.length && (
                <tr><td colSpan={4} style={{ padding: 14, color: 'var(--muted)' }}>Match table appears here</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <Row>
            <PaneLabel>Replace preview</PaneLabel>
            <input type="text" className="mono" value={replacement} onChange={(e) => setReplacement(e.target.value)} placeholder="replacement, e.g. $2/$1" style={{ flex: 1 }} />
            <CopyButton text={replaced?.output || ''} />
          </Row>
          <div className="panel" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <pre className="mono" style={{ margin: 0, padding: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: replaced?.output ? 'var(--text)' : 'var(--muted)' }}>
              {replaced?.error || replaced?.output || 'Type a replacement to preview'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
