#!/usr/bin/env bash
# wayback_check.sh — Batch-check Wayback availability for a list of URLs.
#
# Usage:
#   echo "https://example.com/page" | ./wayback_check.sh
#   ./wayback_check.sh urls.txt
#
# Output: JSON lines with {url, archived, closest_timestamp, closest_url}

set -e

check_url() {
    local url="$1"
    local encoded
    encoded=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$url', safe=''))" 2>/dev/null || echo "$url")
    local result
    result=$(curl -sL --max-time 15 "https://archive.org/wayback/available?url=${encoded}")
    echo "$result" | python3 -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    snap = data.get('archived_snapshots', {}).get('closest', {})
    out = {
        'url': data.get('url', ''),
        'archived': bool(snap),
        'closest_timestamp': snap.get('timestamp', ''),
        'closest_url': snap.get('url', ''),
    }
    print(json.dumps(out))
except Exception as e:
    print(json.dumps({'url': '$url', 'error': str(e)}))
"
}

if [ -p /dev/stdin ]; then
    while IFS= read -r line; do
        [ -n "$line" ] && check_url "$line" &
    done
    wait
elif [ -n "$1" ] && [ -f "$1" ]; then
    while IFS= read -r line; do
        [ -n "$line" ] && check_url "$line" &
    done < "$1"
    wait
else
    echo "Usage: echo 'URL' | $0  OR  $0 urls.txt" >&2
    exit 1
fi
