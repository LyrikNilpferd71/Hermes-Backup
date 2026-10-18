# Chinese LLM landscape — snapshot 2026-10-15

Fetched 2026-10-15 (UTC) via `scripts/fetch_leaderboards.sh`. Sources: Artificial Analysis default table (rendered via r.jina.ai), OpenRouter rankings (newest complete day = 2026-10-14). LMArena blocked by Cloudflare — community votes unknown. This snapshot is only valid ±1 week; refetch for current data.

## AA Intelligence Index — best Chinese models (global rank incl. variants)
| # | Model (config) | Org | Index | $/1M out | tok/s |
|---|---|---|---|---|---|
| 27 | MiMo-V2.6-Pro | Xiaomi | 46 | $0.13 | 44 |
| 29 | Qwen3.8 Max (0902) | Alibaba | 45 | $5.41 | 42 |
| 31 | GLM-5.3 (max) | Z AI | 45 | $2.01 | 58 |
| 32 | Step 5 Preview | StepFun | 44 | $1.03 | 89 |
| 33 | Kimi K3 (max) | Moonshot | 44 | $2.00 | 44 |
| 39 | GLM-5.3-Flash | Z AI | 42 | $0.28 | 61 |
| ~43 | Ling 3.1 Flash | InclusionAI | 41 | $1.00 | 210 |
| ~48 | DeepSeek V4.1 Flash (max) | DeepSeek | 39 | $0.27 | 179 |
| ~55 | DeepSeek V4 Pro 0813 | DeepSeek | 36 | $0.67 | 83 |
| ~59 | DeepSeek V4 Flash Vision (max) | DeepSeek | 35 | $0.31 | 173 |
| ~76 | MiniMax-M3 | MiniMax | 29 | $0.51 | 99 |

Global top (all): Claude Opus 5.5 (58), Claude Sonnet 5.5 (56), Muse Wonder Full/Meta (56), Opus 5.5 xhigh (56), GPT-6 Astra (53), Gemini 4 Argon (53). Note: OpenRouter's AA list uses fallback configs and shows e.g. Qwen3.8 Max = 53.4 (global #4) — variant-dependent.

## OpenRouter usage (tokens processed, day of 2026-10-14)
Today top 10: 1) DeepSeek V4.1 Flash 4.47T (-11%) 2) Step 5 Preview 3.74T (+26%) 3) GLM 5.3 Flash 1.8T 4) MiMo-V2.6-Flash 1.53T 5) Hy4 preview (Tencent) 1.07T 6) GPT-6 Luna 1.07T 7) Nemotron 3 Ultra (free) 1.04T 8) DeepSeek V4 Flash 0731 996B (+66%) 9) Claude Opus 5.5 887B 10) GLM 5.3 743B → 8 of 10 Chinese.

Trailing 30 days: 1) DeepSeek V4.1 Flash 116T (>999%) 2) Space Bunny Alpha (stealth) 56.7T (new) 3) GLM 5.3 Flash 56.5T 4) Hy4 preview 38.4T 5) MiMo-V2.6-Flash 31.4T 6) DeepSeek V4 Flash 0731 28.6T 7) Nemotron 3 Ultra 25.5T 8) GPT-5.6 Luna 22.7T 9) GPT-6 Luna 19.1T 10) Step 5 Preview 18.8T.

## OpenRouter market share by author (requests, week of 2026-10-05)
DeepSeek 24.5% (+14%) > OpenAI 18.6% > Google 17.8% > Z.ai 13.4% (+107%) > Qwen 5.4% > Anthropic 3.9% > Xiaomi 2.9% > Mistral 2.0% > Tencent 1.7%. Chinese labs combined ≈ 48% of OpenRouter requests.

## DeepSeek model timeline (AA registry)
V4.1 Flash 2026-09-10 (current), V4 Pro 0813 2026-08-13, V4 Flash Vision 2026-08-21, V4 Flash 0731 deprecated, V4 Pro 0424 deprecated, V4 Flash 0420 deprecated, V3.2 2025-12-01 deprecated, V3.1 2025-08-21 deprecated.

## Takeaway (as delivered to user)
- Intelligence axis: MiMo-V2.6-Pro / Qwen3.8 Max / GLM-5.3 lead Chinese models; DeepSeek V4.1 Flash ≈ 5th among Chinese by pure index.
- Usage + price/perf axis: DeepSeek V4.1 Flash still dominates (#1 globally by tokens, 24.5% author share, $0.27/1M out, 179 tok/s).
- Sweet spot pick: GLM-5.3-Flash ($0.28, index 42).