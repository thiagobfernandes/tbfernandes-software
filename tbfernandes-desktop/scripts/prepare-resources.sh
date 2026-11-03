#!/usr/bin/env bash
# Fills src-tauri/resources/ with what the app ships next to the window (docs/desktop.md):
#   runtime/   Node.js (node.exe on Windows) from nodejs.org
#   backend/   tbfernandes-backend built for production: dist/, node_modules/, db/
#   postgres/  PostgreSQL binaries (bin, lib, share) for this platform
# Runs on Windows (Git Bash, as in CI) and on Linux. Run it before `npm run build`.
#   SKIP_BACKEND_BUILD=1  reuse tbfernandes-backend/dist
#   NODE_VERSION=22.23.4  Node.js release bundled with the app
#   PG_VERSION=17.11.0    PostgreSQL build from io.zonky.test.postgres on Maven Central
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/tbfernandes-desktop/src-tauri/resources"
BACKEND="$ROOT/tbfernandes-backend"
NODE_VERSION="${NODE_VERSION:-22.23.4}"
PG_VERSION="${PG_VERSION:-17.11.0}"

case "$(uname -s)" in
  MINGW* | MSYS* | CYGWIN*) PLATFORM=windows-amd64; NODE_DIST="node-v$NODE_VERSION-win-x64"; NODE_ARCHIVE=zip ;;
  Linux) PLATFORM=linux-amd64; NODE_DIST="node-v$NODE_VERSION-linux-x64"; NODE_ARCHIVE=tar.xz ;;
  *) echo "Unsupported platform: $(uname -s)" >&2; exit 1 ;;
esac

rm -rf "$OUT"
mkdir -p "$OUT/runtime" "$OUT/backend" "$OUT/postgres"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "==> Backend (NestJS)"
if [ -z "${SKIP_BACKEND_BUILD:-}" ]; then
  (cd "$BACKEND" && npm ci && npm run build)
fi
cp -r "$BACKEND/dist" "$BACKEND/db" "$BACKEND/package.json" "$BACKEND/package-lock.json" "$OUT/backend/"
# Production dependencies only, installed next to the copy so dev tools stay out of the app.
(cd "$OUT/backend" && npm ci --omit=dev --ignore-scripts --no-audit --no-fund)
rm -f "$OUT/backend/package-lock.json"
# Dev tools npm keeps as optional peers of typeorm; the compiled backend never loads them.
rm -rf "$OUT"/backend/node_modules/{typescript,ts-node,@types,@tsconfig,@cspotcode}
find "$OUT/backend/dist" -name '*.map' -delete -o -name '*.d.ts' -delete -o -name '*.tsbuildinfo' -delete

echo "==> Node.js $NODE_VERSION ($PLATFORM)"
curl -fsSL -o "$TMP/node.$NODE_ARCHIVE" "https://nodejs.org/dist/v$NODE_VERSION/$NODE_DIST.$NODE_ARCHIVE"
if [ "$NODE_ARCHIVE" = zip ]; then
  unzip -q "$TMP/node.zip" "$NODE_DIST/node.exe" -d "$TMP"
  cp "$TMP/$NODE_DIST/node.exe" "$OUT/runtime/"
else
  tar -xJf "$TMP/node.tar.xz" -C "$TMP" "$NODE_DIST/bin/node"
  cp "$TMP/$NODE_DIST/bin/node" "$OUT/runtime/"
fi

echo "==> PostgreSQL $PG_VERSION ($PLATFORM)"
ARTIFACT="embedded-postgres-binaries-$PLATFORM"
curl -fsSL -o "$TMP/pg.jar" \
  "https://repo1.maven.org/maven2/io/zonky/test/postgres/$ARTIFACT/$PG_VERSION/$ARTIFACT-$PG_VERSION.jar"
# The jar is a zip holding one .txz archive.
unzip -q "$TMP/pg.jar" -d "$TMP/pg"
tar -xJf "$TMP"/pg/*.txz -C "$OUT/postgres"
# Not needed by initdb/pg_ctl/postgres: GUI libraries, test plugin, headers, docs.
rm -f "$OUT"/postgres/bin/wx*.dll "$OUT"/postgres/bin/testplug.dll
rm -rf "$OUT/postgres/include" "$OUT/postgres/share/doc"

du -sh "$OUT"/* || true
