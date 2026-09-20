# Tier 2 Source Reputation Notes

Detailed reliability notes for the most-used Tier 2 (authoritative third-party) sources in business OSINT.

## TechCrunch
- **Strengths:** Best for early-stage tech, exclusive founder interviews, fast on funding announcements. Bylines matter — Julie Bort (apps/startups), Sarah Perez (apps/App Store), Lucas Ropek (AI/tech).
- **Weaknesses:** Sometimes prints founder claims without verification ("Although TechCrunch couldn't validate his download and revenue claims..."). Check the byline and note any "couldn't validate" disclaimers.
- **M&A coverage:** Usually first to confirm acquisitions, often with CEO quote. Deal prices often NOT disclosed even when the acquisition is.
- **Best for:** Funding announcements, M&A, founder profiles, app coverage.

## CNBC Make It
- **Strengths:** "Documents reviewed" phrasing is gold — they see internal financials. Strong on individual founder stories and lifestyle pieces. Tom Huddleston Jr. is a reliable byline for founder profiles.
- **Weaknesses:** Tends toward human-interest framing. Numbers are usually accurate but the editorial context can be promotional.
- **Best for:** Revenue/NOI confirmation via internal docs, founder net worth, lifestyle/operational details (team size, employee count, office).

## Forbes
- **Strengths:** Best for valuation context, 30 Under 30, founder profiles, market size framing. Bylines matter — Josipa Majic (startups/AI), Maria Gracia (consumer tech).
- **Weaknesses:** Paywall is annoying but usually soft. Older articles sometimes have stale data. Always check the date.
- **Best for:** Founder bios, market context, Forbes 30U30, M&A context.

## Bloomberg
- **Strengths:** Tier 1 for confirmed M&A, IPO data, public company financials. Bylines matter.
- **Weaknesses:** Paywall hard. Hard to fetch even for snippets. Most useful via search-result headlines.
- **Best for:** Confirmed M&A (with price), public company data, IPO details.

## The Information
- **Strengths:** Best tech M&A scoops, often has price when others don't. Strong on AI infrastructure.
- **Weaknesses:** Hard paywall, hard to fetch. Headlines only via search.
- **Best for:** M&A price confirmation (when they publish), AI sector deals.

## The Wall Street Journal
- **Strengths:** Best for big M&A, antitrust, regulatory. Confirmed numbers.
- **Weaknesses:** Hard paywall.
- **Best for:** Big acquisitions, regulatory context, public company moves.

## Wired
- **Strengths:** Strong on tech culture, founder profiles, AI implications.
- **Weaknesses:** Less reliable for hard numbers; more for narrative.
- **Best for:** Founder context, product narrative, AI category framing.

## Inc.com
- **Strengths:** Strong on Inc. 5000 data, founder stories, growth metrics.
- **Weaknesses:** Promotional tone; numbers sometimes generous.
- **Best for:** Founder profiles, growth-stage framing, Inc. 5000 lists.

## Fortune
- **Strengths:** Strong on big tech, finance, M&A, founder profiles (Term Sheet newsletter).
- **Weaknesses:** Paywall.
- **Best for:** Big M&A, Fortune 500/40 Under 40, financial framing.

## Axios
- **Strengths:** Smart Brevity format, good for short summaries, Pro subscription has deep data.
- **Weaknesses:** Free tier headlines only. Cloudflare blocks scraping.
- **Best for:** M&A headlines, market size framing.

## Semafor
- **Strengths:** Strong on M&A, financial detail, international deals.
- **Weaknesses:** Newer, paywalled.
- **Best for:** Confirmed M&A, financial detail, international startups.

## Yahoo Finance / Reuters / AP
- **Strengths:** Confirmed M&A with price, public company data.
- **Weaknesses:** Less depth on founder stories.
- **Best for:** Deal confirmation, public company moves.

## PitchBook / Crunchbase / Tracxn
- See `data-sources.md`. Generally Tier 2-3 — useful but frequently off or paywalled.

## How to use this in output

When citing a Tier 2 source in a report, you don't need to disclaim the source itself. But:
- Always include the **article date** (e.g., "CNBC Make It, 6.9.2025")
- Always include the **byline** for big claims (e.g., "Julie Bort, TechCrunch")
- Note any **"documents reviewed"** or **"according to [founder]"** framing in-line
- Cross-reference Tier 2 numbers with at least one other source before treating as confirmed
