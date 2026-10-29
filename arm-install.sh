#!/usr/bin/env bash
# BitLite System — ARM64 (aarch64) Installation Script
# Repository: https://github.com/clonerdev/BitLite-System

set -e

VERSION="1.0.0"
ARCH="arm64"
APP_NAME="BitLite System"
REPO_URL="https://github.com/clonerdev/BitLite-System.git"
RAW_INSTALL_URL="https://raw.githubusercontent.com/clonerdev/BitLite-System/main/install.sh"

echo "========================================================"
echo "  ${APP_NAME} v${VERSION} (${ARCH}) — Installer"
echo "  Repository: ${REPO_URL}"
echo "========================================================"
echo "Detected architecture: $(uname -m)"

if [ -f "./install.sh" ]; then
  bash ./install.sh "$@"
else
  bash <(curl -s -L "${RAW_INSTALL_URL}") "$@"
fi
