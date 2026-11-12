#!/usr/bin/env bash
# ==============================================================================
# Update Script for Native Ubuntu Server Deployment
# ==============================================================================

set -euo pipefail

APP_DIR="/opt/wrike-timesheet-app"
APP_USER="wrikeapp"

if [[ $EUID -ne 0 ]]; then
   echo "[ERROR] This update script must be run as root or with sudo." 
   exit 1
fi

echo "Updating Wrike Timesheet application in $APP_DIR..."
cd "$APP_DIR"

# Install any updated dependencies
npm install --legacy-peer-deps

# Rebuild frontend bundles
npm run build

# Fix permissions
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

# Graceful restart of the systemd service
systemctl restart wrike-timesheet

echo "✓ Application updated successfully! Active status: $(systemctl is-active wrike-timesheet)"
