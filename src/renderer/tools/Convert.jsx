import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { run, useDebounced, TextBox, OutputPane, Row, Opt, Seg, Split, PaneLabel, OpenFileButton } from '../ui.jsx';
import { Recents } from '../recents.jsx';
import { saveRecent } from '../store.js';

const EXT = { json: 'json', csv: 'csv', yaml: 'yaml', xml: 'xml' };

export default function Convert() {
  const [input, setInput] = useState('');
  const [from, setFrom] = useState('auto');
  const [to, setTo] = useState('yaml');
  const [indent, setIndent] = useState(2);
  const [delimiter, setDelimiter] = useState(',');
  const [header, setHeader] = useState(true);
  const [output, setOutput] = useState('');
  const [detected, setDetected] = useState(null);
  const [error, setError] = useState(null);

  const dInput = useDebounced(input, 300);

  useEffect(() => {
    let live = true;
    (async () => {
      if (!dInput.trim()) { setOutput(''); setError(null); setDetected(null); return; }
      try {
        const r = await run('convert', 'convert', [dInput, from, to, { indent, delimiter, header }]);
        if (!live) return;
        setOutput(r.output); setDetected(r.from); setError(null);
        saveRecent('convert', dInput);
      } catch (e) {
        if (!live) return;
        setOutput(''); setError(e.message);
      }
    })();
    return () => { live = false; };
  }, [dInput, from, to, indent, delimiter, header]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <Row>
        <Seg options={['auto', 'json', 'csv', 'yaml', 'xml']} value={from} onChange={setFrom} />
        <ArrowRight size={15} style={{ color: 'var(--muted)' }} />
        <Seg options={['json', 'csv', 'yaml', 'xml']} value={to} onChange={setTo} />
        <div style={{ flex: 1 }} />
        <Opt label="Indent">
          <select value={indent} onChange={(e) => setIndent(+e.target.value)}>
            <option value={2}>2</option><option value={4}>4</option>
          </select>
        </Opt>
        <Opt label="CSV delimiter">
          <input type="text" value={delimiter} onChange={(e) => setDelimiter(e.target.value)} style={{ width: 42, textAlign: 'center' }} maxLength={1} />
        </Opt>
        <Opt label="Header row">
          <input type="checkbox" checked={header} onChange={(e) => setHeader(e.target.checked)} />
        </Opt>
      </Row>
      <Split
        left={
          <>
            <Row>
              <PaneLabel>Input</PaneLabel>
              {detected && from === 'auto' && <span className="badge badge-blue">detected: {detected}</span>}
              <div style={{ flex: 1 }} />
              <Recents toolId="convert" onPick={setInput} />
              <OpenFileButton onLoad={setInput} />
            </Row>
            <TextBox value={input} onChange={setInput} placeholder={'Paste JSON, CSV, YAML or XML — or drop a file.\nFormat is auto-detected.'} />
          </>
        }
        right={<OutputPane value={output} error={error} name={`converted.${EXT[to]}`} />}
      />
    </div>
  );
}
