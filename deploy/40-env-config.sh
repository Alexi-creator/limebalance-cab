#!/bin/sh
# Generates env-config.js from the container env vars before nginx starts.
# The official nginx image runs every /docker-entrypoint.d/*.sh on startup.
set -e

cat > /usr/share/nginx/html/env-config.js <<EOF
window.__ENV__ = {
  VITE_API_URL: "${VITE_API_URL:-/api}",
  VITE_TELEGRAM_BOT_USERNAME: "${VITE_TELEGRAM_BOT_USERNAME}",
  VITE_GOOGLE_CLIENT_ID: "${VITE_GOOGLE_CLIENT_ID}",
  VITE_GA_MEASUREMENT_ID: "${VITE_GA_MEASUREMENT_ID}",
};
EOF
