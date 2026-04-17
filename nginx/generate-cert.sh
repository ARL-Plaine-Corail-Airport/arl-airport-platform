#!/bin/sh
# Generates a self-signed certificate for local HTTPS development.
# Covers: localhost, 127.0.0.1, and your LAN IP (for phone access).
#
# Usage: sh nginx/generate-cert.sh [YOUR_LAN_IP]
# Example: sh nginx/generate-cert.sh 192.168.100.120

LAN_IP="${1:-192.168.100.120}"

openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout nginx/ssl/selfsigned.key \
  -out nginx/ssl/selfsigned.crt \
  -subj "/CN=ARL Airport Platform" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:${LAN_IP}"

echo "Certificate generated for localhost, 127.0.0.1, and ${LAN_IP}"
echo "Files: nginx/ssl/selfsigned.crt, nginx/ssl/selfsigned.key"
