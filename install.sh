#!/usr/bin/env bash
# de-kaku installer — copies plugin into OpenCode config dir
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CFG="${OPENCODE_CONFIG_DIR:-${XDG_CONFIG_HOME:-$HOME/.config}/opencode}"
DEST="$CFG/plugins/dekaku"

mkdir -p "$DEST"

cp "$SRC/plugin.js" "$SRC/dekaku-patterns.mjs" "$DEST/"
chmod 644 "$DEST/plugin.js" "$DEST/dekaku-patterns.mjs"

echo "de-kaku → $DEST"
echo ""
echo "Langkah terakhir (manual):"
echo "  1. Buka $CFG/opencode.jsonc"
echo "  2. Tambahkan di bagian plugin:"
echo "       \"plugin\": [\"$DEST/plugin.js\"]"
echo "  3. Restart OpenCode."
echo ""
echo "Audit log: $CFG/dekaku-audit.json"
echo "Nonaktifkan sementara: rename atau hapus file plugin di atas."
