#!/bin/bash

set -e

KEY_DIR="server/keys"
ENV_FILE="server/.env"

mkdir -p "$KEY_DIR"

openssl genpkey -algorithm RSA -out "$KEY_DIR/new_private.pem" -pkeyopt rsa_keygen_bits:4096

openssl rsa -pubout -in "$KEY_DIR/new_private.pem" -out "$KEY_DIR/new_public.pem"

sed -i "s|JWT_PRIVATE_KEY=.*|JWT_PRIVATE_KEY=\"$(cat $KEY_DIR/new_private.pem | tr '\n' '#' | sed 's/#/\\n/g')\"|" "$ENV_FILE"
sed -i "s|JWT_PUBLIC_KEY=.*|JWT_PUBLIC_KEY=\"$(cat $KEY_DIR/new_public.pem | tr '\n' '#' | sed 's/#/\\n/g')\"|" "$ENV_FILE"

mv "$KEY_DIR/new_private.pem" "$KEY_DIR/jwt_private.pem"
mv "$KEY_DIR/new_public.pem" "$KEY_DIR/jwt_public.pem"

echo "Keys rotated successfully. Please restart the server."