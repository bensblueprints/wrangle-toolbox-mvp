import React, { useEffect, useState } from 'react';
import { FileUp, Fingerprint } from 'lucide-react';
import { run, useDebounced, TextBox, Row, Opt, Seg, PaneLabel, CopyButton, ErrorBanner } from '../ui.jsx';
import { Recents } from '../recents.jsx';
import { saveRecent } from '../store.js';

const ALGOS = ['md5', 'sha1', 'sha256', 'sha512'];
const LABEL = { md5: 'MD5', sha1: 'SHA-1', sha256: 'SHA-256', sha512: 'SHA-512' };

export default function Hash() {
  const [mode, setMode] = useState('text');
  const [input, setInput] = useState('');
  const [hmacKey, setHmacKey] = useState('');
  const [uppercase, setUppercase] = useState(false);
  const [digests, setDigests] = useState(null);
  const [error, setError] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [busy, setBusy] = useState(false);

  const dInput = useDebounced(input, 250);
  const dKey = useDebounced(hmacKey, 250);

  useEffect(() => {
    let live = true;
    (async () => {
      if (mode !== 'text') return;
      if (!dInput) { setDigests(null); setError(null); return; }
      try {
        let out;
        if (dKey) {
          out = {};
          for (const a of ALGOS) out[a] = await run('hash', 'hmacText', [dInput, dKey, a, { uppercase }]);
        } else {
          out = await run('hash', 'hashTextAll', [dInput, { uppercase }]);
        }
        if (!live) return;
        setDigests(out); setError(null);
        saveRecent('hash', dInput);
      } catch (e) {
        if (live) { setDigests(null); setError(e.message); }
      }
    })();
    return () => { live = false; };
  }, [dInput, dKey, uppercase, mode]);

  const onDropFile = async (file) => {
    try {
      setBusy(true);
      const p = window.wrangle.pathForFile(file);
      setFileInfo({ name: file.name, bytes: file.size });
      const out = await run('hash', 'hashFileAll', [p, { uppercase }]);
      setDigests(out); setError(null);
    } catch (e) {
      setError(e.message); setDigests(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <Row>
        <Seg options={[{ value: 'text', label: 'Text' }, { value: 'file', label: 'File' }]} value={mode} onChange={(m) => { setMode(m); setDigests(null); setError(null); }} />
        <Opt label="UPPERCASE">
          <input type="checkbox" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} />
        </Opt>
        {mode === 'text' && (
          <Opt label="HMAC key (optional)">
            <input type="text" value={hmacKey} onChange={(e) => setHmacKey(e.target.value)} placeholder="leave empty for plain hash" style={{ width: 220 }} />
          </Opt>
        )}
        {fileInfo && mode === 'file' && <span className="badge badge-blue">{fileInfo.name} — {(fileInfo.bytes / 1048576).toFixed(2)} MB</span>}
        {busy && <span className="badge badge-amber">hashing…</span>}
      </Row>
      {mode === 'text' ? (
        <>
          <Row>
            <PaneLabel>Input text</PaneLabel>
            <div style={{ flex: 1 }} />
            <Recents toolId="hash" onPick={setInput} />
          </Row>
          <TextBox value={input} onChange={setInput} placeholder="Text to hash…" style={{ flex: 'none', height: 140 }} />
        </>
      ) : (
        <div
          className="panel"
          style={{ height: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, border: '2px dashed var(--border2)', color: 'var(--muted)', cursor: 'copy' }}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drop-active'); }}
          onDragLeave={(e) => e.currentTarget.classList.remove('drop-active')}
          onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drop-active'); const f = e.dataTransfer.files?.[0]; if (f) onDropFile(f); }}
        >
          <FileUp size={30} strokeWidth={1.5} />
          <div style={{ fontWeight: 600, color: 'var(--text)' }}>Drop a file to hash</div>
          <div style={{ fontSize: 12.5 }}>Streamed from disk — multi-GB files are fine</div>
        </div>
      )}
      {error && <ErrorBanner error={error} />}
      <div className="panel" style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 6 }}>
        {ALGOS.map((a) => (
          <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 10px', borderBottom: '1px solid var(--border)' }}>
            <span className="badge badge-muted" style={{ width: 74, justifyContent: 'center' }}>{LABEL[a]}</span>
            <span className="mono" style={{ flex: 1, wordBreak: 'break-all', color: digests ? 'var(--text)' : 'var(--muted)' }}>
              {digests?.[a] || '—'}
            </span>
            <CopyButton text={digests?.[a] || ''} />
          </div>
        ))}
        {dKey && mode === 'text' && (
          <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 6, alignItems: 'center' }}>
            <Fingerprint size={13} /> HMAC mode active — digests are keyed with your secret.
          </div>
        )}
      </div>
    </div>
  );
}
