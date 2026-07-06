# Product Hunt — Wrangle

## Name
Wrangle

## Tagline (60 chars)
The offline dev data toolbox. Pay once, own it forever.

## Description (260 chars)
Convert JSON/CSV/YAML/XML, decode JWTs, diff, query with JSONPath, hash, test regex, generate UUIDs, convert timestamps — 10 polished tools in one desktop app. 100% offline, zero telemetry, no subscription. Stop pasting API keys into random websites. $15 once.

## Full description

Every developer has done it: pasted a JWT containing production credentials into jwt.io, dropped customer data into an ad-covered "free JSON formatter", or run a regex against real logs on someone else's server. It works — until you think about where that data just went.

Wrangle is ten data tools in one fast, coherent desktop app that never touches the network:

🔁 **Convert** — any-to-any JSON ⇄ CSV ⇄ YAML ⇄ XML with auto-detect and documented flatten rules
✅ **Validate & Format** — pretty-print/minify with exact error line & column
🔎 **JSONPath Query** — live results plus a clickable cheatsheet
🆚 **Diff** — side-by-side, with smart JSON mode that ignores key order
🔐 **JWT Decoder** — expiry badge, optional HS256 verification, fully offline
🔤 **Base64 / URL** — text and drag-drop file encoding, base64url included
🔏 **Hash** — MD5/SHA-1/SHA-256/SHA-512 + HMAC, streams multi-GB files
🎲 **UUID** — v4 and time-ordered v7, bulk up to 10,000
🧪 **Regex Tester** — group table, replace preview, and a worker timeout so catastrophic backtracking can't hang the app
⏱️ **Timestamp** — unix s/ms ⇄ ISO ⇄ local ⇄ relative with auto-detection

Everything has drag-drop, copy buttons, local history, and a Ctrl+K palette. The renderer's CSP literally blocks all network requests — it's not a promise, it's enforced.

Open source (MIT) on GitHub. $15 one time for the packaged installer. He3 charges $9.90/month for this category — Wrangle pays for itself before your second invoice.

## Maker first comment

Hey PH 👋

I built Wrangle after catching myself pasting a staging JWT into jwt.io for the hundredth time — a token that, on the wrong day, would have been a production token. The tools we use dozens of times a week are somehow still random websites with ads, trackers, and someone else's server in the middle.

I wanted the DevUtils experience (which is great, but Mac-only, and I'm on Windows) without another $9.90/month subscription like He3. So: one Electron app, ten tools, everything local. The core is pure JS — the whole engine runs under plain Node with 28 smoke-test assertions, no native modules, and the renderer's CSP has `connect-src 'none'` so it physically can't phone home.

I got tired of paying monthly for software I use forever, so the model is the opposite: $15 once, MIT source on GitHub, and if you'd rather build it yourself, `npm i && npm start` is right there.

Honest limitations: signature verification is HS256-only for now (RS256 is on the list), and the XML↔CSV corners of conversion are inherently lossy — the flatten rules are documented rather than magical. Ask me anything!

## Gallery shots (5)

1. **Hero** — full app window, dark mode, Convert tool open with JSON on the left and YAML output on the right, sidebar showing all 10 tools, "100% offline" badge visible.
2. **JWT decoder** — decoded token with green "expires in..." badge and header/payload panes, caption: "Your JWT contains prod credentials. Why are you pasting it into a website?"
3. **Regex tester** — email pattern with highlighted matches, group table, and replace preview; caption about the 2-second catastrophic-backtracking guard.
4. **Smart JSON diff** — two JSON blobs with shuffled keys showing "No differences" badge, then one real change highlighted in green/red.
5. **Ctrl+K palette** — command palette open over the Hash tool with a file digest table behind it, caption: "Ten tools, one keystroke apart."
