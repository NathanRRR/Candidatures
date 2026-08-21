#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs app --tail=30
