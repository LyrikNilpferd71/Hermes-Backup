#!/usr/bin/env python3
"""Parse an Artificial Analysis markdown dump (from r.jina.ai) into ranked rows.

Usage: python3 parse_leaderboards.py /tmp/llm_meta/aa.md [filter_keyword]
- Model rows are recognized as lines containing an image tag and >60 chars.
- Rows are numbered by position in the table = global rank (variants included).
- Optional keyword filters the output (e.g. 'deepseek', 'qwen', 'minimax').
"""
import re
import sys

path = sys.argv[1] if len(sys.argv) > 1 else '/tmp/llm_meta/aa.md'
kw = sys.argv[2].lower() if len(sys.argv) > 2 else None

lines = [l for l in open(path, encoding='utf-8', errors='replace').read().split('\n') if l.strip()]
rows = []
for l in lines:
    if '![Image' not in l or len(l) <= 60:
        continue
    clean = re.sub(r'!\[Image \d+: [^\]]*\]\([^)]*\)', '', l).strip()
    rows.append(clean)

for i, r in enumerate(rows, 1):
    if kw and kw not in r.lower():
        continue
    print(f"{i:3d} | {r[:180]}")