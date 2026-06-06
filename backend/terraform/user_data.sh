#!/bin/bash
set -euo pipefail

exec > /var/log/3rike-setup.log 2>&1

# Install system dependencies
apt-get update -qq
apt-get install -y -qq curl git python3 python3-venv python3-pip postgresql-client

# Install uv to /usr/local/bin
curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR=/usr/local/bin sh

# Clone the repo
cd /opt
git clone https://github.com/3rike12/3rike-Mobility-__.git || {
  echo "Git clone failed, creating directory manually"
  mkdir -p /opt/3rike-mobility-repo
  cd /opt/3rike-mobility-repo
  mkdir -p backend/app backend/terraform
}

# Handle both possible clone directory names
if [ -d /opt/3rike-Mobility-__ ]; then
  cd /opt/3rike-Mobility-__/backend
elif [ -d /opt/3rike-mobility-repo ]; then
  cd /opt/3rike-mobility-repo/backend
else
  echo "No repo directory found"
  exit 1
fi

# Sync dependencies
/usr/local/bin/uv sync

# Create .env with actual variables (populated by Terraform template)
cat > .env << EOF
DATABASE_URL=postgresql://postgres:${db_password}@${db_host}:5432/swap_db
AWS_REGION=${aws_region}
S3_BUCKET=${s3_bucket}
USE_BEDROCK=true
EOF

# Seed the database (ignore if already seeded)
/usr/local/bin/uv run python -m app.seed 2>&1 || echo "Seed may have already run"

# Trigger the Lambda immediately so predictions exist
echo "Invoking forecast Lambda for immediate predictions..."
aws lambda invoke --function-name 3rike-mobility-forecast --invocation-type Event /tmp/lambda-invoke.json 2>&1 || echo "Lambda invoke deferred"

# Create systemd service
cat > /etc/systemd/system/fastapi.service << 'SERVICEEOF'
[Unit]
Description=FastAPI Backend
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=5
User=root
WorkingDirectory=/opt/3rike-Mobility-__/backend
ExecStart=/opt/3rike-Mobility-__/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
SERVICEEOF

systemctl daemon-reload
systemctl enable fastapi
systemctl start fastapi
