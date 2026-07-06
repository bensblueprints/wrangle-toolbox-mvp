import React, { useEffect, useState } from 'react';
import { FileUp } from 'lucide-react';
import { run, useDebounced, TextBox, OutputPane, Row, Opt, Seg, Split, PaneLabel } from '../ui.jsx';
import { Recents } from '../recents.jsx';
import { saveRecent } from '../store.js';

export default function Base64() {
  const [mode, setMode] = useState('base64'); // base64 | url | file
  const [dir, setDir] = useState('encode');
  const [urlSafe, setUrlSafe] = useState(false);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);

  const dInput = useDebounced(input, 250);

  useEffect(() => {
    let live = true;
    (async () => {
      if (mode === 'file') return;
      if (!dInput) { setOutput(''); setError(null); return; }
      try {
        let r;
        if (mode === 'base64') {
          r = dir === 'encode'
            ? await run('base64', 'encodeText', [dInput, { urlSafe }])
            : await run('base64', 'decodeText', [dInput]);
        } else {
          r = dir === 'encode'
            ? await run('base64', 'urlEncode', [dInput])
            : await run('base64', 'urlDecode', [dInput]);
        }
        if (!live) return;
        setOutput(r); setError(null);
        saveRecent('base64', dInput);
      } catch (e) {
        if (!live) return;
        setOutput(''); setError(e.message);
      }
    })();
    return () => { live = false; };
  }, [dInput, mode, dir, urlSafe]);

  const onDropFile = async (file) => {
    try {
      const p = window.wrangle.pathForFile(file);
      const r = await run('base64', 'fileToBase64', [p, { urlSafe }]);
      setFileInfo({ name: r.name, bytes: r.bytes });
      setOutput(r.base64);
      setError(null);
    } catch (e) {
      setError(e.message);
      setOutput('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <Row>
        <Seg options={[{ value: 'base64', label: 'Base64 text' }, { value: 'url', label: 'URL' }, { value: 'file', label: 'File → Base64' }]} value={mode} onChange={(m) => { setMode(m); setOutput(''); setError(null); }} />
        {mode !== 'file' && <Seg options={['encode', 'decode']} value={dir} onChange={setDir} />}
        {mode !== 'url' && (
          <Opt label="base64url (URL-safe)">
            <input type="checkbox" checked={urlSafe} onChange={(e) => setUrlSafe(e.target.checked)} />
          </Opt>
        )}
        {fileInfo && mode === 'file' && <span className="badge badge-blue">{fileInfo.name} — {(fileInfo.bytes / 1024).toFixed(1)} KB</span>}
      </Row>
      <Split
        left={
          mode === 'file' ? (
            <div
              className="panel"
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, border: '2px dashed var(--border2)', color: 'var(--muted)', cursor: 'copy' }}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drop-active'); }}
              onDragLeave={(e) => e.currentTarget.classList.remove('drop-active')}
              onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drop-active'); const f = e.dataTransfer.files?.[0]; if (f) onDropFile(f); }}
            >
              <FileUp size={34} strokeWidth={1.5} />
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>Drop any file here</div>
              <div style={{ fontSize: 12.5 }}>Encoded locally — up to 64 MB</div>
            </div>
          ) : (
            <>
              <Row>
                <PaneLabel>{dir === 'encode' ? 'Plain text' : mode === 'url' ? 'URL-encoded text' : 'Base64 text'}</PaneLabel>
                <div style={{ flex: 1 }} />
                <Recents toolId="base64" onPick={setInput} />
              </Row>
              <TextBox value={input} onChange={setInput} placeholder={dir === 'encode' ? 'Text to encode… (UTF-8 safe, emoji included 🛠️)' : 'Text to decode…'} />
            </>
          )
        }
        right={<OutputPane value={output} error={error} name={mode === 'file' ? 'file.base64.txt' : 'encoded.txt'} />}
      />
    </div>
  );
}
