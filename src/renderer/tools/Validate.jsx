import React, { useEffect, useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { run, useDebounced, TextBox, OutputPane, ErrorBanner, Row, Opt, Seg, Split, PaneLabel, OpenFileButton } from '../ui.jsx';
import { Recents } from '../recents.jsx';
import { saveRecent } from '../store.js';

export default function Validate() {
  const [input, setInput] = useState('');
  const [format, setFormat] = useState('json');
  const [action, setAction] = useState('format');
  const [indent, setIndent] = useState(2);
  const [result, setResult] = useState(null);

  const dInput = useDebounced(input, 300);

  useEffect(() => {
    let live = true;
    (async () => {
      if (!dInput.trim()) { setResult(null); return; }
      try {
        const r = await run('validate', 'run', [dInput, format, action, indent]);
        if (!live) return;
        setResult(r);
        if (r.ok) saveRecent('validate', dInput);
      } catch (e) {
        if (live) setResult({ ok: false, error: e.message });
      }
    })();
    return () => { live = false; };
  }, [dInput, format, action, indent]);

  const valid = result?.ok;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <Row>
        <Seg options={['json', 'yaml', 'xml']} value={format} onChange={setFormat} />
        <Seg options={[{ value: 'format', label: 'Pretty-print' }, { value: 'minify', label: 'Minify' }, { value: 'validate', label: 'Validate only' }]} value={action} onChange={setAction} />
        <Opt label="Indent">
          <select value={indent} onChange={(e) => setIndent(+e.target.value)}>
            <option value={2}>2</option><option value={4}>4</option>
          </select>
        </Opt>
        <div style={{ flex: 1 }} />
        {result && (valid
          ? <span className="badge badge-green"><BadgeCheck size={13} /> Valid {format.toUpperCase()}</span>
          : <span className="badge badge-red">Invalid{result.line != null ? ` — line ${result.line}` : ''}</span>)}
      </Row>
      <Split
        left={
          <>
            <Row>
              <PaneLabel>Input</PaneLabel>
              <div style={{ flex: 1 }} />
              <Recents toolId="validate" onPick={setInput} />
              <OpenFileButton onLoad={setInput} />
            </Row>
            <TextBox value={input} onChange={setInput} placeholder={`Paste ${format.toUpperCase()} to validate / format — or drop a file.`} />
          </>
        }
        right={
          result && !valid ? (
            <div className="panel" style={{ flex: 1, overflow: 'auto' }}>
              <ErrorBanner error={result.error} line={result.line} column={result.column} />
              {result.line != null && dInput && (
                <pre className="mono" style={{ margin: 12, padding: 0, whiteSpace: 'pre-wrap' }}>
                  {dInput.split('\n').map((l, i) => (
                    <div key={i} style={i + 1 === result.line ? { background: 'var(--red-soft)', color: 'var(--red)', borderRadius: 4 } : undefined}>
                      <span style={{ color: 'var(--muted)', display: 'inline-block', width: 36, textAlign: 'right', marginRight: 10, userSelect: 'none' }}>{i + 1}</span>
                      {l}
                    </div>
                  ))}
                </pre>
              )}
            </div>
          ) : (
            <OutputPane value={valid ? (result.output ?? '✓ Valid — no output for validate-only mode') : ''} name={`formatted.${format}`} />
          )
        }
      />
    </div>
  );
}
