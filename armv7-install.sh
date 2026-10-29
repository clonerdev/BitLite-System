#!/usr/bin/env bash
# BitLite System — ARMv7 (armhf) Installation Script
set -e

VERSION="1.0.0"
ARCH="armv7"
APP_NAME="BitLite System"
APP_ID="bitlitesystem"
SERVICE_NAME="bitliteservice"

echo "========================================================"
echo "  ${APP_NAME} v${VERSION} (${ARCH}) — Installer"
echo "========================================================"
echo "Detected architecture: $(uname -m)"
echo "Run ./install.sh for full interactive service management."
