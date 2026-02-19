#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
QUALITY_CMD="npm run check-types && npm test && npm run lint && npm run build"
if [[ "${AGW_E2E_ENABLED:-0}" == "1" ]]; then
  QUALITY_CMD="${QUALITY_CMD} && npm run test:e2e"
fi

STATUS="passed"
OUTPUT_FILE="/tmp/agw-mcp-eval-${TIMESTAMP//:/-}.log"
E2E_NOTE=""

if [[ "${AGW_E2E_REQUIRED:-0}" == "1" && "${AGW_E2E_ENABLED:-0}" != "1" ]]; then
  STATUS="failed"
  E2E_NOTE="live e2e required but AGW_E2E_ENABLED!=1"
  printf '%s\n' "${E2E_NOTE}" >"$OUTPUT_FILE"
fi

if [[ "$STATUS" == "passed" ]]; then
  if ! bash -lc "$QUALITY_CMD" >"$OUTPUT_FILE" 2>&1; then
    STATUS="failed"
  fi
fi

SCORECARD_JSON="$(npx --yes tsx scripts/slo-scorecard.ts "$STATUS")"
SCORECARD_FILE="/tmp/agw-mcp-scorecard-${TIMESTAMP//:/-}.json"
printf '%s\n' "$SCORECARD_JSON" >"$SCORECARD_FILE"

{
  echo ""
  echo "## ${TIMESTAMP} - Nightly Eval"
  echo "- status: ${STATUS}"
  echo "- command: ${QUALITY_CMD}"
  if [[ -n "$E2E_NOTE" ]]; then
    echo "- e2e_note: ${E2E_NOTE}"
  fi
  echo "- log_file: ${OUTPUT_FILE}"
  echo "- scorecard_file: ${SCORECARD_FILE}"
} >> meta/progress.md

if [[ "$STATUS" == "failed" ]]; then
  {
    echo ""
    echo "| R-NIGHTLY-${TIMESTAMP} | Nightly quality gate failed | high | medium | Inspect ${OUTPUT_FILE}, fix failing task, rerun eval | harness | open |"
  } >> meta/risks.md
fi

echo "Nightly eval ${STATUS}. Log: ${OUTPUT_FILE}"
