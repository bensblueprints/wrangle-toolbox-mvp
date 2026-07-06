// Shared renderer helpers + small components.
import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Save, FolderOpen, AlertTriangle } from 'lucide-react';

// ── IPC helpers ──────────────────────────────────────────────────────────────
export async function run(mod, fn, args = []) {
  const r = await window.wrangle.run(mod, fn, args);
  if (!r.ok) throw new Error(r.error);
  return r.result;
}

export function useDebounced(value, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

// ── Buttons ──────────────────────────────────────────────────────────────────
export function CopyButton({ text, label = 'Copy', className = 'btn btn-sm' }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className={className}
      disabled={!text}
      style={!text ? { opacity: 0.4, cursor: 'default' } : undefined}
      onClick={async () => {
        await window.wrangle.copy(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
    >
      {copied ? <Check size={13} style={{ color: 'var(--green)' }} /> : <Copy size={13} />}
      {copied ? 'Copied' : label}
    </button>
  );
}

export function SaveButton({ text, name = 'output.txt' }) {
  return (
    <button
      className="btn btn-sm"
      disabled={!text}
      style={!text ? { opacity: 0.4, cursor: 'default' } : undefined}
      onClick={() => window.wrangle.saveFile(text, name)}
    >
      <Save size={13} /> Save
    </button>
  );
}

// ── Text input pane with drag-drop ───────────────────────────────────────────
// onDropFile(file) — if provided, gets the raw File object (for path-based tools).
// Otherwise dropped files are read as text into the textarea.
export function TextBox({ value, onChange, placeholder, onDropFile, rows, style, className = '', spell = false }) {
  const [drag, setDrag] = useState(false);
  return (
    <textarea
      className={`mono ${drag ? 'drop-active' : ''} ${className}`}
      style={{ flex: 1, minHeight: 0, ...style }}
      rows={rows}
      value={value}
      spellCheck={spell}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setDrag(false);
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        if (onDropFile) return onDropFile(file);
        const text = await file.text();
        onChange(text);
      }}
    />
  );
}

export function OpenFileButton({ onLoad, label = 'Open file' }) {
  return (
    <button
      className="btn btn-sm"
      onClick={async () => {
        const f = await window.wrangle.openFile();
        if (f?.content != null) onLoad(f.content, f);
      }}
    >
      <FolderOpen size={13} /> {label}
    </button>
  );
}

// ── Output pane ──────────────────────────────────────────────────────────────
export function OutputPane({ value, error, placeholder = 'Output appears here', name = 'output.txt', children }) {
  return (
    <div className="panel" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Output</span>
        <div style={{ flex: 1 }} />
        {children}
        <CopyButton text={value} />
        <SaveButton text={value} name={name} />
      </div>
      {error ? (
        <ErrorBanner error={error} />
      ) : (
        <pre className="mono" style={{ flex: 1, overflow: 'auto', padding: 12, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: value ? 'var(--text)' : 'var(--muted)' }}>
          {value || placeholder}
        </pre>
      )}
    </div>
  );
}

export function ErrorBanner({ error, line, column }) {
  return (
    <div style={{ margin: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--red-soft)', border: '1px solid var(--red)', color: 'var(--red)', display: 'flex', gap: 8, alignItems: 'flex-start', overflow: 'auto' }}>
      <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
      <div className="mono" style={{ whiteSpace: 'pre-wrap' }}>
        {error}
        {line != null && <div style={{ marginTop: 4, fontWeight: 600 }}>Line {line}{column != null ? `, column ${column}` : ''}</div>}
      </div>
    </div>
  );
}

// ── Layout primitives ────────────────────────────────────────────────────────
export function Row({ children, style }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', ...style }}>{children}</div>;
}

export function Opt({ label, children }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--muted)' }}>
      {children}
      {label}
    </label>
  );
}

export function Seg({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => {
        const val = typeof o === 'string' ? o : o.value;
        const lab = typeof o === 'string' ? o : o.label;
        return (
          <button key={val} className={value === val ? 'on' : ''} onClick={() => onChange(val)}>
            {lab}
          </button>
        );
      })}
    </div>
  );
}

// Two-column tool body (input left, output right)
export function Split({ left, right, ratio = '1fr 1fr' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: ratio, gap: 14, flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>{left}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>{right}</div>
    </div>
  );
}

export function PaneLabel({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{children}</div>;
}
