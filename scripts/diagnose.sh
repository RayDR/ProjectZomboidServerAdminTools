#!/bin/bash
###############################################################################
# PZWebAdmin Diagnostic Script
###############################################################################

set -euo pipefail

echo "========================================"
echo "    PZWebAdmin System Diagnostics       "
echo "========================================"
echo ""

echo "[1] Current User"
echo "----------------"
id
echo ""

echo "[2] PM2 / Backend Process Owner"
echo "-------------------------------"
if command -v pm2 &> /dev/null; then
    pm2 jlist | grep -o '"name":"pzwebadmin-backend"[^}]*"pm2_env":{[^}]*"USERNAME":"[^"]*"' | sed -E 's/.*"USERNAME":"([^"]*)".*/\1/' || echo "Backend not running in PM2 or PM2 not found."
    ps aux | grep pzwebadmin-backend | grep -v grep | awk '{print "Process Owner: " $1}' | head -n 1
else
    echo "PM2 not found in PATH."
fi
echo ""

echo "[3] Directory Ownership"
echo "-----------------------"
for dir in "/opt/pzwebadmin" "/opt/pzwebadmin/backups"; do
    if [ -d "$dir" ]; then
        echo "$dir:"
        stat -c "%U:%G" "$dir"
    else
        echo "$dir: NOT FOUND"
    fi
done

if [ -d "/home/pzadmin/Zomboid" ]; then
    echo "/home/pzadmin/Zomboid:"
    stat -c "%U:%G" /home/pzadmin/Zomboid
else
    echo "/home/pzadmin/Zomboid: NOT FOUND"
fi

echo -n "PZ_INSTANCES_ROOT (/opt): "
ls -ld /opt | awk '{print $3":"$4}'
echo ""

echo "[4] Sudoers Configuration"
echo "-------------------------"
if [ -f "/etc/sudoers.d/pzwebadmin" ]; then
    echo "File exists: /etc/sudoers.d/pzwebadmin"
    ls -l /etc/sudoers.d/pzwebadmin
else
    echo "File DOES NOT exist: /etc/sudoers.d/pzwebadmin"
fi
echo ""
echo "sudo -l for sysops:"
sudo -n -l -U sysops || echo "Could not run sudo -l for sysops"
echo ""

echo "[5] Systemd Services Validation"
echo "-------------------------------"
echo "Active or Failed pzomboid services:"
systemctl list-units --type=service --state=active,failed | grep "pzomboid" || echo "No pzomboid services active/failed."
echo ""
echo "Testing sudo passwordless capability:"
if sudo -n /usr/bin/systemctl status pzomboid-build42 >/dev/null 2>&1; then
    echo "SUCCESS: 'sudo -n /usr/bin/systemctl status pzomboid-build42' executed without password."
else
    echo "WARNING: 'sudo -n /usr/bin/systemctl status pzomboid-build42' failed or requires password. (Note: service might not exist)"
    # We test with a dummy command just to see if sudo -n works for systemctl
    sudo -n /usr/bin/systemctl --version >/dev/null 2>&1 && echo "sudo -n systemctl works" || echo "sudo -n systemctl fails"
fi
echo ""

echo "[6] Environment Info"
echo "--------------------"
echo "Node version: $(node -v 2>/dev/null || echo 'Not installed')"
echo "NPM version: $(npm -v 2>/dev/null || echo 'Not installed')"
echo "SteamCMD: $([ -f /steamcmd/steamcmd.sh ] && echo 'Found at /steamcmd/steamcmd.sh' || echo 'Not found')"
echo ""

echo "========================================"
echo "          Diagnostics Complete          "
echo "========================================"
