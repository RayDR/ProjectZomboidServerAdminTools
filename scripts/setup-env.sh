#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

CONFIG_FILE="${1:-"./config.template.json"}"
BACKEND_LINK="../backend"
FRONTEND_LINK="../frontend"
BACKEND_ENV="$BACKEND_LINK/.env"
FRONTEND_ENV="$FRONTEND_LINK/.env.local"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ [ERROR] - Config file not found: $CONFIG_FILE"
  exit 1
fi

# Create symlinks if they don't exist
[ ! -d "$BACKEND_LINK" ] && ln -s ../backend backend
[ ! -d "$FRONTEND_LINK" ] && ln -s ../frontend frontend

PZ_DIR=$(jq -r .pz_dir "$CONFIG_FILE")
PZ_SERVICE=$(jq -r .pz_service "$CONFIG_FILE")
PZ_NAME=$(jq -r .pz_name "$CONFIG_FILE")
PZ_LOG=$(jq -r .pz_log_path "$CONFIG_FILE")
PZ_MAINTENANCE_LOG=$(jq -r .pz_maintenance_log_path "$CONFIG_FILE")
PZ_INI=$(jq -r .pz_ini_path "$CONFIG_FILE")
PZ_SAVE=$(jq -r .pz_save_path "$CONFIG_FILE")
PZ_ADMIN=$(jq -r .pz_admin_user "$CONFIG_FILE")
PZ_RCON_PASS=$(jq -r .pz_rcon_password "$CONFIG_FILE")
PZ_RCON_PORT=$(jq -r .pz_rcon_port "$CONFIG_FILE")
PZ_RCON_HOST=$(jq -r .pz_rcon_host "$CONFIG_FILE")
PZ_STEAMCMD=$(jq -r .pz_steamcmd_path "$CONFIG_FILE")
FRONTEND_URL=$(jq -r .frontend_url "$CONFIG_FILE")
BACKEND_URL=$(jq -r .backend_url "$CONFIG_FILE")

cat > "$BACKEND_ENV" <<EOF
PZ_DIR=$PZ_DIR
PZ_NAME=$PZ_NAME
PZ_ADMIN_USER=$PZ_ADMIN
PZ_SERVICE=$PZ_SERVICE
PZ_LOG_PATH=$PZ_LOG
PZ_MAINTENANCE_LOG_PATH=$PZ_MAINTENANCE_LOG
PZ_INI_PATH=$PZ_INI
PZ_SAVE_PATH=$PZ_SAVE
PZ_STEAMCMD_PATH=$PZ_STEAMCMD
PZ_RCON_PASSWORD=$PZ_RCON_PASS
PZ_RCON_PORT=$PZ_RCON_PORT
PZ_RCON_HOST=$PZ_RCON_HOST
EOF

cat > "$FRONTEND_ENV" <<EOF
NEXT_PUBLIC_API_URL=$BACKEND_URL
NEXT_PUBLIC_SERVER_NAME=$PZ_NAME
NEXT_PUBLIC_PZ_LOG_PATH=$PZ_LOG
NEXT_PUBLIC_PZ_NAME=$PZ_NAME
NEXT_PUBLIC_WEBADMIN_URL=$FRONTEND_URL
EOF

echo "✅ [OK] - Environment Setup Completed"
