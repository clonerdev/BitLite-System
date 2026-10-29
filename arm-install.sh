#!/usr/bin/env bash
# BitLite System — ARM64 (aarch64) Installation Script
set -e

VERSION="1.0.0"
ARCH="arm64"
APP_NAME="BitLite System"
APP_ID="bitlitesystem"
SERVICE_NAME="bitliteservice"

echo "========================================================"
echo "  ${APP_NAME} v${VERSION} (${ARCH}) — Installer"
echo "========================================================"
echo "Detected architecture: $(uname -m)"
echo "Run ./install.sh for full interactive service management."
