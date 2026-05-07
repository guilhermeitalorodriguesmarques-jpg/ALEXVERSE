#!/bin/bash

# ALEXVERSE Life - Management Script

set -e

COMPOSE_CMD="docker-compose"
ALEXVERSE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ALEXVERSE_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║ ALEXVERSE Life - Management Tool      ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
}

print_menu() {
    echo ""
    echo -e "${YELLOW}Available Commands:${NC}"
    echo "  start       - Start all services"
    echo "  stop        - Stop all services"
    echo "  restart     - Restart all services"
    echo "  status      - Show services status"
    echo "  logs        - View live logs"
    echo "  logs-api    - View Core API logs"
    echo "  logs-eng    - View Life Engine logs"
    echo "  shell-db    - Connect to PostgreSQL shell"
    echo "  backup      - Backup database"
    echo "  clean       - Clean up containers and volumes"
    echo "  build       - Build Docker images"
    echo "  test-api    - Test API connectivity"
    echo ""
}

case "${1}" in
    start)
        echo -e "${GREEN}[+] Starting ALEXVERSE services...${NC}"
        $COMPOSE_CMD up -d
        sleep 5
        echo -e "${GREEN}[✓] Services started${NC}"
        ;;
    
    stop)
        echo -e "${YELLOW}[!] Stopping ALEXVERSE services...${NC}"
        $COMPOSE_CMD down
        echo -e "${GREEN}[✓] Services stopped${NC}"
        ;;
    
    restart)
        echo -e "${YELLOW}[!] Restarting ALEXVERSE services...${NC}"
        $COMPOSE_CMD restart
        sleep 5
        echo -e "${GREEN}[✓] Services restarted${NC}"
        ;;
    
    status)
        echo -e "${BLUE}[*] Service Status:${NC}"
        $COMPOSE_CMD ps
        ;;
    
    logs)
        echo -e "${BLUE}[*] Live logs (Ctrl+C to exit):${NC}"
        $COMPOSE_CMD logs -f
        ;;
    
    logs-api)
        $COMPOSE_CMD logs -f core-api
        ;;
    
    logs-eng)
        $COMPOSE_CMD logs -f life-simulation-engine
        ;;
    
    shell-db)
        echo -e "${BLUE}[*] Connecting to PostgreSQL...${NC}"
        $COMPOSE_CMD exec postgres psql -U alexverse -d alexverse
        ;;
    
    backup)
        BACKUP_DIR="backups"
        mkdir -p "$BACKUP_DIR"
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        echo -e "${YELLOW}[!] Backing up database...${NC}"
        $COMPOSE_CMD exec -T postgres pg_dump -U alexverse alexverse | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"
        echo -e "${GREEN}[✓] Backup created: $BACKUP_DIR/db_$TIMESTAMP.sql.gz${NC}"
        ;;
    
    clean)
        echo -e "${RED}[!] WARNING: This will delete all containers and volumes!${NC}"
        read -p "Continue? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            $COMPOSE_CMD down -v
            echo -e "${GREEN}[✓] Cleaned up${NC}"
        fi
        ;;
    
    build)
        echo -e "${YELLOW}[!] Building Docker images...${NC}"
        $COMPOSE_CMD build
        echo -e "${GREEN}[✓] Build complete${NC}"
        ;;
    
    test-api)
        echo -e "${BLUE}[*] Testing API connectivity...${NC}"
        if curl -s http://localhost:8000/health | grep -q "healthy"; then
            echo -e "${GREEN}[✓] Core API: OK${NC}"
        else
            echo -e "${RED}[✗] Core API: FAILED${NC}"
        fi
        
        if curl -s http://localhost:8001/health | grep -q "healthy"; then
            echo -e "${GREEN}[✓] AI Orchestrator: OK${NC}"
        else
            echo -e "${RED}[✗] AI Orchestrator: FAILED${NC}"
        fi
        
        if curl -s http://localhost:8002/health | grep -q "healthy"; then
            echo -e "${GREEN}[✓] Life Engine: OK${NC}"
        else
            echo -e "${RED}[✗] Life Engine: FAILED${NC}"
        fi
        ;;
    
    *)
        print_header
        print_menu
        ;;
esac
