#!/usr/bin/env bash
# Regenerates src/main/resources/db/dev/R__dev_seed.sql from the frontend sample data
# (tbfernandes-frontend/src/lib/sample-data), so the API in the dev profile shows the same records.
# Needs Node 22+ and Python 3. Run from anywhere: tbfernandes-backend/scripts/dev-seed/generate.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$here/../../.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

for f in growth knowledge life methods work; do
  sed -E 's#from "@/lib/sample-data/([a-z]+)"#from "./\1.ts"#' "$repo/tbfernandes-frontend/src/lib/sample-data/$f.ts" > "$work/$f.ts"
done
cp "$here/dump.ts" "$work/dump.ts"
node --experimental-strip-types --no-warnings "$work/dump.ts" > "$work/data.json"
python3 -I "$here/generate_seed.py" "$work/data.json" "$repo/tbfernandes-backend/src/main/resources/db/dev/R__dev_seed.sql"
echo "Wrote tbfernandes-backend/src/main/resources/db/dev/R__dev_seed.sql"
