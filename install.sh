#!/usr/bin/env bash
# BitLite System — Linux x86_64 Installation & Service Management Script
# Supported OS: Ubuntu 20.04 / 22.04 / 24.04+, Debian 11 / 12+, CentOS 8+

set -e

VERSION="1.0.0"
APP_NAME="BitLite System"
APP_ID="bitlitesystem"
INSTALL_DIR="/root/bitlitesystem"
SERVICE_NAME="bitliteservice"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
CLI_BIN="/usr/local/bin/bitlite"
DEFAULT_WEB_PORT="63521"

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

apply_bbr_and_limits() {
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
  cat << 'EOF' > "${CLI_BIN}"
#!/usr/bin/env bash
SERVICE="bitliteservice.service"
case "$1" in
  start)   systemctl start "$SERVICE" && echo "[OK] BitLite service started." ;;
  stop)    systemctl stop "$SERVICE" && echo "[OK] BitLite service stopped." ;;
  restart) systemctl restart "$SERVICE" && echo "[OK] BitLite service restarted." ;;
  status)  systemctl status "$SERVICE" --no-pager ;;
  logs)    journalctl -u "$SERVICE" -f -n 100 ;;
  *)
    echo "Usage: bitlite {start|stop|restart|status|logs}"
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
    --bbr) apply_bbr_and_limits ; exit 0 ;;
    --cli) install_cli_launcher ; exit 0 ;;
  esac
fi

show_menu
