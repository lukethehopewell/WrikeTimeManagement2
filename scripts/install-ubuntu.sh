#!/usr/bin/env bash
# ==============================================================================
# Native Ubuntu Installation Script for Wrike Timesheet & Remote Work Tracker
# Supported Distributions: Ubuntu 22.04 LTS (Jammy) / Ubuntu 24.04 LTS (Noble)
# ==============================================================================

set -euo pipefail

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
ORANGE='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  Installing Wrike Timesheet on Ubuntu Linux Host      ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Check for root / sudo privileges
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}[ERROR] This installation script must be run as root or with sudo.${NC}" 
   exit 1
fi

# Detect Ubuntu
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" != "ubuntu" && "$ID_LIKE" != *"ubuntu"* ]]; then
        echo -e "${ORANGE}[WARNING] This script is optimized for Ubuntu. Detected OS: $NAME.${NC}"
    fi
else
    echo -e "${RED}[ERROR] Unable to detect operating system distribution.${NC}"
    exit 1
fi

APP_DIR="/opt/wrike-timesheet-app"
APP_USER="wrikeapp"

echo -e "\n${BLUE}[1/6] Updating APT repositories and installing core dependencies...${NC}"
apt-get update
apt-get install -y --no-install-recommends \
    curl \
    git \
    nginx \
    ca-certificates \
    gnupg \
    ufw

echo -e "\n${BLUE}[2/6] Installing Node.js 22 LTS via NodeSource...${NC}"
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
apt-get update
apt-get install -y nodejs

echo -e "${GREEN}✓ Node.js $(node -v) and NPM $(npm -v) installed.${NC}"

echo -e "\n${BLUE}[3/6] Setting up application user and directory...${NC}"
if ! id -u "$APP_USER" >/dev/null 2>&1; then
    useradd -r -s /bin/false -d "$APP_DIR" "$APP_USER"
    echo -e "${GREEN}✓ Created system user: $APP_USER${NC}"
fi

mkdir -p "$APP_DIR"

# Copy project files from current directory if not already inside /opt
CURRENT_DIR="$(pwd)"
if [ "$CURRENT_DIR" != "$APP_DIR" ]; then
    echo "Copying application files from $CURRENT_DIR to $APP_DIR..."
    cp -r "$CURRENT_DIR"/* "$APP_DIR"/
fi

echo -e "\n${BLUE}[4/6] Installing npm dependencies and building frontend assets...${NC}"
cd "$APP_DIR"
npm install --legacy-peer-deps
npm run build

chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

echo -e "\n${BLUE}[5/6] Installing systemd service unit...${NC}"
cp "$APP_DIR/wrike-timesheet.service" /etc/systemd/system/wrike-timesheet.service
systemctl daemon-reload
systemctl enable wrike-timesheet
systemctl restart wrike-timesheet

echo -e "\n${BLUE}[6/6] Configuring Nginx reverse proxy...${NC}"
cp "$APP_DIR/nginx/wrike-timesheet.conf" /etc/nginx/sites-available/wrike-timesheet
ln -sf /etc/nginx/sites-available/wrike-timesheet /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

# Configure UFW firewall
if ufw status | grep -qw "active"; then
    echo "Allowing HTTP and HTTPS through UFW firewall..."
    ufw allow 'Nginx Full'
fi

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}  ✓ Deployment Complete! Wrike Timesheet is Running!  ${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "Service Status: $(systemctl is-active wrike-timesheet)"
echo -e "Web Server:     Nginx running on port 80"
echo -e "Node Backend:   Running on 127.0.0.1:3000"
echo -e ""
echo -e "To view live logs:    ${BLUE}sudo journalctl -u wrike-timesheet -f${NC}"
echo -e "To restart service:   ${BLUE}sudo systemctl restart wrike-timesheet${NC}"
echo -e "To add free SSL:      ${BLUE}sudo apt install -y certbot python3-certbot-nginx && sudo certbot --nginx${NC}"
