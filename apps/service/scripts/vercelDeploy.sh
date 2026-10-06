#!/usr/bin/env bash
# Deploy to Vercel, then initialize the DB (indexes) of the new deployment, on serverless it doesn't run on startup.
# usage: yarn vercel-deploy [--prod] [other "vercel deploy" options]
#
# CRON_SECRET is read from the Vercel project env vars of the deployed environment (production / preview),
# or from the local env when it's already set (e.g. when it's a "Sensitive" env var that can't be read back).
# If the deployment is protected (Deployment Protection), set VERCEL_AUTOMATION_BYPASS_SECRET the same way.
set -euo pipefail

target=preview
for arg in "$@"; do
  if [[ "$arg" == "--prod" ]]; then
    target=production
  fi
done

# stdout is only the deployment URL, the progress is written to stderr
deployment_url=$(vercel deploy "$@")

echo "Initializing DB of $deployment_url ($target)"

init_db='
  if [ -z "${CRON_SECRET:-}" ]; then
    echo "CRON_SECRET is not set" >&2
    exit 1
  fi

  headers=(-H "Authorization: Bearer $CRON_SECRET")
  if [ -n "${VERCEL_AUTOMATION_BYPASS_SECRET:-}" ]; then
    headers+=(-H "x-vercel-protection-bypass: $VERCEL_AUTOMATION_BYPASS_SECRET")
  fi

  curl -fsS -X POST "$1/internal/init-db" "${headers[@]}"
  echo
'

if [[ -n "${CRON_SECRET:-}" ]]; then
  bash -c "$init_db" _ "$deployment_url"
else
  vercel env run -e "$target" -- bash -c "$init_db" _ "$deployment_url"
fi
