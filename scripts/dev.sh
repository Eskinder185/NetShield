#!/usr/bin/env bash
# Linux/macOS: start API (embedded H2, no Docker needed) and web dev server. Ctrl-C stops both.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
(cd "$root/services/api" && mvn spring-boot:run -Dspring-boot.run.profiles=h2) &
api=$!
trap 'kill $api 2>/dev/null' EXIT
cd "$root/apps/web" && npm install && npm run dev
