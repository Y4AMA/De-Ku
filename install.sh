#!/usr/bin/env bash
# de-kaku installer — one command: copies plugin + wires config + MCP
set -euo pipefail
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SRC/install.mjs" "$@"
