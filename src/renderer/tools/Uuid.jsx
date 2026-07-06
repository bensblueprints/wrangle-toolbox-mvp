import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { run, Row, Opt, Seg, CopyButton, SaveButton } from '../ui.jsx';

export default function Uuid() {
  const [version, setVersion] = useState(4);
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [list, setList] = useState([]);

  const generate = async (v = version, n = count, u = uppercase) => {
    const r = await run('uuid', 'generate', [{ version: v, count: n, uppercase: u }]);
    setList(r);
  };

  useEffect(() => { generate(); }, []); // eslint-disable-line

  const all = list.join('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <Row>
        <Seg options={[{ value: 4, label: 'v4 (random)' }, { value: 7, label: 'v7 (time-ordered)' }]} value={version} onChange={(v) => { setVersion(v); generate(v, count, uppercase); }} />
        <Opt label="Count">
          <input type="number" min={1} max={10000} value={count} onChange={(e) => setCount(+e.target.value || 1)} style={{ width: 80 }} />
        </Opt>
        <Opt label="UPPERCASE">
          <input type="checkbox" checked={uppercase} onChange={(e) => { setUppercase(e.target.checked); generate(version, count, e.target.checked); }} />
        </Opt>
        <button className="btn btn-primary" onClick={() => generate()}>
          <RefreshCw size={14} /> Generate
        </button>
        <div style={{ flex: 1 }} />
        <CopyButton text={all} label="Copy all" className="btn" />
        <SaveButton text={all} name="uuids.txt" />
      </Row>
      <div className="panel" style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 6 }}>
        {list.map((u, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--muted)', fontSize: 11.5, width: 40, textAlign: 'right' }}>{i + 1}</span>
            <span className="mono" style={{ flex: 1 }}>{u}</span>
            <CopyButton text={u} label="" />
          </div>
        ))}
      </div>
    </div>
  );
}
