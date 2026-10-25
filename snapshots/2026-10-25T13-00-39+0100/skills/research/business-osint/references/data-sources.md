# Data Sources for Business OSINT

Quick reference for which source to use for which data type.

## By data type

### Revenue / MRR / ARR
- **Best:** CNBC/Fortbes/TechCrunch "documents reviewed" articles → Tier 1+
- **Good:** GetLatka profile pages (self-reported by founder, but cited)
- **Fallback:** Founder X/LinkedIn posts, podcast mentions
- **Avoid as sole source:** Crunchbase, Wikipedia

### Funding rounds / Investors
- **Best:** TechCrunch funding announcement, founder X post
- **Good:** Crunchbase (if not paywalled), PitchBook, Tracxn
- **Note:** "Bootstrapped" claim → always cross-check for hidden angel checks

### Valuation (pre-money, post-money, modeled)
- **Best:** Funding round announcement (terms sometimes disclosed)
- **Acceptable:** GetLatka modeled valuation (always tag as "Modellrechnung")
- **Avoid:** Reddit speculation, "estimated by users" sites

### Acquisition / M&A
- **Best:** Joint press release, TechCrunch / Bloomberg / The Information
- **Good:** Acquirer SEC filing (if public)
- **Often undisclosed:** deal price → list in "Was wirklich unbekannt ist"
- **Important:** separate closing date from announcement date

### Founders / Team
- **Best:** LinkedIn (real-time), founder's own website, Forbes 30U30 profile
- **Good:** TechCrunch profile pieces
- **Verify:** ages at founding, prior companies, prior exits (LinkedIn + Crunchbase)

### Business model / Pricing
- **Best:** Company's own website, App Store listing
- **Acceptable:** Review sites, third-party pricing aggregators
- **Time-sensitive:** prices change; always cite date checked

### Downloads / MAU / DAU
- **Best:** App store analytics (AppstoreSpy, Sensor Tower, data.ai)
- **Variance:** ±15-30% between providers
- **Caveat:** all downloads ≠ active users; get retention from founder interviews

### Customer count
- **Best:** GetLatka (if listed), founder podcast/interview
- **Estimate:** downloads × retention rate × paid conversion

### App store rank / chart position
- **Best:** AppFollow, Sensor Tower, App Magic
- **Fallback:** founder X post (often shares screenshots)

## Source quality notes (mid-2026 snapshot)

- **TechCrunch** — strongest for early-stage tech startup coverage. Founders often give exclusive interviews. **Tier 2 for facts, Tier 1 for direct quotes.**
- **CNBC Make It** — best for "documents reviewed" internal financials. They actually get P&Ls. **Tier 1+ when they say "documents reviewed".**
- **Forbes** — strong for founder profiles, 30 Under 30, valuations. Profile pieces often include revenue but should be cross-checked. **Tier 2.**
- **The Information** — paywalled, often has exclusive M&A scoop. Hard to fetch directly. **Tier 1 for confirmed, Tier 2 for snippets via search.**
- **Bloomberg** — strong for confirmed M&A, IPO data. **Tier 1 for disclosed numbers.**
- **GetLatka** — self-reported founder data, often older, but useful for ARR snapshots. **Tier 2 with caveat.**
- **Latka modeled valuation (5× ARR etc.)** — pure model, never cite without tagging. **Tier 4.**
- **Crunchbase** — frequently wrong on early-stage funding amounts, "undisclosed" rounds appear as numbers. **Tier 3.**
- **PitchBook** — better than Crunchbase, paywalled. **Tier 2-3 depending on access.**
- **Tracxn** — global coverage, often includes funding totals. **Tier 3.**
- **Wikipedia** — usually missing for startups, but check for acquisitions. **Tier 3 if exists.**
- **LinkedIn** — real-time employee count, current titles. **Tier 1 for "currently works here".**
- **AppstoreSpy** — free tier shows installs, ratings, basic metrics. **Tier 2 for installs, Tier 3 for revenue (they model it).**
- **Sensor Tower / data.ai / Similarweb** — premium, hard to scrape, but the standard for app metrics. **Tier 1 if you have access, otherwise cite the model's range.**

## Source-rotation strategy

For a single company, target 3-5 sources per claim type:
- 1× Tier 1 (company itself or "documents reviewed" article)
- 1× Tier 2 (TechCrunch/Forbes/CNBC)
- 1× Tier 2 (data tool: Latka, AppstoreSpy)
- 1× Tier 1 (founder quote on X/podcast)
- 1× cross-check (Reddit, second journalist, etc.)

If you can't get to Tier 1 or Tier 2 for the headline number, flag it in the report and put it in "Unknowns" with reason ("no journalist has confirmed", "self-reported only").
