import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftRight, BadgeCheck, SearchCode, GitCompare, ShieldCheck, Binary,
  Fingerprint, Dices, Regex, Clock, Search, Settings, Wrench, X, Trash2, ExternalLink,
} from 'lucide-react';
import { loadPrefs, getPrefs, updatePrefs, clearHistory } from './store.js';

import Convert from './tools/Convert.jsx';
import Validate from './tools/Validate.jsx';
import Query from './tools/Query.jsx';
import Diff from './tools/Diff.jsx';
import Jwt from './tools/Jwt.jsx';
import Base64 from './tools/Base64.jsx';
import Hash from './tools/Hash.jsx';
import Uuid from './tools/Uuid.jsx';
import RegexTool from './tools/RegexTool.jsx';
import Timestamp from './tools/Timestamp.jsx';

const TOOLS = [
  { id: 'convert', name: 'Convert', desc: 'JSON ⇄ CSV ⇄ YAML ⇄ XML', icon: ArrowLeftRight, C: Convert },
  { id: 'validate', name: 'Validate & Format', desc: 'Pretty-print, minify, error lines', icon: BadgeCheck, C: Validate },
  { id: 'query', name: 'JSONPath Query', desc: 'Query JSON with $.paths', icon: SearchCode, C: Query },
  { id: 'diff', name: 'Diff', desc: 'Text + smart JSON diff', icon: GitCompare, C: Diff },
  { id: 'jwt', name: 'JWT Decoder', desc: 'Decode + verify, fully offline', icon: ShieldCheck, C: Jwt },
  { id: 'base64', name: 'Base64 / URL', desc: 'Encode, decode, file → base64', icon: Binary, C: Base64 },
  { id: 'hash', name: 'Hash', desc: 'MD5 · SHA · HMAC · files', icon: Fingerprint, C: Hash },
  { id: 'uuid', name: 'UUID', desc: 'v4 + v7, bulk generate', icon: Dices, C: Uuid },
  { id: 'regex', name: 'Regex Tester', desc: 'Matches, groups, replace', icon: Regex, C: RegexTool },
  { id: 'timestamp', name: 'Timestamp', desc: 'Unix ⇄ ISO ⇄ local ⇄ relative', icon: Clock, C: Timestamp },
];

function Palette({ onPick, onClose }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const list = TOOLS.filter((t) => (t.name + ' ' + t.desc).toLowerCase().includes(q.toLowerCase()));
  useEffect(() => inputRef.current?.focus(), []);
  useEffect(() => setSel(0), [q]);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', paddingTop: '15vh' }}
      onMouseDown={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: -8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: -8 }} transition={{ duration: 0.12 }}
        className="panel"
        style={{ width: 520, height: 'fit-content', maxHeight: '60vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderBottom: '1px solid var(--border)' }}>
          <Search size={16} style={{ color: 'var(--muted)' }} />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Jump to tool…"
            style={{ flex: 1, border: 'none', background: 'transparent', boxShadow: 'none', fontSize: 15 }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, list.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
              if (e.key === 'Enter' && list[sel]) { onPick(list[sel].id); }
              if (e.key === 'Escape') onClose();
            }}
          />
          <kbd>esc</kbd>
        </div>
        <div style={{ overflow: 'auto', padding: 6 }}>
          {list.map((t, i) => (
            <button
              key={t.id}
              onClick={() => onPick(t.id)}
              onMouseEnter={() => setSel(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px',
                borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                background: i === sel ? 'var(--accent-soft)' : 'transparent', color: 'var(--text)',
              }}
            >
              <t.icon size={16} style={{ color: i === sel ? 'var(--accent)' : 'var(--muted)' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t.desc}</div>
              </div>
            </button>
          ))}
          {!list.length && <div style={{ padding: 16, color: 'var(--muted)', fontSize: 13 }}>No tools match "{q}"</div>}
        </div>
      </motion.div>
    </motion.div>
  );
}

