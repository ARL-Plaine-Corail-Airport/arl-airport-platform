#!/usr/bin/env bash
# Initializes Let's Encrypt certificates for production deployment.
# Usage: DOMAIN=airport.example.com EMAIL=admin@example.com ./scripts/init-letsencrypt.sh

set -euo pipefail

: "${DOMAIN:?Set DOMAIN env var (e.g. airport.example.com)}"

EMAIL="${EMAIL:-}"
if [ -z "$EMAIL" ]; then
  EMAIL="${CERTBOT_EMAIL:-}"
fi
: "${EMAIL:?Set EMAIL or CERTBOT_EMAIL env var for Lets Encrypt notifications}"

data_path="./certbot"
rsa_key_size=4096

if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  echo "Downloading recommended TLS parameters..."
  mkdir -p "$data_path/conf"
  curl -sf https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -sf https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
fi

echo "Creating temporary self-signed certificate..."
mkdir -p "$data_path/conf/live/$DOMAIN"
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout "$data_path/conf/live/$DOMAIN/privkey.pem" \
  -out "$data_path/conf/live/$DOMAIN/fullchain.pem" \
  -subj "/CN=$DOMAIN" 2>/dev/null

echo "Starting Nginx..."
docker compose -f docker-compose.prod.yml up -d nginx
sleep 5

echo "Requesting Let's Encrypt certificate for $DOMAIN..."
rm -rf "$data_path/conf/live/$DOMAIN"

docker compose -f docker-compose.prod.yml run --rm certbot \
  certonly --webroot -w /var/www/certbot \
  -d "$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --rsa-key-size "$rsa_key_size" \
  --force-renewal

echo "Reloading Nginx..."
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "Done. Certificate issued for $DOMAIN."
