#!/bin/bash
###############################################################################
# Script para configurar una nueva instancia de Project Zomboid via SteamCMD
# Automatizado para PZWebAdmin
###############################################################################

set -euo pipefail

# Argumentos
BRANCH_ID=$1
STEAM_BRANCH=$2
NAME=$3
GAME_PORT=$4
RCON_PORT=$5
STEAMCMD_PATH=${6:-/steamcmd/steamcmd.sh}

if [ -z "$BRANCH_ID" ] || [ -z "$NAME" ] || [ -z "$GAME_PORT" ] || [ -z "$RCON_PORT" ]; then
    echo "Faltan argumentos: BRANCH_ID STEAM_BRANCH NAME GAME_PORT RCON_PORT [STEAMCMD_PATH]"
    exit 1
fi

if [[ ! "$NAME" =~ ^[a-zA-Z0-9_-]{1,48}$ ]]; then
    echo "Error: NAME is invalid. Only letters, numbers, dash and underscore are allowed."
    exit 1
fi

ID=$(echo "$NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')
INSTALL_DIR="/opt/pzserver-$ID"
SERVICE_NAME="pzomboid-$ID"
SERVER_NAME="pz$ID"
ADMIN_USER="pzadmin"
ADMIN_PASSWORD="${PZ_ADMIN_PASSWORD:-pzadmin}"

echo "Configurando instancia $NAME (branchId=$BRANCH_ID, steamBranch=${STEAM_BRANCH:-public})..."

if [ ! -x "$STEAMCMD_PATH" ]; then
    echo "STEAMCMD_NOT_FOUND: SteamCMD no encontrado o sin permisos de ejecucion en $STEAMCMD_PATH"
    exit 5
fi

# 1. Crear directorio
sudo mkdir -p "$INSTALL_DIR"
sudo chown $ADMIN_USER:$ADMIN_USER "$INSTALL_DIR"

# 2. Instalar con SteamCMD
# Si steam branch esta vacia, no usamos -beta (public)
BETA_ARG=""
if [ -n "$STEAM_BRANCH" ]; then
    BETA_ARG="-beta $STEAM_BRANCH"
fi

if ! sudo -u $ADMIN_USER "$STEAMCMD_PATH" +login anonymous +force_install_dir "$INSTALL_DIR" +app_update 380870 $BETA_ARG validate +quit; then
    echo "WARN: SteamCMD installation failed for branch '$BRANCH_ID'. Falling back to local template copy."
    TEMPLATE_DIR="${PZ_TEMPLATE_DIR:-/opt/pzserver}"

    if [ ! -d "$TEMPLATE_DIR" ]; then
        echo "INSTALL_FAILED: SteamCMD failed and template directory '$TEMPLATE_DIR' was not found."
        exit 7
    fi

    if command -v rsync >/dev/null 2>&1; then
        sudo rsync -a --delete "$TEMPLATE_DIR/" "$INSTALL_DIR/"
    else
        sudo cp -a "$TEMPLATE_DIR/." "$INSTALL_DIR/"
    fi

    sudo chown -R $ADMIN_USER:$ADMIN_USER "$INSTALL_DIR"
fi

# 3. Crear directorios
sudo -u $ADMIN_USER mkdir -p "$INSTALL_DIR/logs"
sudo -u $ADMIN_USER mkdir -p "$INSTALL_DIR/backups"
sudo -u $ADMIN_USER mkdir -p "/home/$ADMIN_USER/Zomboid/Server"
sudo -u $ADMIN_USER mkdir -p "/home/$ADMIN_USER/Zomboid/Saves/Multiplayer"

# 4. Crear archivo .ini básico
INI_FILE="/home/$ADMIN_USER/Zomboid/Server/$SERVER_NAME.ini"
if [ ! -f "$INI_FILE" ]; then
    sudo -u $ADMIN_USER tee "$INI_FILE" > /dev/null <<EOF
DefaultPort=$GAME_PORT
RCONPort=$RCON_PORT
RCONPassword=pzadmin
PublicName=$NAME
PublicDescription=Servidor Project Zomboid ($BRANCH_ID)
MaxPlayers=32
EOF
fi

# 5. Crear servicio systemd
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null <<EOF
[Unit]
Description=Project Zomboid Server - $NAME
After=network.target

[Service]
Type=simple
User=$ADMIN_USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/start-server.sh -servername $SERVER_NAME -adminpassword $ADMIN_PASSWORD
Restart=on-failure
RestartSec=10
StandardOutput=append:$INSTALL_DIR/logs/server.log
StandardError=append:$INSTALL_DIR/logs/server.log

[Install]
WantedBy=multi-user.target
EOF

# 6. Recargar y habilitar
sudo systemctl daemon-reload
# Opcional: sudo systemctl enable $SERVICE_NAME

# 7. Ajustar permisos finales
sudo chown -R $ADMIN_USER:$ADMIN_USER "$INSTALL_DIR"

echo "Instancia $NAME creada exitosamente en $INSTALL_DIR"
