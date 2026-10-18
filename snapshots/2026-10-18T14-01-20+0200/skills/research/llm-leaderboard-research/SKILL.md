---
name: llm-leaderboard-research
description: Use for current LLM rankings/usage (best model picks).
---

# LLM Leaderboard Research

## When to use
User asks: "what's the best model right now", "best Chinese model", "X vs Y", "cheapest capable model", "is model Z still worth it", or wants a model-landscape snapshot for a decision (startup, deployment, automation). Anything requiring *current* model quality/usage rankings.

## Sources (verified working Oct 2026)
Both major sites are client-side rendered — use the **Jina reader proxy**, which renders JS to markdown and passes most pages that block plain curl:

1. **Artificial Analysis — quality/price/speed**
   `curl -sL "https://r.jina.ai/https://artificialanalysis.ai/leaderboards/models" -o /tmp/llm_meta/aa.md`
   - Rendered rows: `Name<ctx><org> <Intelligence Index> $<price/1M out> <speed tok/s> ...`
   - Direct API probing (`/api/leaderboards/models` etc.) 404s and the endpoint is buried in minified Next.js chunks — do NOT reverse-engineer; jina rendering is faster.
   - The raw HTML also holds a **model registry** (slugs, release dates, `deprecated` flags, creator) as Next.js flight data (`self.__next_f.push(...)` chunks) — parse that for existence/dates/timeline questions.

2. **OpenRouter Rankings — real usage data (the key usage source)**
   `curl -sL "https://r.jina.ai/https://openrouter.ai/rankings" -o /tmp/llm_meta/or.md`
   - Bottom "as text" sections = clean markdown tables: **Today** / **This Month** ranked by tokens processed, **Market Share by model author** (requests, weekly), plus an AA-Index top-20 benchmark list.
   - Timestamp = newest complete UTC day. Data licensed CC BY 4.0 (cite "OpenRouter rankings").

3. **LMArena (community votes)**: Cloudflare-protected — both curl and jina return 403 (as of Oct 2026). If the task needs votes, state explicitly that they could not be fetched instead of guessing.

4. **HuggingFace trending** (open-weight momentum): `https://huggingface.co/api/trending` → `[{repoData.id, trendingScore}]`.

## Workflow
1. Run `scripts/fetch_leaderboards.sh` (fetches AA + OpenRouter + HF trending to /tmp/llm_meta/).
2. Parse with `scripts/parse_leaderboards.py` (or custom script written via write_file).
   - PITFALL (this environment): heredocs and `curl ... | python3 -c ...` pipes in `terminal` trigger interactive consent prompts that time out and block the command. Plain `curl -o file` runs fine; `python3 /tmp/parse.py` (script written with write_file) runs fine. Always curl-to-file + script-file.
3. Answer **per axis** — for "best model" questions the winner differs by axis (intelligence vs usage vs price/perf). Report retrieval date and source for every number.
4. State explicitly what could NOT be fetched (e.g. LMArena votes) — user preference: verified facts over estimation, never guess.

## Pitfalls
- **Variant/fallback configs change scores**: OpenRouter's AA-index list (fallback configs) can show a different value for the same model than AA's default table (example: Qwen3.8 Max = 53.4 with fallback vs 45 plain max). Mention the config when quoting.
- OpenRouter tokens = only traffic routed through OpenRouter; market-share counts requests, not tokens. Don't over-generalize to "world usage".
- Change values `new` / `>999%` mean the prior time bucket didn't exist — not a real growth rate.
- Filter out `deprecated: true` models from the AA registry before recommending.
- Scores/prices drift weekly — a snapshot is only valid ± a week. Note "Stand: <date>".

## Support files
- `scripts/fetch_leaderboards.sh` — one-shot fetch of AA + OpenRouter + HF trending.
- `scripts/parse_leaderboards.py` — strips image markup, numbers rows in rank order, optional keyword filter.
- `references/2026-10-15-chinese-models-snapshot.md` — baseline snapshot: Chinese model leaderboard + OpenRouter usage (Oct 15, 2026).