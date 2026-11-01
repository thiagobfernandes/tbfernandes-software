#!/usr/bin/env bash
# Fills src-tauri/resources/ with what the app ships next to the window (docs/desktop.md):
#   runtime/   Java runtime trimmed with jlink (needs a JDK 25 in JAVA_HOME or on the PATH)
#   backend/   tbfernandes-api.jar (desktop profile)
#   postgres/  PostgreSQL binaries (bin, lib, share) for this platform
# Runs on Windows (Git Bash, as in CI) and on Linux. Run it before `npm run build`.
#   SKIP_BACKEND_BUILD=1  reuse tbfernandes-backend/target/*.jar
#   PG_VERSION=17.11.0    PostgreSQL build from io.zonky.test.postgres on Maven Central
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/tbfernandes-desktop/src-tauri/resources"
PG_VERSION="${PG_VERSION:-17.11.0}"
JAVA_BIN="${JAVA_HOME:+$JAVA_HOME/bin/}"

case "$(uname -s)" in
  MINGW* | MSYS* | CYGWIN*) PLATFORM=windows-amd64 ;;
  Linux) PLATFORM=linux-amd64 ;;
  *) echo "Unsupported platform: $(uname -s)" >&2; exit 1 ;;
esac

# Modules the Spring Boot backend needs (checked by starting it with this runtime).
MODULES=java.base,java.compiler,java.desktop,java.instrument,java.logging,java.management,java.naming,java.net.http,java.prefs,java.rmi,java.scripting,java.security.jgss,java.security.sasl,java.sql,java.transaction.xa,java.xml,jdk.crypto.ec,jdk.jfr,jdk.localedata,jdk.management,jdk.naming.dns,jdk.net,jdk.unsupported,jdk.zipfs

rm -rf "$OUT"
mkdir -p "$OUT/backend" "$OUT/postgres"

echo "==> Backend jar"
if [ -z "${SKIP_BACKEND_BUILD:-}" ]; then
  (cd "$ROOT/tbfernandes-backend" && ./mvnw -B -q -DskipTests package)
fi
JAR="$(ls "$ROOT"/tbfernandes-backend/target/tbfernandes-api-*.jar | grep -v -- '-plain\|-sources' | head -1)"
cp "$JAR" "$OUT/backend/tbfernandes-api.jar"

echo "==> Java runtime (jlink)"
"${JAVA_BIN}jlink" --add-modules "$MODULES" --strip-debug --no-header-files --no-man-pages \
  --compress=zip-6 --output "$OUT/runtime"

echo "==> PostgreSQL $PG_VERSION ($PLATFORM)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
ARTIFACT="embedded-postgres-binaries-$PLATFORM"
curl -fsSL -o "$TMP/pg.jar" \
  "https://repo1.maven.org/maven2/io/zonky/test/postgres/$ARTIFACT/$PG_VERSION/$ARTIFACT-$PG_VERSION.jar"
(cd "$TMP" && "${JAVA_BIN}jar" xf pg.jar)
tar -xJf "$TMP"/*.txz -C "$OUT/postgres"
# Not needed by initdb/pg_ctl/postgres: GUI libraries, test plugin, headers, docs.
rm -f "$OUT"/postgres/bin/wx*.dll "$OUT"/postgres/bin/testplug.dll
rm -rf "$OUT/postgres/include" "$OUT/postgres/share/doc"

du -sh "$OUT"/* || true
