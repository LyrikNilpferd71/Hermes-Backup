---
name: business-osint
description: Conduct open-source business intelligence research on private or recently-acquired companies — revenue, profit, valuation, funding, team, M&A deals, business model, competitive position. Use when the user asks for company financials, market intel, M&A details, founder background, or general business OSINT. Produces structured reports that separate hard facts from estimates and explicitly list unknowns.
---

# Business OSINT Research (Shell-based)

Class-level skill for doing company / startup / M&A intelligence research using shell tooling (curl, python, terminal). Tuned for the user's "estimate as little as possible" preference — every claim gets a source, estimates are flagged, unknowns are listed explicitly.

## When to use

Trigger when the user asks for any of:
- Revenue, profit, valuation, MRR, ARR of a private or recently-acquired company
- Funding rounds, investors, cap table info
- M&A / acquisition details (deal price, date, structure)
- Founders, team size, employee count, key hires
- Business model, pricing, unit economics, CAC, LTV
- App downloads, MAU/DAU, retention, app store rankings
- Competitive landscape, market position, category size

Skip when:
- Public US company with SEC filings → pull 10-K/10-Q directly
- Pure tech / architecture / "how does the product work" question
- Academic / scientific research → use `research/arxiv`
- Public market data / stock price → use `research/polymarket` patterns or Yahoo Finance

## Core methodology: tiered source reliability

Rank every claim by source quality. State the rank in output.

**Tier 1 — Primary, official:**
- Company website (e.g. calai.app, blog.myfitnesspal.com)
- Official social posts from named executives/founders (X, LinkedIn)
- Verified app store listings
- Founder speeches on record (podcasts like My First Million, in-person interviews transcribed)

**Tier 2 — Authoritative third party:**
- TechCrunch, Forbes, CNBC, Bloomberg, The Information
- "Documents reviewed by [Outlet]" phrasing = journalists saw internal financials (gold)
- GetLatka (self-reported founder data, but tagged as such)
- App store analytics: AppstoreSpy, Sensor Tower, data.ai, Similarweb, AppMagic

**Tier 3 — Secondary aggregators (use carefully):**
- Crunchbase, PitchBook, Tracxn, Apollo, CBInsights
- Wikipedia (often missing for startups, but check)
- LinkedIn (real-time, not historical)

