#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")/../terraform" && pwd)"
cd "$DIR"

if [ ! -f .env ]; then
  echo "Missing .env in terraform/ — copy .env.example to .env and fill in your values"
  exit 1
fi

set -a; source .env; set +a
terraform init
terraform apply -auto-approve

echo "---"
echo "Backend URL: $(terraform output -raw backend_url)"
echo "API docs: $(terraform output -raw backend_url)/docs"
