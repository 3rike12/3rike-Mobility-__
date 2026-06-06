#!/bin/bash
set -euo pipefail

# Install system dependencies
apt-get update -qq
apt-get install -y -qq curl git python3 python3-venv python3-pip postgresql-client

# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh
source /root/.bashrc

# Clone the repo (or copy from S3)
cd /opt
git clone https://github.com/Arthurite-Integrated/3rike-Mobility-__.git || {
  # Fallback: create project dir manually
  mkdir -p /opt/3rike-mobility
}

# Set up the backend
cd /opt/3rike-mobility/backend
uv sync

# Create .env
cat > .env << EOF
DATABASE_URL=postgresql://postgres:${db_password}@${db_host}:5432/swap_db
AWS_REGION=${aws_region}
S3_BUCKET=${s3_bucket}
USE_BEDROCK=true
EOF

# Seed the database
uv run python -m app.seed

# Create systemd service
cat > /etc/systemd/system/fastapi.service << EOF
[Unit]
Description=FastAPI Backend
After=network.target

[Service]
WorkingDirectory=/opt/3rike-mobility/backend
ExecStart=/opt/3rike-mobility/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
User=root
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable fastapi
systemctl start fastapi
