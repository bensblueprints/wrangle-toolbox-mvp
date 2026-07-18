# 🛠️ Wrangle

## Demo



https://github.com/user-attachments/assets/587b47ad-72f5-4819-ae91-4406440b820b



**The offline developer data toolbox. Stop pasting API keys into random websites.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![100% Offline](https://img.shields.io/badge/network%20calls-zero-brightgreen)

Every day, developers paste JWTs full of production credentials into jwt.io, feed customer data into ad-riddled "free JSON formatters", and run regexes on strangers' servers. Wrangle is the fix: **ten polished data tools in one fast desktop app, 100% offline, zero telemetry** — and you pay for it exactly once.

> **Pay once. Own it forever. No subscription.** He3 charges $9.90/month for the same category of tools. Wrangle is $15, one time.

![Wrangle screenshot](docs/screenshot.png)

## The 10 tools

| Tool | What it does |
|---|---|
| 🔁 **Convert** | Any-to-any JSON ⇄ CSV ⇄ YAML ⇄ XML with format auto-detect, delimiter/indent options, and documented dot-notation flatten rules for nested → CSV |
| ✅ **Validate & Format** | Pretty-print / minify JSON, YAML, XML with precise error **line & column** highlighting |
| 🔎 **JSONPath Query** | Live `$.store.book[?(@.price<10)]` queries with a clickable cheatsheet |
| 🆚 **Diff** | Side-by-side text diff + **smart JSON diff** that ignores key order and whitespace |
| 🔐 **JWT Decoder** | Header/payload decode, human-readable expiry with expired badge, optional HS256 signature verification — your token never leaves the machine |
| 🔤 **Base64 / URL** | Text ⇄ base64 / base64url (UTF-8 safe), URL encode/decode, drag-drop file → base64 |
| 🔏 **Hash** | MD5 / SHA-1 / SHA-256 / SHA-512 of text or files (streamed — multi-GB is fine), HMAC mode, uppercase toggle |
| 🎲 **UUID** | v4 and time-ordered v7, bulk generate up to 10,000, copy all |
| 🧪 **Regex Tester** | Live matches with group table, highlight overlay, replace preview — patterns run in a worker with a 2s timeout so catastrophic backtracking can never hang the app |
| ⏱️ **Timestamp** | Unix s/ms ⇄ ISO 8601 ⇄ UTC ⇄ local ⇄ relative, auto-detects seconds vs milliseconds |

Everywhere: drag-drop files into any input, copy button on every output, per-tool recent-input history (stored locally), `Ctrl+K` command palette, dark mode by default.

## ☕ Skip the setup — get the 1-click installer

Don't want to touch npm? Grab the packaged Windows installer (plus updates and support the project):

**→ [Get Wrangle on Whop](https://whop.com/benjisaiempire/wrangle-app)** — one-time purchase, yours forever.

## Quick start (from source)

```bash
git clone https://github.com/bensblueprints/wrangle.git
cd wrangle
npm i
npm start        # builds the renderer and launches the app
```

```bash
npm test         # run the smoke test suite (28 assertions, plain Node — no Electron needed)
npm run dist     # build the Windows NSIS installer (electron-builder)
```

## Why not just use web tools?

| | **Wrangle** | jsonformatter.org / jwt.io / regex101 | He3 | DevUtils | DevToys |
|---|---|---|---|---|---|
| Price | **$15 once** | "Free" (ads) | **$9.90/mo** | $29 (Mac only) | Free |
| Your data stays on your machine | ✅ always | ❌ you're pasting secrets into someone's server | ✅ | ✅ | ✅ |
| Works offline / on a plane / behind a corp proxy | ✅ | ❌ | ✅ | ✅ | ✅ |
| Windows | ✅ | ✅ | ✅ | ❌ | ✅ |
| One coherent UX across all tools | ✅ | ❌ ten different sites | ✅ | ✅ | 🟡 |
| Regex DoS protection (worker + timeout) | ✅ | ❌ | ❓ | ❓ | ❓ |
| Subscription required | **Never** | — | ❌ monthly | — | — |

He3 costs $9.90/month — **Wrangle pays for itself in under 2 months** and never bills you again.

## Tech stack

- **Electron** (main + preload + sandboxed renderer) — strict CSP, `connect-src 'none'`: the renderer physically cannot make network requests
- **React + Vite + Tailwind CSS 4 + Framer Motion + Lucide** for the UI
- **Pure-JS core** — every tool lives in `src/lib/*.js` with zero Electron/DOM/native imports, so the whole engine runs and tests under plain Node (`npm test`)
- `papaparse` · `js-yaml` · `fast-xml-parser` · `jsonpath-plus` · `diff` — no native modules anywhere, so builds are trivial on every platform
- User regexes execute in **worker threads with a hard 2-second timeout**
- Prefs + per-tool history in a small JSON file in `userData` — no database, no cloud

## Architecture

```
electron/main.js       Electron main — windows, IPC, prefs file, dialogs
electron/preload.cjs   Minimal contextBridge (tool:run, prefs, files, clipboard)
src/lib/*.js           The engine: 10 pure-JS modules, no Electron imports
src/renderer/          React app (sidebar, Ctrl+K palette, 10 tool workspaces)
test/smoke.js          28 real-fixture assertions, runs under plain Node
```

## Privacy

Zero network calls. Zero telemetry. Zero accounts. The renderer's Content-Security-Policy blocks all outbound connections, and the only "server" involved is your filesystem.

## License

[MIT](LICENSE) © 2026 Ben ([bensblueprints](https://github.com/bensblueprints))

## macOS build

See [MAC-BUILD.md](MAC-BUILD.md). Quickest path: GitHub **Actions** tab -> run the **Mac Build** (`mac-build.yml`) workflow to get a downloadable `.dmg` (unsigned - right-click -> Open on first launch).
