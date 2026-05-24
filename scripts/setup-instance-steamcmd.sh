#!/bin/bash
###############################################################################
# Script para configurar una nueva instancia de Project Zomboid via SteamCMD
# Automatizado para PZWebAdmin
###############################################################################

set -euo pipefail

# Argumentos
if [ "${1:-}" = "--delete" ]; then
    PZDIR=$2
    SERVICE=$3
    PZNAME=$4
    INI_PATH=${5:-}
    SAVE_PATH=${6:-}
    DB_PATH=${7:-}
    ADMIN_USER="pzadmin"

    echo "Deleting instance (PZDIR=$PZDIR, SERVICE=$SERVICE, PZNAME=$PZNAME, INI_PATH=$INI_PATH, SAVE_PATH=$SAVE_PATH, DB_PATH=$DB_PATH)..."
    
    # 1. Stop and clean systemd
    if [ -n "$SERVICE" ] && [[ "$SERVICE" =~ ^pzomboid([@_-][a-zA-Z0-9_-]+)?$ ]]; then
        sudo systemctl stop "$SERVICE" 2>/dev/null || true
        sudo systemctl disable "$SERVICE" 2>/dev/null || true
        sudo rm -f "/etc/systemd/system/$SERVICE.service"
        sudo systemctl daemon-reload
    fi

    # 2. Delete PZDIR
    if [ -n "$PZDIR" ] && [[ "$PZDIR" == /opt/* ]] && [ "$PZDIR" != "/opt" ]; then
        sudo rm -rf "$PZDIR"
    fi

    # 3. Delete Configs and Saves (explicit paths if provided)
    if [ -n "$INI_PATH" ] && [[ "$INI_PATH" == /home/$ADMIN_USER/Zomboid/Server/* ]]; then
        sudo -u $ADMIN_USER rm -f "$INI_PATH"
    fi
    if [ -n "$SAVE_PATH" ] && [[ "$SAVE_PATH" == /home/$ADMIN_USER/Zomboid/Saves/* ]]; then
        sudo -u $ADMIN_USER rm -rf "$SAVE_PATH"
    fi
    if [ -n "$DB_PATH" ] && [[ "$DB_PATH" == /home/$ADMIN_USER/Zomboid/db/* ]]; then
        sudo -u $ADMIN_USER rm -rf "$DB_PATH"
    fi

    # 4. Backward compatibility by pzName conventions
    if [ -n "$PZNAME" ] && [[ "$PZNAME" =~ ^[a-zA-Z0-9_-]{1,64}$ ]]; then
        sudo -u $ADMIN_USER rm -f "/home/$ADMIN_USER/Zomboid/Server/$PZNAME.ini"
        sudo -u $ADMIN_USER rm -f "/home/$ADMIN_USER/Zomboid/Server/${PZNAME}_SandboxVars.lua"
        sudo -u $ADMIN_USER rm -f "/home/$ADMIN_USER/Zomboid/Server/${PZNAME}_spawnregions.lua"
        sudo -u $ADMIN_USER rm -f "/home/$ADMIN_USER/Zomboid/Server/${PZNAME}_spawnpoints.lua"
        sudo -u $ADMIN_USER rm -f "/home/$ADMIN_USER/Zomboid/Server/${PZNAME}_zombies.ini"
        sudo -u $ADMIN_USER rm -rf "/home/$ADMIN_USER/Zomboid/db/$PZNAME.db"
        sudo -u $ADMIN_USER rm -rf "/home/$ADMIN_USER/Zomboid/Saves/Multiplayer/$PZNAME"
    fi
    
    echo "Deleted successfully."
    exit 0
fi

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

ID=$(echo "$NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')
INSTALL_DIR="/opt/pzserver-$ID"
SERVICE_NAME="pzomboid-$ID"
SERVER_NAME="pzserver-$ID"
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

steamcmd_install() {
    local beta="$1"
    if [ -n "$beta" ]; then
        sudo -u "$ADMIN_USER" "$STEAMCMD_PATH" \
            +@sSteamCmdForcePlatformType linux \
            +login anonymous \
            +force_install_dir "$INSTALL_DIR" \
            +app_update 380870 -beta "$beta" validate \
            +quit
    else
        sudo -u "$ADMIN_USER" "$STEAMCMD_PATH" \
            +@sSteamCmdForcePlatformType linux \
            +login anonymous \
            +force_install_dir "$INSTALL_DIR" \
            +app_update 380870 validate \
            +quit
    fi
}

if ! steamcmd_install "$STEAM_BRANCH"; then
    echo "WARN: SteamCMD installation failed for branch '$BRANCH_ID'. Retrying without validate..."

    if [ -n "$STEAM_BRANCH" ]; then
        sudo -u "$ADMIN_USER" "$STEAMCMD_PATH" \
            +@sSteamCmdForcePlatformType linux \
            +login anonymous \
            +force_install_dir "$INSTALL_DIR" \
            +app_update 380870 -beta "$STEAM_BRANCH" \
            +quit || true
    else
        sudo -u "$ADMIN_USER" "$STEAMCMD_PATH" \
            +@sSteamCmdForcePlatformType linux \
            +login anonymous \
            +force_install_dir "$INSTALL_DIR" \
            +app_update 380870 \
            +quit || true
    fi

    if [ -x "$INSTALL_DIR/start-server.sh" ]; then
        echo "WARN: SteamCMD returned non-zero but installation appears usable. Continuing."
    else
        echo "WARN: SteamCMD installation failed and no usable start-server.sh found. Falling back to local template copy."
        TEMPLATE_DIR="${PZ_TEMPLATE_DIR:-/opt/pzserver}"

        if [ ! -d "$TEMPLATE_DIR" ]; then
            # Optional secondary fallback for common alternate install path.
            if [ -d "/opt/pzserver64" ]; then
                TEMPLATE_DIR="/opt/pzserver64"
            fi
        fi

        if [ ! -d "$TEMPLATE_DIR" ]; then
            echo "INSTALL_FAILED: SteamCMD failed and template directory '$TEMPLATE_DIR' was not found."
            exit 7
        fi

        if command -v rsync >/dev/null 2>&1; then
            sudo rsync -a --delete "$TEMPLATE_DIR/" "$INSTALL_DIR/"
        else
            sudo cp -a "$TEMPLATE_DIR/." "$INSTALL_DIR/"
        fi

        sudo chown -R "$ADMIN_USER":"$ADMIN_USER" "$INSTALL_DIR"
    fi
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
