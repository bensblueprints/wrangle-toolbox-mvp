import React, { useEffect, useRef, useState } from 'react';
import { History } from 'lucide-react';
import { getRecents } from './store.js';

function ago(ts) {
  const d = Date.now() - ts;
  if (d < 60000) return 'just now';
  if (d < 3600000) return `${Math.round(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.round(d / 3600000)}h ago`;
  return `${Math.round(d / 86400000)}d ago`;
}

export function Recents({ toolId, onPick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [open]);

  const items = getRecents(toolId);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn btn-sm" onClick={() => setOpen(!open)} title="Recent inputs">
        <History size={13} /> Recent
      </button>
      {open && (
        <div className="panel" style={{ position: 'absolute', top: '110%', left: 0, zIndex: 40, width: 360, maxHeight: 300, overflow: 'auto', boxShadow: '0 12px 32px rgba(0,0,0,0.45)', padding: 4 }}>
          {items.length === 0 && (
            <div style={{ padding: 14, color: 'var(--muted)', fontSize: 12.5 }}>No recent inputs for this tool yet.</div>
          )}
          {items.map((e, i) => (
            <button
              key={i}
              onClick={() => { onPick(e.input); setOpen(false); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)' }}
              onMouseEnter={(ev) => (ev.currentTarget.style.background = 'var(--panel2)')}
              onMouseLeave={(ev) => (ev.currentTarget.style.background = 'transparent')}
            >
              <div className="mono" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 11.5 }}>
                {e.input.slice(0, 120).replace(/\s+/g, ' ')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{ago(e.at)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
