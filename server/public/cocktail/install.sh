#!/bin/bash
set -e

# Arguments
SERVER_URL=""
TOKEN=""
DEVICE_ID=""

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --serverUrl) SERVER_URL="$2"; shift ;;
        --token) TOKEN="$2"; shift ;;
        --deviceId) DEVICE_ID="$2"; shift ;;
    esac
    shift
done

if [ -z "$SERVER_URL" ] || [ -z "$TOKEN" ] || [ -z "$DEVICE_ID" ]; then
  echo "Usage: install.sh --serverUrl <url> --token <token> --deviceId <id>"
  exit 1
fi

echo "Installing Cocktail Agent..."
echo "Server: $SERVER_URL"
echo "Device: $DEVICE_ID"

# 0. Dependencies
echo "Ensuring dependencies (curl, iproute2, npm)..."
if command -v apt-get >/dev/null; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq curl iproute2
elif command -v yum >/dev/null; then
    sudo yum install -y -q curl iproute2
fi

# 1. Detect OS and Arch
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

if [ "$OS" != "linux" ]; then
    echo "Error: Only Linux is supported currently."
    exit 1
fi

# Ensure Node.js is installed
if ! command -v node >/dev/null; then
  echo "Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "Detected: $OS / $ARCH"

# 2. Prepare Directories
INSTALL_DIR="/opt/cocktail"
CONFIG_DIR="/etc/cocktail"
mkdir -p "$INSTALL_DIR/dist"
mkdir -p "$CONFIG_DIR"
chown -R root:root "$CONFIG_DIR"
chmod 700 "$CONFIG_DIR"

# 3. Download Source & Package
echo "Downloading agent source..."
curl -ksSL "$SERVER_URL/cocktail/dist/index.js" -o "$INSTALL_DIR/dist/index.js"
curl -ksSL "$SERVER_URL/cocktail/package.json" -o "$INSTALL_DIR/package.json"

cd "$INSTALL_DIR"
echo "Installing dependencies..."
npm install --omit=dev --quiet

# 4. Create Systemd Service
SERVICE_FILE="/etc/systemd/system/cocktail.service"

echo "Creating systemd service..."

cat <<EOF > "$SERVICE_FILE"
[Unit]
Description=Reglook Cocktail Agent
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node dist/index.js --serverUrl "$SERVER_URL" --deviceId "$DEVICE_ID" --enrollmentToken "$TOKEN"
Restart=always
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

# 5. Start Service
systemctl daemon-reload
systemctl enable cocktail
systemctl restart cocktail

echo "Cocktail Agent installed and started!"
systemctl status cocktail --no-pager
