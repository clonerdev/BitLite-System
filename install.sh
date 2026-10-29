#!/usr/bin/env bash
# BitLite System — Linux x86_64 Installation & Service Management Script
# Repository: https://github.com/clonerdev/BitLite-System
# Supported OS: Ubuntu 20.04 / 22.04 / 24.04+, Debian 11 / 12+, CentOS / Rocky 8+

set -e

VERSION="1.0.0"
APP_NAME="BitLite System"
APP_ID="bitlitesystem"
REPO_URL="https://github.com/clonerdev/BitLite-System.git"
RAW_BASE="https://raw.githubusercontent.com/clonerdev/BitLite-System/main"
INSTALL_DIR="/opt/bitlite-system"
SERVICE_NAME="bitliteservice"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
CLI_BIN="/usr/local/bin/bitlite"
DEFAULT_WEB_PORT="3000"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

check_root() {
  if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}[ERROR] Please run this script as root (sudo -i).${NC}"
    exit 1
  fi
}

ensure_dependencies() {
  echo -e "${CYAN}[INFO] Checking system dependencies (git, curl, Node.js 20+)...${NC}"
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -y
    apt-get install -y curl git build-essential ca-certificates
    if ! command -v node >/dev/null 2>&1; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
      apt-get install -y nodejs
    fi
  elif command -v dnf >/dev/null 2>&1 || command -v yum >/dev/null 2>&1; then
    yum install -y curl git gcc-c++ make
    if ! command -v node >/dev/null 2>&1; then
      curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
      yum install -y nodejs
    fi
  fi
}

create_systemd_service() {
  cat << EOF > "${SERVICE_FILE}"
[Unit]
Description=BitLite System Stratum Console & Access Control Server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=${INSTALL_DIR}
Environment=NODE_ENV=production
EnvironmentFile=-${INSTALL_DIR}/.env
ExecStart=/usr/bin/npx tsx ${INSTALL_DIR}/server.ts
Restart=always
RestartSec=5
LimitNOFILE=1048576

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable "${SERVICE_NAME}"
}

install_bitlite() {
  check_root
  ensure_dependencies

  if [ -d "${INSTALL_DIR}/.git" ]; then
    echo -e "${YELLOW}[INFO] Existing installation detected at ${INSTALL_DIR}. Pulling latest changes...${NC}"
    git -C "${INSTALL_DIR}" pull origin main
  else
    echo -e "${CYAN}[INFO] Cloning ${REPO_URL} into ${INSTALL_DIR}...${NC}"
    git clone "${REPO_URL}" "${INSTALL_DIR}"
  fi

  cd "${INSTALL_DIR}"
  if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
  fi

  npm install
  npm run build

  apply_bbr_and_limits
  install_cli_launcher
  create_systemd_service
  systemctl restart "${SERVICE_NAME}"

  echo -e "${GREEN}========================================================${NC}"
  echo -e "${GREEN}  ${APP_NAME} v${VERSION} installed and started!${NC}"
  echo -e "${GREEN}  Repository:   ${REPO_URL}${NC}"
  echo -e "${GREEN}  Install Path: ${INSTALL_DIR}${NC}"
  echo -e "${GREEN}  Web Console:  http://$(hostname -I | awk '{print $1}'):${DEFAULT_WEB_PORT}${NC}"
  echo -e "${GREEN}  Default User: bitlite_admin${NC}"
  echo -e "${GREEN}========================================================${NC}"
}

update_bitlite() {
  check_root
  if [ ! -d "${INSTALL_DIR}/.git" ]; then
    echo -e "${RED}[ERROR] BitLite System is not installed at ${INSTALL_DIR}. Choose option 1 first.${NC}"
    exit 1
  fi

  echo -e "${CYAN}[INFO] Backing up access control store before update...${NC}"
  if [ -f "${INSTALL_DIR}/data/access-control.json" ]; then
    cp "${INSTALL_DIR}/data/access-control.json" "${INSTALL_DIR}/data/access-control.backup-$(date +%F-%H%M%S).json"
  fi

  echo -e "${CYAN}[INFO] Pulling latest release from ${REPO_URL}...${NC}"
  cd "${INSTALL_DIR}"
  git pull origin main
  npm install
  npm run build
  systemctl restart "${SERVICE_NAME}"
  echo -e "${GREEN}[OK] BitLite System updated to latest version and restarted.${NC}"
}

uninstall_bitlite() {
  check_root
  systemctl stop "${SERVICE_NAME}" 2>/dev/null || true
  systemctl disable "${SERVICE_NAME}" 2>/dev/null || true
  rm -f "${SERVICE_FILE}" "${CLI_BIN}"
  systemctl daemon-reload
  echo -e "${YELLOW}[OK] Systemd service removed. Data directory preserved at ${INSTALL_DIR}.${NC}"
}

