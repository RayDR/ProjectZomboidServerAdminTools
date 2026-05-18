#!/bin/bash
# PZWebAdmin Sudoers Configuration Script
# This script configures sudo permissions for the pzadmin user

SUDOERS_FILE="/etc/sudoers.d/pzwebadmin"
PZ_USER="${PZ_ADMIN_USER:-pzadmin}"
PZ_SERVICE="${PZ_SERVICE:-projectzomboid}"

echo "Configuring sudo permissions for PZWebAdmin..."

# Create sudoers configuration
sudo tee "$SUDOERS_FILE" > /dev/null <<EOF
# PZWebAdmin - Project Zomboid Server Management
# Allow $PZ_USER to manage the Project Zomboid server without password

# Legacy single service commands
$PZ_USER ALL=(ALL) NOPASSWD: /bin/systemctl start $PZ_SERVICE
$PZ_USER ALL=(ALL) NOPASSWD: /bin/systemctl stop $PZ_SERVICE
$PZ_USER ALL=(ALL) NOPASSWD: /bin/systemctl restart $PZ_SERVICE
$PZ_USER ALL=(ALL) NOPASSWD: /bin/systemctl status $PZ_SERVICE

# Multi-instance commands used by backend (/usr/bin/systemctl with pzomboid-*)
$PZ_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl start pzomboid-*
$PZ_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl stop pzomboid-*
$PZ_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart pzomboid-*
$PZ_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl status pzomboid-*
$PZ_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl is-active pzomboid-*
$PZ_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl kill pzomboid-*
$PZ_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl show pzomboid-* --property=* --value

# Backup script
$PZ_USER ALL=(ALL) NOPASSWD: /opt/pzserver/scripts/backup.sh

# Instance setup script invoked by backend create flow
$PZ_USER ALL=(ALL) NOPASSWD: /bin/bash /opt/pzwebadmin/scripts/setup-instance-steamcmd.sh *

# Process management (for status checks)
$PZ_USER ALL=(ALL) NOPASSWD: /usr/bin/pgrep
$PZ_USER ALL=(ALL) NOPASSWD: /bin/ps
EOF

# Set proper permissions
sudo chmod 0440 "$SUDOERS_FILE"

# Validate sudoers file
if sudo visudo -c -f "$SUDOERS_FILE"; then
    echo "✅ Sudoers configuration created successfully at $SUDOERS_FILE"
    echo "✅ User $PZ_USER can now manage the $PZ_SERVICE service without password"
else
    echo "❌ Error: Invalid sudoers configuration"
    sudo rm -f "$SUDOERS_FILE"
    exit 1
fi

echo ""
echo "Configured permissions:"
echo "  - systemctl start/stop/restart/status $PZ_SERVICE"
echo "  - systemctl start/stop/restart/status/is-active/kill pzomboid-*"
echo "  - /opt/pzserver/scripts/backup.sh"
echo "  - pgrep and ps commands for process monitoring"
