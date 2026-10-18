#!/usr/bin/env bash
# Fetches current LLM leaderboard data (JS-rendered pages via Jina reader proxy).
# Usage: bash fetch_leaderboards.sh   -> writes to /tmp/llm_meta/
set -euo pipefail
mkdir -p /tmp/llm_meta
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36"

echo "Fetching Artificial Analysis leaderboard..."
curl -sL --max-time 120 -A "$UA" "https://r.jina.ai/https://artificialanalysis.ai/leaderboards/models" -o /tmp/llm_meta/aa.md

echo "Fetching OpenRouter rankings (usage data)..."
curl -sL --max-time 120 -A "$UA" "https://r.jina.ai/https://openrouter.ai/rankings" -o /tmp/llm_meta/or.md

echo "Fetching HuggingFace trending..."
curl -sL --max-time 60 -A "$UA" "https://huggingface.co/api/trending" -o /tmp/llm_meta/hf_trending.json

wc -c /tmp/llm_meta/aa.md /tmp/llm_meta/or.md /tmp/llm_meta/hf_trending.json
echo "Done. Parse AA with: python3 parse_leaderboards.py /tmp/llm_meta/aa.md [keyword]"