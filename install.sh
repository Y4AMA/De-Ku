#!/usr/bin/env bash
# de-kaku installer — curl-based, no git clone needed.
# Downloads all files from GitHub raw into a staging dir, then runs install.mjs.
set -euo pipefail

REPO="Y4AMA/De-Ku"
BRANCH="main"
RAW="https://raw.githubusercontent.com/$REPO/$BRANCH"

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

FILES="plugin.js dekaku-patterns.mjs dekaku-recover.mjs mcp-server.mjs install.mjs"
FILES="$FILES themes/dekaku-purple.json agents/kakdek.md"

echo "[dekaku] download from $RAW"
for f in $FILES; do
  mkdir -p "$STAGE/$(dirname "$f")"
  code=$(curl -fsSL -o "$STAGE/$f" -w "%{http_code}" "$RAW/$f" || echo FAIL)
  if [ "$code" != "200" ] && [ "$code" != "FAIL" ]; then
    echo "  ✗ $f -> HTTP $code"
    exit 1
  fi
  if [ "$code" = "FAIL" ] || [ ! -s "$STAGE/$f" ]; then
    echo "  ✗ $f -> download failed"
    exit 1
  fi
  echo "  ✓ $f"
done

exec node "$STAGE/install.mjs" "$@"
