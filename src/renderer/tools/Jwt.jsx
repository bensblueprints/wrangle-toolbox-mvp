import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldX, Clock } from 'lucide-react';
import { run, useDebounced, TextBox, Row, PaneLabel, CopyButton, ErrorBanner } from '../ui.jsx';
import { Recents } from '../recents.jsx';
import { saveRecent } from '../store.js';

function JsonPane({ title, value }) {
  const text = value ? JSON.stringify(value, null, 2) : '';
  return (
    <div className="panel" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
        <PaneLabel>{title}</PaneLabel>
        <div style={{ flex: 1 }} />
        <CopyButton text={text} />
      </div>
      <pre className="mono" style={{ flex: 1, overflow: 'auto', padding: 12, margin: 0, color: text ? 'var(--text)' : 'var(--muted)' }}>
        {text || '—'}
      </pre>
    </div>
  );
}

export default function Jwt() {
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState(null);
  const [error, setError] = useState(null);
  const [secret, setSecret] = useState('');
  const [verify, setVerify] = useState(null);

  const dToken = useDebounced(token, 250);

  useEffect(() => {
    let live = true;
    setVerify(null);
    (async () => {
      if (!dToken.trim()) { setDecoded(null); setError(null); return; }
      try {
        const r = await run('jwt', 'decodeJwt', [dToken]);
        if (!live) return;
        setDecoded(r); setError(null);
        saveRecent('jwt', dToken);
      } catch (e) {
        if (!live) return;
        setDecoded(null); setError(e.message);
      }
    })();
    return () => { live = false; };
  }, [dToken]);

  const doVerify = async () => {
    try {
      const r = await run('jwt', 'verifyHS256', [dToken, secret]);
      setVerify(r.valid ? 'valid' : 'invalid');
    } catch (e) {
      setVerify(e.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <Row>
        <PaneLabel>Token</PaneLabel>
        {decoded?.algorithm && <span className="badge badge-blue">{decoded.algorithm}</span>}
        {decoded && (decoded.expired
          ? <span className="badge badge-red"><Clock size={12} /> EXPIRED {decoded.expiresAt}</span>
          : decoded.expiresAt
            ? <span className="badge badge-green"><Clock size={12} /> expires {decoded.expiresAt}</span>
            : <span className="badge badge-muted">no expiry claim</span>)}
        <div style={{ flex: 1 }} />
        <Recents toolId="jwt" onPick={setToken} />
      </Row>
      <TextBox value={token} onChange={setToken} placeholder="Paste a JWT (header.payload.signature). Decoding is 100% offline — your token never leaves this machine." style={{ flex: 'none', height: 110 }} />
      {error && <ErrorBanner error={error} />}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, flex: 1, minHeight: 0 }}>
        <JsonPane title="Header" value={decoded?.header} />
        <JsonPane title="Payload" value={decoded?.payload} />
      </div>
      <div className="panel" style={{ padding: 12 }}>
        <Row>
          <ShieldCheck size={15} style={{ color: 'var(--muted)' }} />
          <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
            Signature is <b>not</b> verified by default. Optional HS256 check:
          </span>
          <input type="password" value={secret} onChange={(e) => { setSecret(e.target.value); setVerify(null); }} placeholder="HS256 secret" style={{ width: 220 }} />
          <button className="btn btn-sm" disabled={!decoded || !secret} onClick={doVerify} style={!decoded || !secret ? { opacity: 0.4 } : undefined}>
            Verify signature
          </button>
          {verify === 'valid' && <span className="badge badge-green"><ShieldCheck size={12} /> Signature valid</span>}
          {verify === 'invalid' && <span className="badge badge-red"><ShieldX size={12} /> Signature invalid</span>}
          {verify && verify !== 'valid' && verify !== 'invalid' && <span className="badge badge-amber">{verify}</span>}
        </Row>
      </div>
    </div>
  );
}
