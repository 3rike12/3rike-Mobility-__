#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -f "$DIR/.env" ]; then
  echo "Missing .env in backend/ — copy .env.example to .env and fill in your values"
  exit 1
fi

set -a; source "$DIR/.env"; set +a
cd "$DIR/terraform"
terraform init
terraform plan
