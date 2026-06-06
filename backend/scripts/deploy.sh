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
terraform apply -auto-approve

echo "---"
echo "Backend URL: $(terraform output -raw backend_url)"
echo "API docs: $(terraform output -raw backend_url)/docs"