function SettingsModal({ theme, onTheme, onClose }) {
  const [version, setVersion] = useState('');
  const [cleared, setCleared] = useState(false);
  useEffect(() => { window.wrangle.version().then(setVersion); }, []);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={onClose}
    >
      <motion.div
        initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }} transition={{ duration: 0.12 }}
        className="panel" style={{ width: 440, padding: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Settings</h2>
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={15} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, width: 120 }}>Theme</span>
            <div className="seg">
              <button className={theme === 'dark' ? 'on' : ''} onClick={() => onTheme('dark')}>Dark</button>
              <button className={theme === 'light' ? 'on' : ''} onClick={() => onTheme('light')}>Light</button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, width: 120 }}>Recent inputs</span>
            <button className="btn btn-sm" onClick={() => { clearHistory(); setCleared(true); }}>
              <Trash2 size={13} /> {cleared ? 'History cleared' : 'Clear history'}
            </button>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
          <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.7 }}>
            <b style={{ color: 'var(--text)' }}>Wrangle v{version}</b> — the offline developer data toolbox.<br />
            MIT licensed · 100% local, zero network calls, zero telemetry.<br />
            Pay once. Own it forever. No subscription.
          </div>
          <button className="btn" onClick={() => window.wrangle.openExternal('https://whop.com/onetime-suite')}>
            <ExternalLink size={13} /> Get the 1-click installer on Whop
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState('convert');
  const [filter, setFilter] = useState('');
  const [palette, setPalette] = useState(false);
  const [settings, setSettings] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    loadPrefs().then((p) => {
      setTheme(p.theme || 'dark');
      document.documentElement.dataset.theme = p.theme || 'dark';
      if (TOOLS.some((t) => t.id === p.lastTool)) setActive(p.lastTool);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((p) => !p);
      }
      if (e.key === 'Escape') { setPalette(false); setSettings(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pick = (id) => {
    setActive(id);
    setPalette(false);
    updatePrefs({ lastTool: id });
  };

  const applyTheme = (t) => {
    setTheme(t);
    document.documentElement.dataset.theme = t;
    updatePrefs({ theme: t });
  };

  const visible = useMemo(
    () => TOOLS.filter((t) => (t.name + ' ' + t.desc).toLowerCase().includes(filter.toLowerCase())),
    [filter]
  );
  const tool = TOOLS.find((t) => t.id === active);

  if (!ready) return null;

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Sidebar */}
      <div style={{ width: 248, flexShrink: 0, background: 'var(--panel)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '16px 16px 12px' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wrench size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em' }}>Wrangle</div>
            <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>offline data toolbox</div>
          </div>
        </div>
        <div style={{ padding: '0 12px 10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--muted)' }} />
            <input
              type="text" value={filter} onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter tools…"
              style={{ width: '100%', padding: '6px 10px 6px 30px', fontSize: 12.5 }}
            />
          </div>
        </div>
        <nav style={{ flex: 1, overflow: 'auto', padding: '0 8px' }}>
          {visible.map((t) => (
            <button
              key={t.id}
              onClick={() => pick(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px',
                marginBottom: 2, borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                background: active === t.id ? 'var(--accent-soft)' : 'transparent',
                color: active === t.id ? 'var(--accent)' : 'var(--text)',
                fontWeight: active === t.id ? 600 : 450, fontSize: 13,
                transition: 'background 100ms ease',
              }}
              onMouseEnter={(e) => { if (active !== t.id) e.currentTarget.style.background = 'var(--panel2)'; }}
              onMouseLeave={(e) => { if (active !== t.id) e.currentTarget.style.background = 'transparent'; }}
            >
              <t.icon size={15} style={{ flexShrink: 0, color: active === t.id ? 'var(--accent)' : 'var(--muted)' }} />
              {t.name}
            </button>
          ))}
        </nav>
        <div style={{ padding: 10, borderTop: '1px solid var(--border)', display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setSettings(true)}>
            <Settings size={13} /> Settings
          </button>
          <div style={{ flex: 1 }} />
          <kbd>Ctrl</kbd><kbd>K</kbd>
        </div>
      </div>

      {/* Workspace */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px 0' }}>
          <tool.icon size={17} style={{ color: 'var(--accent)' }} />
          <h1 style={{ fontSize: 16, fontWeight: 700 }}>{tool.name}</h1>
          <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{tool.desc}</span>
          <div style={{ flex: 1 }} />
          <span className="badge badge-green">100% offline</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.14 }}
            style={{ flex: 1, minHeight: 0, padding: '14px 18px 18px' }}
          >
            <tool.C />
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {palette && <Palette key="palette" onPick={pick} onClose={() => setPalette(false)} />}
        {settings && <SettingsModal key="settings" theme={theme} onTheme={applyTheme} onClose={() => setSettings(false)} />}
      </AnimatePresence>
    </div>
  );
}
