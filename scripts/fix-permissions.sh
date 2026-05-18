#!/bin/bash
###############################################################################
# Script para configurar permisos correctos para PZWebAdmin
# Ejecutar con sudo
###############################################################################

set -euo pipefail

echo "Configurando sudoers para sysops..."

SUDOERS_FILE="/etc/sudoers.d/pzwebadmin"
tee $SUDOERS_FILE > /dev/null <<EOF
# PZWebAdmin - Permitir a sysops administrar servicios pzomboid-* y pzomboid@* de forma segura
sysops ALL=(root) NOPASSWD: /usr/bin/systemctl start pzomboid-*, /usr/bin/systemctl stop pzomboid-*, /usr/bin/systemctl restart pzomboid-*, /usr/bin/systemctl status pzomboid-*, /usr/bin/systemctl is-active pzomboid-*, /usr/bin/systemctl kill -s SIGKILL pzomboid-*, /usr/bin/systemctl show pzomboid-*, /usr/bin/systemctl disable pzomboid-*, /usr/bin/systemctl daemon-reload
sysops ALL=(root) NOPASSWD: /usr/bin/journalctl -u pzomboid-*
sysops ALL=(root) NOPASSWD: /usr/bin/systemctl start pzomboid@*, /usr/bin/systemctl stop pzomboid@*, /usr/bin/systemctl restart pzomboid@*, /usr/bin/systemctl status pzomboid@*, /usr/bin/systemctl is-active pzomboid@*, /usr/bin/systemctl kill -s SIGKILL pzomboid@*, /usr/bin/systemctl show pzomboid@*
sysops ALL=(root) NOPASSWD: /usr/bin/journalctl -u pzomboid@*
sysops ALL=(root) NOPASSWD: /bin/rm -f /etc/systemd/system/pzomboid-*.service, /bin/rm -rf /opt/pzserver-*
EOF

# Validate syntax
visudo -cf $SUDOERS_FILE

chmod 0440 $SUDOERS_FILE

echo "Ajustando ownership de /opt/pzwebadmin a sysops:sysops..."
chown -R sysops:sysops /opt/pzwebadmin
# Fix permissions on scripts so they are executable
chmod +x /opt/pzwebadmin/scripts/*.sh

echo "Permisos configurados exitosamente."
