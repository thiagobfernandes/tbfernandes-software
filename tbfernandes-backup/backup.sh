#!/bin/sh
set -eu

DIR=/backups
INTERVAL=${TBF_BACKUP_INTERVAL:-600}
OWNER=${TBF_BACKUP_OWNER:-1000:1000}
MIN_RATIO=${TBF_BACKUP_MIN_RATIO:-50}
LOCK="$DIR/.restoring"

log() {
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) [backup] $*"
}

latest() {
  ls -1t "$DIR"/tbfernandes-*.dump 2>/dev/null | head -n 1 || true
}

wait_db() {
  until pg_isready -q; do
    sleep 2
  done
}

backup_once() {
  if [ -e "$LOCK" ]; then
    log "restauração em andamento, backup adiado"
    return 0
  fi

  wait_db
  stamp=$(date -u +%Y%m%d-%H%M%S)
  target="$DIR/tbfernandes-$stamp.dump"
  tmp="$DIR/.tbfernandes-$stamp.dump.partial"

  if ! pg_dump --format=custom --no-owner --file="$tmp"; then
    rm -f "$tmp"
    log "pg_dump falhou, o backup anterior foi mantido"
    return 0
  fi

  if ! pg_restore --list "$tmp" >/dev/null 2>&1; then
    rm -f "$tmp"
    log "arquivo gerado é inválido, o backup anterior foi mantido"
    return 0
  fi

  previous=$(latest)
  if [ -n "$previous" ] && [ "${TBF_BACKUP_FORCE:-false}" != "true" ]; then
    old_size=$(stat -c %s "$previous")
    new_size=$(stat -c %s "$tmp")
    if [ $((new_size * 100)) -lt $((old_size * MIN_RATIO)) ]; then
      rm -f "$tmp"
      log "novo dump ($new_size bytes) bem menor que $(basename "$previous") ($old_size bytes): banco vazio ou recriado? Backup anterior mantido. Restaure-o ou use TBF_BACKUP_FORCE=true"
      return 0
    fi
  fi

  mv "$tmp" "$target"
  chown "$OWNER" "$target" 2>/dev/null || true
  find "$DIR" -maxdepth 1 -name 'tbfernandes-*.dump' ! -path "$target" -delete
  log "backup salvo em $(basename "$target") ($(stat -c %s "$target") bytes)"
}

restore() {
  file=${1:-$(latest)}
  case "$file" in
    "") log "nenhum backup em $DIR"; exit 1 ;;
    /*) ;;
    *) file="$DIR/$file" ;;
  esac
  [ -f "$file" ] || { log "arquivo não encontrado: $file"; exit 1; }

  wait_db
  touch "$LOCK"
  trap 'rm -f "$LOCK"' EXIT
  log "restaurando $(basename "$file") em $PGDATABASE"
  pg_restore --clean --if-exists --no-owner --exit-on-error --single-transaction --dbname="$PGDATABASE" "$file"
  log "restauração concluída"
}

case "${1:-loop}" in
  loop)
    mkdir -p "$DIR"
    chown "$OWNER" "$DIR" 2>/dev/null || true
    log "backup a cada ${INTERVAL}s em $DIR"
    while true; do
      backup_once
      sleep "$INTERVAL"
    done
    ;;
  now) backup_once ;;
  restore) restore "${2:-}" ;;
  *) echo "uso: backup.sh [loop|now|restore [arquivo]]"; exit 2 ;;
esac