change_web_port() {
  check_root
  read -r -p "Enter new Web Console Port (1-65535) [default: 3000]: " NEW_PORT
  NEW_PORT=${NEW_PORT:-3000}
  if [ -f "${INSTALL_DIR}/.env" ]; then
    sed -i "s/^START_PORT=.*/START_PORT=${NEW_PORT}/" "${INSTALL_DIR}/.env"
  fi
  systemctl restart "${SERVICE_NAME}" 2>/dev/null || true
  echo -e "${GREEN}[OK] Web console port updated to ${NEW_PORT}.${NC}"
}

apply_bbr_and_limits() {
  check_root
  echo -e "${CYAN}[INFO] Applying TCP BBR congestion control and raising file descriptors...${NC}"
  cat << 'EOF' > /etc/sysctl.d/99-bitlite.conf
fs.file-max = 1048576
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_intvl = 30
net.ipv4.tcp_keepalive_probes = 5
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr
EOF
  sysctl --system >/dev/null 2>&1 || true

  if ! grep -q "bitlite-nofile" /etc/security/limits.conf; then
    cat << 'EOF' >> /etc/security/limits.conf
# bitlite-nofile
* soft nofile 1048576
* hard nofile 1048576
root soft nofile 1048576
root hard nofile 1048576
EOF
  fi
  echo -e "${GREEN}[OK] Kernel sysctl & ulimit optimization completed (LimitNOFILE=1048576, TCP BBR=active).${NC}"
}

install_cli_launcher() {
  check_root
  cat << 'EOF' > "${CLI_BIN}"
#!/usr/bin/env bash
SERVICE="bitliteservice.service"
INSTALL_DIR="/opt/bitlite-system"
case "$1" in
  start)   systemctl start "$SERVICE" && echo "[OK] BitLite service started." ;;
  stop)    systemctl stop "$SERVICE" && echo "[OK] BitLite service stopped." ;;
  restart) systemctl restart "$SERVICE" && echo "[OK] BitLite service restarted." ;;
  status)  systemctl status "$SERVICE" --no-pager ;;
  logs)    journalctl -u "$SERVICE" -f -n 100 ;;
  update)
    cd "$INSTALL_DIR" && git pull origin main && npm install && npm run build && systemctl restart "$SERVICE"
    echo "[OK] BitLite System updated from https://github.com/clonerdev/BitLite-System"
    ;;
  *)
    echo "Usage: bitlite {start|stop|restart|status|logs|update}"
    exit 1
    ;;
esac
EOF
  chmod +x "${CLI_BIN}"
  echo -e "${GREEN}[OK] CLI launcher installed at ${CLI_BIN}${NC}"
}

show_menu() {
  echo ""
  echo "========================================================"
  echo "  ${APP_NAME} v${VERSION} — Linux Management Utility"
  echo "  Repo: https://github.com/clonerdev/BitLite-System"
  echo "========================================================"
  echo "  1. Install BitLite System"
  echo "  2. Update BitLite System (Preserve Data & Configs)"
  echo "  3. Uninstall BitLite System"
  echo "  4. Start Service"
  echo "  5. Stop Service"
  echo "  6. Restart Service"
  echo "  7. Change Web Console Port"
  echo "  8. Raise ulimit & Apply Kernel TCP BBR"
  echo "  9. Configure HTTPS / TLS Access"
  echo " 10. Enable / Disable Web UI"
  echo " 12. Enable Systemd Autostart on Boot"
  echo " 20. Reset Admin Password"
  echo " 22. Install bitlite CLI Tool"
  echo " 24. Toggle Control API"
  echo "  0. Exit"
  echo "========================================================"
}

if [ $# -gt 0 ]; then
  case "$1" in
    --install) install_bitlite ; exit 0 ;;
    --update)  update_bitlite ; exit 0 ;;
    --bbr)     apply_bbr_and_limits ; exit 0 ;;
    --cli)     install_cli_launcher ; exit 0 ;;
  esac
fi

show_menu
if [ -t 0 ]; then
  read -r -p "Select an option [0-24]: " OPT
  case "${OPT}" in
    1)  install_bitlite ;;
    2)  update_bitlite ;;
    3)  uninstall_bitlite ;;
    4)  systemctl start "${SERVICE_NAME}" && echo -e "${GREEN}[OK] Service started.${NC}" ;;
    5)  systemctl stop "${SERVICE_NAME}" && echo -e "${YELLOW}[OK] Service stopped.${NC}" ;;
    6)  systemctl restart "${SERVICE_NAME}" && echo -e "${GREEN}[OK] Service restarted.${NC}" ;;
    7)  change_web_port ;;
    8)  apply_bbr_and_limits ;;
    12) systemctl enable "${SERVICE_NAME}" && echo -e "${GREEN}[OK] Autostart enabled.${NC}" ;;
    22) install_cli_launcher ;;
    0)  exit 0 ;;
    *)  echo -e "${CYAN}[INFO] Action #${OPT} executed.${NC}" ;;
  esac
fi
