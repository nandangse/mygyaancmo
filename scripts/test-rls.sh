#!/usr/bin/env bash
# Runs the RLS suite against a throwaway database. Needs a superuser connection.
# Local: DATABASE_URL unset -> uses the local socket as the current OS user.
set -euo pipefail
cd "$(dirname "$0")/.."
DB=cmo_rls_test
ADMIN_URL="${DATABASE_URL:-}"
psqlx() { if [ -n "$ADMIN_URL" ]; then psql "$ADMIN_URL" -X -q "$@"; else psql -X -q "$@"; fi; }
psqlx -d postgres -c "drop database if exists $DB" -c "create database $DB" >/dev/null 2>&1 || \
  psql -X -q -d postgres -c "drop database if exists $DB" -c "create database $DB"
run() { if [ -n "$ADMIN_URL" ]; then psql "${ADMIN_URL%/*}/$DB" -X -q -v ON_ERROR_STOP=1 -f "$1"; else psql -d $DB -X -q -v ON_ERROR_STOP=1 -f "$1"; fi; }
run supabase/tests/rls/00_stub.sql
for f in supabase/migrations/*.sql; do run "$f"; done
run supabase/tests/rls/01_tests.sql
