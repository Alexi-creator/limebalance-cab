#!/bin/sh
# Генерит env-config.js из env-переменных контейнера перед стартом nginx.
# Официальный образ nginx прогоняет все /docker-entrypoint.d/*.sh при старте.
set -e

cat > /usr/share/nginx/html/env-config.js <<EOF
window.__ENV__ = {
  VITE_API_URL: "${VITE_API_URL:-/api}",
  VITE_TELEGRAM_BOT_USERNAME: "${VITE_TELEGRAM_BOT_USERNAME}",
  VITE_GOOGLE_CLIENT_ID: "${VITE_GOOGLE_CLIENT_ID}",
  VITE_GA_MEASUREMENT_ID: "${VITE_GA_MEASUREMENT_ID}",
};
EOF
