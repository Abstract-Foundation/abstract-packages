#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
QUALITY_CMD="npm run check-types && npm test && npm run lint && npm run build"

STATUS="passed"
OUTPUT_FILE="/tmp/agw-mcp-eval-${TIMESTAMP//:/-}.log"

if ! bash -lc "$QUALITY_CMD" >"$OUTPUT_FILE" 2>&1; then
  STATUS="failed"
fi

{
  echo ""
  echo "## ${TIMESTAMP} - Nightly Eval"
  echo "- status: ${STATUS}"
  echo "- command: ${QUALITY_CMD}"
  echo "- log_file: ${OUTPUT_FILE}"
} >> meta/progress.md

if [[ "$STATUS" == "failed" ]]; then
  {
    echo ""
    echo "| R-NIGHTLY-${TIMESTAMP} | Nightly quality gate failed | high | medium | Inspect ${OUTPUT_FILE}, fix failing task, rerun eval | harness | open |"
  } >> meta/risks.md
fi

echo "Nightly eval ${STATUS}. Log: ${OUTPUT_FILE}"
