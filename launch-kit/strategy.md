# Launch Strategy — Wrangle

## Target communities

| Community | Rules-aware angle |
|---|---|
| **r/webdev** | Allows Showoff Saturday. Post the app with the security hook: "I built an offline replacement for jwt.io / jsonformatter after realizing what I'd been pasting into them." Lead with the story and screenshots, link GitHub (MIT) first, mention the paid installer only if asked. |
| **r/node** | Technical angle: "Every tool is a pure-JS module that runs under plain Node — 28 smoke assertions, zero native modules, regex in worker_threads with a timeout." Node devs respect the no-native-ABI decision; share the architecture, not the product page. |
| **r/programming** | Show-don't-sell — this sub bans self-promo blogspam. Frame as a write-up: "How I sandboxed user regexes against catastrophic backtracking with worker threads and a 2s kill switch." Wrangle is the example, not the pitch. |
| **r/devtools** | Small but exactly on-target; direct show-and-tell is welcome. Full feature tour + comparison table vs DevToys/DevUtils/He3. Answer every comment. |
| **r/electronjs** | Architecture post: strict CSP with `connect-src 'none'`, minimal preload bridge, pure-lib main-process pattern. Electron devs are a great early-adopter pool. |

## Hacker News — Show HN draft

**Title:** Show HN: Wrangle – an offline desktop toolbox so I stop pasting JWTs into websites

**Post:**
I kept catching myself pasting tokens with real credentials into jwt.io and dropping customer JSON into ad-covered formatter sites. DevUtils solves this but is Mac-only; He3 wants $9.90/month; DevToys is good but I wanted one coherent UX and a few guarantees.

So I built Wrangle: 10 tools (JSON⇄CSV⇄YAML⇄XML convert, validate/format with error line+col, JSONPath, smart JSON diff, JWT decode + HS256 verify, base64/URL, MD5–SHA512 + HMAC with streaming file hashes, UUID v4/v7, regex tester, timestamp converter) in one Electron app.

Things I care about technically:
- The renderer's CSP is `connect-src 'none'` — the UI physically cannot make network requests, it's not a privacy-policy promise.
- Every tool is a pure-JS module with no Electron/DOM imports; the entire engine runs under plain Node, which is also how the test suite works (28 assertions against real fixtures, including the classic (a+)+$ backtracking bomb, which gets killed by a worker timeout at 2s).
- Zero native modules, so there's no ABI drama and the source build is `npm i && npm start`.

Source is MIT on GitHub. I sell a packaged one-time-purchase installer for people who don't want to build it. Happy to answer anything about the worker-timeout regex sandboxing or the CSV flatten rules (dot notation for nesting, arrays as JSON strings — documented, because CSV↔JSON is lossy no matter what anyone claims).

## SEO keywords (10)

1. offline json formatter
2. jwt decoder offline
3. devutils windows alternative
4. json to csv converter app
5. regex tester desktop
6. devtoys alternative
7. json yaml converter offline
8. jwt decoder without website
9. base64 encoder desktop app
10. he3 alternative one time purchase

## AppSumo / PitchGround pitch

Wrangle is the developer utility belt your buyers already use ten times a day — except today they're doing it on ad-riddled websites that see every API key, JWT, and customer record they paste. Wrangle packs the 10 highest-frequency data tools (convert, validate, query, diff, JWT, base64, hash, UUID, regex, timestamps) into one polished, 100%-offline desktop app with zero telemetry and a network-blocking CSP. The category's incumbent (He3) charges $9.90/month; DevUtils is $29 and Mac-only. Wrangle is Windows-first, open source (MIT) for trust, and one-time-priced for LTD audiences — it's literally built on the "pay once, own forever" promise your community buys deals for. Clean margins (no COGS, no API costs), instant delivery, and a natural upgrade path for future one-time products in the suite.

## Pricing

**Suggested one-time price: $15** (launch: $9 early-bird).

Competitor math:
- **He3: $9.90/month** → Wrangle pays for itself in **under 2 months**; a year of He3 costs 7.9× Wrangle.
- **DevUtils: $29 one-time but macOS-only** — Wrangle is half the price and runs on Windows.
- Web tools are "free" but the cost is your secrets on someone else's server — the security argument closes the sale, the one-time price removes the objection.
