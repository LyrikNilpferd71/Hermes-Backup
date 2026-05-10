#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="${SOURCE_DIR:-$HOME/.hermes}"
TS_UTC="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
SNAPSHOT_DIR="$REPO_DIR/snapshots/$TS_UTC"

mkdir -p "$SNAPSHOT_DIR"

copy_if_exists() {
  local src="$1"
  local dst="$2"
  if [[ -e "$src" ]]; then
    mkdir -p "$(dirname "$dst")"
    cp -a "$src" "$dst"
  fi
}

# Core durable state only — no secrets, no runtime databases, no logs.
copy_if_exists "$SOURCE_DIR/config.yaml" "$SNAPSHOT_DIR/config.yaml"
copy_if_exists "$SOURCE_DIR/memories/MEMORY.md" "$SNAPSHOT_DIR/memories/MEMORY.md"

# Preserve skill definitions and linked files, but keep generated caches out.
if [[ -d "$SOURCE_DIR/skills" ]]; then
  mkdir -p "$SNAPSHOT_DIR/skills"
  rsync -a \
    --exclude '.usage.json' \
    --exclude '.bundled_manifest' \
    --exclude '*.lock' \
    --exclude '__pycache__/' \
    "$SOURCE_DIR/skills/" "$SNAPSHOT_DIR/skills/"
fi

cat > "$SNAPSHOT_DIR/manifest.txt" <<EOF
backup_utc=$TS_UTC
source=$SOURCE_DIR
hostname=$(hostname)
EOF

cd "$REPO_DIR"
git add -f snapshots README.md .gitignore backup-self.sh
if git diff --cached --quiet; then
  echo "No changes to commit."
  exit 0
fi

git commit -m "backup: Hermes snapshot $TS_UTC"
git push origin main

echo "Backup committed and pushed from $TS_UTC"
