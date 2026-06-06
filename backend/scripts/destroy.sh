#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")/../terraform" && pwd)"
cd "$DIR"

if [ ! -f .env ]; then
  echo "Missing .env in terraform/ — copy .env.example to .env and fill in your values"
  exit 1
fi

source .env
terraform destroy -auto-approve
