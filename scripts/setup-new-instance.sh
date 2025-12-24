#!/bin/bash
###############################################################################
# Script para configurar una nueva instancia de Project Zomboid
# © 2025 DomoForge
###############################################################################

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   Nueva Instancia de Project Zomboid${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

# Configuración
INSTALL_DIR="/opt/pzserver-new"
SERVICE_NAME="pzomboid-new"
SERVER_NAME="pzdesveladitas-new"
GAME_PORT=16262
RCON_PORT=27016
ADMIN_USER="pzadmin"

echo -e "${YELLOW}Configuración:${NC}"
echo "  - Directorio: $INSTALL_DIR"
echo "  - Servicio: $SERVICE_NAME"
echo "  - Nombre: $SERVER_NAME"
echo "  - Puerto juego: $GAME_PORT"
echo "  - Puerto RCON: $RCON_PORT"
echo ""

read -p "¿Continuar con la instalación? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
    echo -e "${RED}Instalación cancelada${NC}"
    exit 1
fi

# 1. Crear directorio de instalación
echo -e "${GREEN}[1/7] Creando directorio de instalación...${NC}"
sudo mkdir -p "$INSTALL_DIR"
sudo chown $ADMIN_USER:$ADMIN_USER "$INSTALL_DIR"

# 2. Descargar/actualizar servidor con SteamCMD
echo -e "${GREEN}[2/7] Descargando Project Zomboid (esto puede tardar varios minutos)...${NC}"
sudo -u $ADMIN_USER /steamcmd/steamcmd.sh +login anonymous +force_install_dir "$INSTALL_DIR" +app_update 380870 validate +quit

# 3. Crear estructura de directorios
echo -e "${GREEN}[3/7] Creando estructura de directorios...${NC}"
sudo mkdir -p "$INSTALL_DIR/logs"
sudo mkdir -p "$INSTALL_DIR/backups"
sudo mkdir -p "/home/$ADMIN_USER/Zomboid/Server"
sudo mkdir -p "/home/$ADMIN_USER/Zomboid/Saves/Multiplayer"

# 4. Copiar configuración base desde instancia actual
echo -e "${GREEN}[4/7] Copiando configuración base...${NC}"
if [ -f "/home/$ADMIN_USER/Zomboid/Server/pzdesveladitas.ini" ]; then
    cp "/home/$ADMIN_USER/Zomboid/Server/pzdesveladitas.ini" "/home/$ADMIN_USER/Zomboid/Server/$SERVER_NAME.ini"
    
    # Actualizar puertos en el archivo .ini
    sed -i "s/DefaultPort=16261/DefaultPort=$GAME_PORT/g" "/home/$ADMIN_USER/Zomboid/Server/$SERVER_NAME.ini"
    sed -i "s/RCONPort=27015/RCONPort=$RCON_PORT/g" "/home/$ADMIN_USER/Zomboid/Server/$SERVER_NAME.ini"
    
    echo -e "  ${GREEN}✓${NC} Configuración copiada y puertos actualizados"
else
    echo -e "  ${YELLOW}⚠${NC} No se encontró configuración base, se creará al primer inicio"
fi

# 5. Crear servicio systemd
echo -e "${GREEN}[5/7] Creando servicio systemd...${NC}"
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null <<EOF
[Unit]
Description=Project Zomboid Server - New Instance
After=network.target

[Service]
Type=simple
User=$ADMIN_USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/start-server.sh -servername $SERVER_NAME
Restart=on-failure
RestartSec=10
StandardOutput=append:$INSTALL_DIR/logs/server.log
StandardError=append:$INSTALL_DIR/logs/server.log

[Install]
WantedBy=multi-user.target
EOF

# 6. Configurar permisos sudoers
echo -e "${GREEN}[6/7] Configurando permisos sudoers...${NC}"
SUDOERS_FILE="/etc/sudoers.d/pzwebadmin-new"
sudo tee $SUDOERS_FILE > /dev/null <<EOF
# PZWebAdmin - New Instance Service Management
pzadmin ALL=(ALL) NOPASSWD: /bin/systemctl start $SERVICE_NAME
pzadmin ALL=(ALL) NOPASSWD: /bin/systemctl stop $SERVICE_NAME
pzadmin ALL=(ALL) NOPASSWD: /bin/systemctl restart $SERVICE_NAME
pzadmin ALL=(ALL) NOPASSWD: /bin/systemctl status $SERVICE_NAME
pzadmin ALL=(ALL) NOPASSWD: /usr/bin/systemctl is-active $SERVICE_NAME
pzadmin ALL=(ALL) NOPASSWD: /usr/bin/systemctl show $SERVICE_NAME
EOF

sudo chmod 0440 $SUDOERS_FILE

# 7. Recargar systemd y ajustar permisos
echo -e "${GREEN}[7/7] Finalizando configuración...${NC}"
sudo systemctl daemon-reload
sudo chown -R $ADMIN_USER:$ADMIN_USER "$INSTALL_DIR"
sudo chown -R $ADMIN_USER:$ADMIN_USER "/home/$ADMIN_USER/Zomboid"

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   ✓ Instalación completada con éxito${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${YELLOW}Información importante:${NC}"
echo "  - Servicio: $SERVICE_NAME"
echo "  - Puerto del juego: $GAME_PORT"
echo "  - Puerto RCON: $RCON_PORT"
echo "  - Logs: $INSTALL_DIR/logs/server.log"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "  1. Editar configuración en: /home/$ADMIN_USER/Zomboid/Server/$SERVER_NAME.ini"
echo "  2. Activar la instancia desde la interfaz web"
echo "  3. La instancia actual se detendrá automáticamente"
echo ""
echo -e "${GREEN}Para verificar el estado del servicio:${NC}"
echo "  sudo systemctl status $SERVICE_NAME"
echo ""