**Tier 4 — Speculation (never present as fact):**
- Reddit threads (r/SaaS, r/technology, r/startups)
- Twitter speculation, "edgy takes"
- Modeled valuations (Latka's "5× ARR estimate", built-with formulas)
- "Est. Valuation" numbers from data tools

**Rule:** Tier 4 → must use words like "Schätzung", "Modellrechnung", "Reddit-Spekulation", "Tier 4 — kein Beleg". Never round to look like Tier 1.

## Shell tooling patterns

### Search engine fallback ladder
Most engines captcha after a handful of queries. Rotate:

1. **Brave Search** — `https://search.brave.com/search?q=...&source=web` — works 3-5 queries
2. **DuckDuckGo HTML** — `https://html.duckduckgo.com/html/?q=...` — captcha after few
3. **DDG Lite** — `https://duckduckgo.com/lite/?q=...` — same captcha issues
4. **Bing** — `https://www.bing.com/search?q=...` — captcha after few
5. **Direct URL** — skip search when you know the target site

For each, use the HTML-stripping pipeline below.

### HTML-to-text + JSON-fallback pipeline
```bash
curl -sL -A 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' \
  --max-time 30 'URL' | python3 -c "
import sys, re, json
html = sys.stdin.read()
try:
    data = json.loads(html)
    print(json.dumps(data, indent=2)[:N])
except:
    text = re.sub(r'<script.*?</script>', '', html, flags=re.S)
    text = re.sub(r'<style.*?</style>', '', text, flags=re.S)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    print(text[:N])
"
```

See `scripts/strip_html.py` for a reusable version.

### Wayback Machine without 503s
- `web.archive.org/web/2025/URL` frequently returns 503
- Use the JSON availability API instead:
  ```bash
  curl -sL "https://archive.org/wayback/available?url=DOMAIN&timestamp=YYYY"
  ```
  Returns `{"archived_snapshots": {"closest": {"url": "...", "timestamp": "..."}}, ...}`
- Wayback rarely captures JS-rendered or paywalled sites; empty result ≠ page never existed

### Parallel fetching
Use `hermes_tools.terminal` with a single command issuing multiple `curl &` calls in background, then `wait`. This is dramatically faster than serial fetches.

## Anti-bot handling cheat sheet

| Site | Block | Workaround |
|---|---|---|
| Crunchbase | Cloudflare | Wayback, search snippets, or accept no data |
| LinkedIn | Auth wall | Search-engine snippets, public profile URLs only |
| Reddit | Network policy | Skip (old.reddit.com also blocks), rely on search snippets |
| MyFitnessPal blog | Cloudflare JS challenge | Use press coverage / press releases via search |
| Medium / Substack | JS-rendered | Direct article URL with `?source=rss` or `?format=json` |
| ProductHunt | Cloudflare JS | Get launch info from search snippets |
| AppMagic, data.ai, Sensor Tower | Auth/JS required | AppstoreSpy, Similarweb, or public App Store rankings |
| The Information, Axios | Paywall + Cloudflare | Use TechCrunch/Forbes summaries |
| Wayback | Random 503 | Use availability API |
| Forbes | Soft paywall | Direct article URL works, content not gated |
| Brave Search | Captcha after few | Switch to DDG/Bing |

User-Agent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36` is the most-reliable. Linux/Mac UAs trigger more blocks.

## Report structure (Telegram/Markdown default)

```markdown
# 🟢 [Company] – Business OSINT Report

> **Stand:** [date] · **Quellenbasis:** [N] primäre Quellen · **Status:** [active/acquired/IPO/etc.]

## 1. 🏢 Unternehmen
[Legal name, HQ, founding, team, founders with brief bios]

## 2. 💰 Revenue
| Zeitraum | Revenue | Typ | Quelle |
|---|---|---|---|
| [date] | [$X] | [ARR/MRR/gross] | [Outlet + link] |

## 3. 📈 Profit (only what's disclosed)

## 4. 💎 Valuation / Acquisition Deal
### Was TATSÄCHLICH offiziell ist:
### ⚠️ Schätzungen Dritter (KEINE Fakten):
| Schätzung | Wert | Quelle | Methodik |

## 5. 🧠 Business Model
## 6. 🎯 Distribution / Growth
## 7. 🏆 Notable Recognition
## 8. ⚠️ Disputed / kontrovers
## 9. 🔒 Was WIRKLICH unbekannt ist  ← MANDATORY for M&A/valuation research
## 10. 📚 Primärquellen (verifiziert)
## 🎯 TL;DR
```

**Telegram format rules:**
- No pipe tables (Telegram auto-rewrites them). Use bullets or `**Label:** value` pairs instead.
- `**bold**` for labels
- ⚠️ for estimates, 🔒 for unknowns, ✅ for confirmed, ❌ for negative
- Source per data point in a `Quelle:` line, not just at the end

## Output language

Default: **German with English tech terms preserved** (Revenue, Profit, ARR, MRR, etc.) — matches user preference. Switch to English if user writes in English.

## Pitfalls

- **"Annualized run-rate" ≠ actual revenue** — "$50M ARR" from a single $5.7M January = projection, not a guarantee. Always label the months used.
- **"Bootstrapped" can hide angel checks** — many "bootstrapped" startups had small founder/angel rounds (e.g., Cal AI had a $2M Blake Anderson angel check). Read the TechCrunch/Forbes deep dive before claiming pure bootstrap.
- **CNBC's "documents reviewed" is the strongest signal** — means a journalist saw internal financials. Use as Tier 1+ even though CNBC is technically Tier 2.
- **"Terms not disclosed" ≠ "we don't know"** — sometimes one side confirms numbers off-record. Treat official non-disclosure as a hard "unknown".
- **App store analytics are estimates** — Sensor Tower, AppMagic, AppstoreSpy all have ±15-30% variance. Never cite a single number without showing the range.
- **Latka's modeled valuation is not a valuation** — "5× ARR estimate" is a model, not a deal. Tag as Tier 4.
- **"Forbes 30 Under 30" is PR, not finance** — useful for context, not for financial milestones.
- **Founder X posts are selective** — they publicize wins ($50M ARR), stay silent on losses. Cross-check against journalists.
- **"Less than expected" means nothing concrete** — can mean post-tax haircut, can mean deal structure. Don't overinterpret.
- **Competitor claims** (especially on company blog posts) should be cross-referenced with independent reporting.
- **App store removals and policy violations are part of the story** — Apple/Google enforcement actions are public record (TechCrunch covers them).
- **Don't trust a single Tier 2 source for the headline number** — if TechCrunch says $30M but CNBC says $1.4M/mo gross profit, the timeline matters (when in 2025?).

## Reference files

- `references/data-sources.md` — which source for which data type, reliability notes
- `references/anti-bot-patterns.md` — site-by-site block patterns and workarounds
- `references/tier-2-sources.md` — domain reputation of TechCrunch/Forbes/CNBC/etc. for OSINT

## Scripts

- `scripts/strip_html.py` — HTML-to-text + JSON-fallback single-file converter
- `scripts/wayback_check.sh` — batch Wayback availability checker (parallel)

## Templates

- `templates/report.md` — full report skeleton (German + English labels)
- `templates/quick-facts.md` — minimal facts-only template for short requests

## Verification checklist (run before delivering)

- [ ] Every numeric claim has an inline source URL or `Quelle:` line
- [ ] Every estimate is explicitly tagged (⚠️ Schätzung / Modellrechnung / Tier 4)
- [ ] "Was WIRKLICH unbekannt ist" section lists at least the top 3 unknowns for any valuation/M&A report
- [ ] TL;DR is 2-3 sentences, factual, not promotional
- [ ] At least one Tier 1 or Tier 2 source backs the headline number
- [ ] Founders' bio / team info cross-referenced across at least 2 sources
- [ ] Pricing data verified on the company's own site, not just third parties
- [ ] Acquisition date vs. announcement date separated (deal can close months before announce)

## Case study: Cal AI (2025-2026)

A worked example of this methodology in action: see the conversation transcript for the full Cal AI report. Key takeaways:
- Tier 1 (X post): Yadegari announced "$50M ARR" on 2.3.2026 — actually a $5.7M January × 12 annualization
- Tier 2 (CNBC, 9.9.2025): $1.4M gross profit/mo, $274K NOI/mo — from internal documents
- Tier 4 (Reddit / Latka): $175M "valuation" = Latka's 5× ARR model, not a real valuation
- Acquisition deal price: officially NOT disclosed. TechCrunch speculated "good outcome for 19yo founders" but no number.
- "Bootstrapped" was partially true — co-founder Blake Anderson put in $2M as angel
