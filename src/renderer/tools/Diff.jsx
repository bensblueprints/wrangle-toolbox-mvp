import React, { useEffect, useState } from 'react';
import { run, useDebounced, TextBox, Row, Opt, PaneLabel, CopyButton } from '../ui.jsx';

export default function Diff() {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [smart, setSmart] = useState(false);
  const [result, setResult] = useState(null);

  const dLeft = useDebounced(left, 300);
  const dRight = useDebounced(right, 300);

  useEffect(() => {
    let live = true;
    (async () => {
      if (!dLeft && !dRight) { setResult(null); return; }
      try {
        const r = await run('differ', 'textDiff', [dLeft, dRight, { smartJson: smart }]);
        if (live) setResult(r);
      } catch (e) {
        if (live) setResult({ error: e.message });
      }
    })();
    return () => { live = false; };
  }, [dLeft, dRight, smart]);

  const diffText = result?.parts
    ? result.parts.map((p) => p.value.replace(/\n$/, '').split('\n').map((l) => `${p.added ? '+ ' : p.removed ? '- ' : '  '}${l}`).join('\n')).join('\n')
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <Row>
        <Opt label="Smart JSON diff (ignores key order + whitespace)">
          <input type="checkbox" checked={smart} onChange={(e) => setSmart(e.target.checked)} />
        </Opt>
        <div style={{ flex: 1 }} />
        {result && !result.error && (
          result.changed ? (
            <>
              <span className="badge badge-green">+{result.addedLines} added</span>
              <span className="badge badge-red">−{result.removedLines} removed</span>
              {smart && result.normalized && <span className="badge badge-blue">normalized</span>}
            </>
          ) : (
            (dLeft || dRight) && <span className="badge badge-green">No differences</span>
          )
        )}
      </Row>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <PaneLabel>Original</PaneLabel>
          <TextBox value={left} onChange={setLeft} placeholder="Paste original text / JSON — or drop a file." />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <PaneLabel>Changed</PaneLabel>
          <TextBox value={right} onChange={setRight} placeholder="Paste changed text / JSON — or drop a file." />
        </div>
      </div>
      <div className="panel" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
          <PaneLabel>Diff</PaneLabel>
          <div style={{ flex: 1 }} />
          <CopyButton text={diffText} />
        </div>
        <pre className="mono" style={{ flex: 1, overflow: 'auto', padding: 12, margin: 0 }}>
          {result?.error && <span style={{ color: 'var(--red)' }}>{result.error}</span>}
          {result?.parts?.map((p, i) => (
            <span key={i} className={p.added ? 'diff-added' : p.removed ? 'diff-removed' : ''} style={{ display: 'block', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {p.value.replace(/\n$/, '').split('\n').map((l) => `${p.added ? '+ ' : p.removed ? '- ' : '  '}${l}`).join('\n')}
            </span>
          ))}
          {!result && <span style={{ color: 'var(--muted)' }}>Side-by-side diff appears here</span>}
        </pre>
      </div>
    </div>
  );
}
