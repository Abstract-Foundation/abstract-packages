#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

HOURS="${1:-8}"
if ! [[ "$HOURS" =~ ^[0-9]+$ ]] || [ "$HOURS" -le 0 ]; then
  echo "usage: bash scripts/run-overnight.sh [hours]" >&2
  exit 1
fi

LOG_DIR="${AGW_LOOP_LOG_DIR:-$ROOT_DIR/logs}"
mkdir -p "$LOG_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG_FILE="$LOG_DIR/agent-loop-$STAMP.log"
END_TS="$(( $(date +%s) + HOURS * 3600 ))"

echo "[overnight] started $(date -u +%Y-%m-%dT%H:%M:%SZ) hours=$HOURS log=$LOG_FILE" | tee -a "$LOG_FILE"

while [ "$(date +%s)" -lt "$END_TS" ]; do
  echo "[overnight] cycle start $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$LOG_FILE"

  if npm run loop -- --max-iterations=200 >>"$LOG_FILE" 2>&1; then
    echo "[overnight] cycle complete $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$LOG_FILE"
  else
    EXIT_CODE="$?"
    echo "[overnight] cycle failed exit=$EXIT_CODE $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$LOG_FILE"
    sleep 15
  fi

  sleep 2
done

echo "[overnight] finished $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$LOG_FILE"
