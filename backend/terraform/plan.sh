#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

if [ ! -f .env ]; then
  echo "Missing .env — copy .env.example to .env and fill in your values"
  exit 1
fi

source .env
terraform init
terraform plan
