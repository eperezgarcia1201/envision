#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-start}"
CANDIDATES=(3200 3100 3002 3001 8080)
SELECTED_PORT=""

is_port_in_use() {
  local port="$1"
  ss -ltn "( sport = :${port} )" | awk 'NR>1 {found=1} END {exit found ? 0 : 1}'
}

if [ -n "${PORT:-}" ]; then
  CANDIDATES=("$PORT")
fi

for port in "${CANDIDATES[@]}"; do
  if ! is_port_in_use "$port"; then
    SELECTED_PORT="$port"
    break
  fi
done

if [ -z "$SELECTED_PORT" ]; then
  echo "No free port found in: ${CANDIDATES[*]}" >&2
  exit 1
fi

echo "Using port ${SELECTED_PORT}"

if [ "$MODE" = "dev" ]; then
  exec npm run dev -- --hostname 0.0.0.0 --port "$SELECTED_PORT"
fi

exec npm run start -- -p "$SELECTED_PORT"
