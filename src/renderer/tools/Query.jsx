import React, { useEffect, useState } from 'react';
import { run, useDebounced, TextBox, OutputPane, Row, Split, PaneLabel, OpenFileButton } from '../ui.jsx';
import { Recents } from '../recents.jsx';
import { saveRecent } from '../store.js';

const CHEATSHEET = [
  { expr: '$.store.book[*].author', desc: 'all authors' },
  { expr: '$..author', desc: 'authors, anywhere' },
  { expr: '$..book[2]', desc: 'third book' },
  { expr: '$..book[-1:]', desc: 'last book' },
  { expr: '$..book[?(@.isbn)]', desc: 'books with ISBN' },
  { expr: '$..book[?(@.price<10)]', desc: 'price under 10' },
  { expr: '$.store.*', desc: 'children of store' },
];

export default function Query() {
  const [input, setInput] = useState('');
  const [path, setPath] = useState('$');
  const [output, setOutput] = useState('');
  const [count, setCount] = useState(null);
  const [error, setError] = useState(null);

  const dInput = useDebounced(input, 300);
  const dPath = useDebounced(path, 250);

  useEffect(() => {
    let live = true;
    (async () => {
      if (!dInput.trim() || !dPath.trim()) { setOutput(''); setCount(null); setError(null); return; }
      try {
        const r = await run('query', 'runJsonPath', [dInput, dPath]);
        if (!live) return;
        setOutput(JSON.stringify(r.result, null, 2));
        setCount(r.count);
        setError(null);
        saveRecent('query', dInput);
      } catch (e) {
        if (!live) return;
        setOutput(''); setCount(null); setError(e.message);
      }
    })();
    return () => { live = false; };
  }, [dInput, dPath]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <Row>
        <input
          type="text"
          className="mono"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="$.store.book[?(@.price<10)].title"
          style={{ flex: 1, padding: '9px 12px' }}
        />
        {count != null && <span className="badge badge-blue">{count} result{count === 1 ? '' : 's'}</span>}
      </Row>
      <Row style={{ gap: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Cheatsheet:</span>
        {CHEATSHEET.map((c) => (
          <button key={c.expr} className="btn btn-sm mono" title={c.desc} onClick={() => setPath(c.expr)} style={{ fontSize: 11 }}>
            {c.expr}
          </button>
        ))}
      </Row>
      <Split
        left={
          <>
            <Row>
              <PaneLabel>JSON input</PaneLabel>
              <div style={{ flex: 1 }} />
              <Recents toolId="query" onPick={setInput} />
              <OpenFileButton onLoad={setInput} />
            </Row>
            <TextBox value={input} onChange={setInput} placeholder="Paste JSON to query — or drop a file." />
          </>
        }
        right={<OutputPane value={output} error={error} name="query-result.json" placeholder="Matching values appear here as a JSON array" />}
      />
    </div>
  );
}
