#!/usr/bin/env bash
# Build the port into .builds/<name> and serve it statically on 127.0.0.1:<port> (background).
# Re-run with the same args to rebuild; the server keeps serving the refreshed directory.
#   tests/serve-build.sh menus 5181   → SFH_BASE=http://127.0.0.1:5181 node tests/your-test.mjs
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAME="$1"; PORT="$2"
OUT="$ROOT/.builds/$NAME"
cd "$ROOT"
npx vite build --logLevel error --outDir "$OUT" --emptyOutDir >/dev/null
if ! curl -s -o /dev/null "http://127.0.0.1:$PORT/"; then
  (cd "$OUT" && nohup python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &)
  sleep 0.5
fi
echo "serving $OUT at http://127.0.0.1:$PORT"
