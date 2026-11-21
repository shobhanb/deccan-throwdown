#!/bin/sh
set -eu

# Bind-mounted SQLite (and WAL sidecars) may be root-owned from earlier deploys.
# Fix ownership, then drop privileges before starting the app.
if [ "$(id -u)" = "0" ]; then
  for f in /app/database.db /app/database.db-wal /app/database.db-shm; do
    if [ -e "$f" ]; then
      chown appuser:appuser "$f"
    fi
  done
  exec setpriv --reuid=appuser --regid=appuser --init-groups -- "$@"
fi

exec "$@"
