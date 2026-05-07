#!/bin/bash

# ALEXVERSE Life - Oracle Cloud Deployment Script
# Install and configure ALEXVERSE on Ubuntu 22.04 LTS ARM64

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     ALEXVERSE Life - Oracle Cloud Deployment              ║"
echo "║     Digital Life Simulation with AI                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}"
   exit 1
fi

# System Update
echo -e "${YELLOW}[1/10] Updating system packages...${NC}"
apt-get update
apt-get upgrade -y
apt-get install -y curl wget git gnupg2 pass ca-certificates

# Install Docker
echo -e "${YELLOW}[2/10] Installing Docker...${NC}"
apt-get install -y docker.io docker-compose
usermod -aG docker $SUDO_USER

# Create alexverse user
echo -e "${YELLOW}[3/10] Creating alexverse user...${NC}"
useradd -m -s /bin/bash alexverse || true

# Create directories
echo -e "${YELLOW}[4/10] Creating directory structure...${NC}"
mkdir -p /opt/alexverse
mkdir -p /var/log/alexverse
mkdir -p /var/lib/postgresql
mkdir -p /etc/alexverse

# Clone/setup repository
echo -e "${YELLOW}[5/10] Preparing ALEXVERSE files...${NC}"
cd /opt/alexverse

# Set permissions
chown -R alexverse:alexverse /opt/alexverse
chown -R alexverse:alexverse /var/log/alexverse
chown -R alexverse:alexverse /var/lib/postgresql

# Copy .env
if [ ! -f /opt/alexverse/.env ]; then
    cp /opt/alexverse/.env.example /opt/alexverse/.env
    echo -e "${YELLOW}[!] Please edit /opt/alexverse/.env with your configuration${NC}"
fi

# Generate SSL certificates (self-signed for now)
echo -e "${YELLOW}[6/10] Generating SSL certificates...${NC}"
mkdir -p /opt/alexverse/infrastructure/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /opt/alexverse/infrastructure/nginx/ssl/key.pem \
    -out /opt/alexverse/infrastructure/nginx/ssl/cert.pem \
    -subj "/CN=alexverse.local" 2>/dev/null || true

chown -R alexverse:alexverse /opt/alexverse/infrastructure/nginx/ssl

# Create systemd service
echo -e "${YELLOW}[7/10] Creating systemd service...${NC}"
cat > /etc/systemd/system/alexverse.service << 'EOF'
[Unit]
Description=ALEXVERSE Life Simulation
After=docker.service
Requires=docker.service

[Service]
Type=simple
User=alexverse
WorkingDirectory=/opt/alexverse
ExecStart=/usr/bin/docker-compose up
ExecStop=/usr/bin/docker-compose down
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload

# Create firewall rules (if UFW is enabled)
echo -e "${YELLOW}[8/10] Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp comment "SSH"
    ufw allow 80/tcp comment "HTTP"
    ufw allow 443/tcp comment "HTTPS"
    echo "y" | ufw enable || true
fi

# Create backup script
echo -e "${YELLOW}[9/10] Creating backup script...${NC}"
cat > /opt/alexverse/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/alexverse/backups"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U alexverse alexverse | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz
echo "Backup completed: $BACKUP_DIR/db_$TIMESTAMP.sql.gz"
EOF

chmod +x /opt/alexverse/backup.sh
chown alexverse:alexverse /opt/alexverse/backup.sh

# Setup log rotation
echo -e "${YELLOW}[10/10] Configuring log rotation...${NC}"
cat > /etc/logrotate.d/alexverse << 'EOF'
/var/log/alexverse/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 alexverse alexverse
    sharedscripts
}
EOF

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Installation Complete!                                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "1. Edit the configuration: nano /opt/alexverse/.env"
echo "2. Start ALEXVERSE: systemctl start alexverse"
echo "3. Check status: systemctl status alexverse"
echo "4. View logs: docker-compose logs -f"
echo ""
echo "Access Points:"
echo "  - Web Panel: https://localhost"
echo "  - API: https://localhost/api/v1"
echo "  - Discord Bot: Check logs for status"
echo ""
