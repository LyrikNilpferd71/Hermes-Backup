#!/usr/bin/env python3
"""
strip_html.py — Convert HTML to clean text, with JSON fallback.

Usage:
    curl -sL -A 'UA' URL | python3 strip_html.py [max_chars]
    python3 strip_html.py < input.html [max_chars]

Features:
    - Tries to parse input as JSON first (for Wayback availability APIs etc.)
    - Falls back to regex-based HTML stripping
    - Removes <script> and <style> blocks entirely
    - Collapses whitespace
    - Limits output to max_chars (default 5000)
"""
import sys
import re
import json

MAX_CHARS = 5000


def try_json(text: str) -> str | None:
    try:
        data = json.loads(text)
        return json.dumps(data, indent=2, ensure_ascii=False)[:MAX_CHARS]
    except (ValueError, json.JSONDecodeError):
        return None


def strip_html(html: str) -> str:
    # Remove script and style blocks entirely (including their content)
    text = re.sub(r"<script.*?</script>", " ", html, flags=re.S | re.I)
    text = re.sub(r"<style.*?</style>", " ", text, flags=re.S | re.I)
    # Remove HTML comments
    text = re.sub(r"<!--.*?-->", " ", text, flags=re.S)
    # Strip all HTML tags
    text = re.sub(r"<[^>]+>", " ", text)
    # Decode common HTML entities (basic set)
    text = (
        text.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", '"')
        .replace("&#39;", "'")
        .replace("&nbsp;", " ")
        .replace("&mdash;", "—")
        .replace("&ndash;", "–")
        .replace("&hellip;", "…")
    )
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text[:MAX_CHARS]


def main() -> None:
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        global MAX_CHARS
        MAX_CHARS = int(sys.argv[1])

    raw = sys.stdin.read()

    # Try JSON first
    json_out = try_json(raw)
    if json_out is not None:
        print(json_out)
        return

    # Fall back to HTML stripping
    print(strip_html(raw))


if __name__ == "__main__":
    main()
