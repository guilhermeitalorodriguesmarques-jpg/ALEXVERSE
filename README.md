# ALEXVERSE Life - Digital Life Simulation with AI

> 🌍 **Immersive cyberpunk city simulation with AI-driven NPCs, social narratives, and God-mode controls.**

An enterprise-grade simulation platform where NPCs live, work, love, fight, and gossip. Real-time narrative generation and player god-mode controls create an engaging, dynamic digital world.

## 🎯 Features

### Core Simulation
- **Advanced NPC AI**: Personality-driven behavior, routines, relationships, and emotions
- **Dynamic Events**: Generate emergent life events (falling in love, conflicts, career changes)
- **Social Narratives**: AI-generated gossips, day summaries, and event descriptions
- **City Economy**: Simple economic system with jobs, income, and finances

### User Interface
- **Cyberpunk Dashboard**: Real-time city metrics, mood tracking, event monitoring
- **NPC Manager**: Detailed character profiles with relationship graphs
- **City Map**: Neighborhood statistics and visualization
- **God Mode**: Admin controls for climate, drama levels, event triggering

### Integration
- **Discord Bot**: Query city state, gossips, and NPC info from Discord
- **REST API**: Complete API for external integration
- **Real-time Updates**: WebSocket-ready architecture
- **Scalable Backend**: Microservices architecture on Docker

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              ALEXVERSE Life System                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐        ┌──────────────┐                 │
│  │ Web Panel    │◄──┐    │ Discord Bot  │                 │
│  │ (Next.js)    │   │ HTTP/REST │                 │
│  └──────────────┘   │    └──────────────┘                 │
│         ↑           │           ↑                          │
│         │      ┌────▼────────────┘                        │
│         │      │                                          │
│         └──────┼────────────────┬─────────────────────┐  │
│                │                │                     │  │
│          ┌─────▼─────┐   ┌──────▼──────┐    ┌────────▼──┐│
│          │ Nginx +   │   │ Core API    │    │ Scheduler  ││
│          │ Reverse   │   │ (FastAPI)   │    │            ││
│          │ Proxy     │   └──────┬──────┘    └────────────┘│
│          └───────────┘          │                          │
│                                 │                          │
│                 ┌───────────────┼────────┬───────┐        │
│                 │               │        │       │        │
│           ┌─────▼──────┐  ┌────▼──┐ ┌──▼────┐ │        │
│           │ Life       │  │  AI   │ │ Job   │ │        │
│           │ Simulation │  │Orch   │ │Runner │ │        │
│           │ Engine     │  │       │ │       │ │        │
│           └─────┬──────┘  └────┬──┘ └──┬────┘ │        │
│                 │              │       │      │        │
│                 └──────────────┼───────┼──────┘        │
│                                │       │                │
│                          ┌─────▼──────▼────┐            │
│                          │   PostgreSQL    │            │
│                          │    Database     │            │
│                          └─────────────────┘            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Services

| Service | Port | Language | Purpose |
|---------|------|----------|---------|
| Core API | 8000 | Python (FastAPI) | Central API gateway |
| AI Orchestrator | 8001 | Python (FastAPI) | Narrative & dialogue generation |
| Life Engine | 8002 | Python (FastAPI) | Simulation core |
| Scheduler | 8003 | Python | Background jobs |
| Web Panel | 3000 | TypeScript (Next.js) | Admin UI |
| Discord Bot | N/A | Node.js | Discord integration |
| PostgreSQL | 5432 | - | Data persistence |
| Nginx | 80, 443 | - | Reverse proxy & TLS |

## 📋 Prerequisites

### Local Development
- Docker & Docker Compose (>= 20.10)
- Node.js >= 18
- Python >= 3.11
- Git

### Oracle Cloud Deployment
- VM: ARM Ampere A1 (Always Free)
- CPU: 4 OCPU
- RAM: 24 GB
- Storage: 100-150 GB Block Volume
- OS: Ubuntu 22.04 LTS (ARM 64-bit)

## 🚀 Quick Start

### Local Development

```bash
# Clone repository
git clone <repo>
cd ALEXVERSE

# Copy environment configuration
cp .env.example .env

# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Access
- Web Panel: http://localhost:3000
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
```

### Using Management Script

```bash
# Make script executable
chmod +x manage.sh

# Start services
./manage.sh start

# View status
./manage.sh status

# View logs
./manage.sh logs

# Test API
./manage.sh test-api

# Backup database
./manage.sh backup
```

## 🌐 Oracle Cloud Deployment

### 1. Prepare VM

```bash
# SSH into your Oracle Cloud VM
ssh ubuntu@<your-instance-ip>

# Switch to root
sudo -i

# Download and run deployment script
git clone <repo> /opt/alexverse
cd /opt/alexverse
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 2. Configure

```bash
# Edit environment
nano /opt/alexverse/.env

# Update critical values:
# - DB_PASSWORD: Random strong password
# - JWT_SECRET: Random secret key
# - DISCORD_BOT_TOKEN: Your Discord bot token
# - ADMIN_USER_ID: Your Discord user ID
```

### 3. Start Services

```bash
# Use systemd
systemctl start alexverse
systemctl status alexverse

# Or manually
cd /opt/alexverse
docker-compose up -d
```

### 4. SSL Setup (Let's Encrypt)

```bash
# Install certbot
apt-get install certbot python3-certbot-nginx -y

# Request certificate
certbot certonly --standalone -d alexverse.yourdomain.com

# Copy certificates
cp /etc/letsencrypt/live/alexverse.yourdomain.com/fullchain.pem /opt/alexverse/infrastructure/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/alexverse.yourdomain.com/privkey.pem /opt/alexverse/infrastructure/nginx/ssl/key.pem

# Restart nginx
docker-compose restart nginx
```

## 📖 API Documentation

### Authentication

```bash
# Get token
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user_id": "admin", "password": "admin"}'

# Response
{
  "token": "eyJhbGc...",
  "role": "admin"
}

# Use token
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/v1/city/state
```

### Key Endpoints

```
City Management
  GET    /api/v1/city/state              - Get city status
  GET    /api/v1/city/neighborhoods      - List neighborhoods
  GET    /api/v1/city/weather            - Get weather

NPC Management
  GET    /api/v1/npcs                    - List all NPCs
  GET    /api/v1/npc/{id}                - Get NPC details
  GET    /api/v1/npc/{id}/relationships  - Get relationships
  POST   /api/v1/npc/{id}/message        - Send message to NPC

Events & Narrative
  GET    /api/v1/life/events             - Recent events
  GET    /api/v1/gossips                 - Latest gossips
  GET    /api/v1/day-summaries           - Day summaries

God Mode (Admin)
  POST   /api/v1/god/weather/set         - Change weather
  POST   /api/v1/god/drama/set           - Set drama level
  POST   /api/v1/god/npc/create          - Create NPC
  POST   /api/v1/god/city/party          - Trigger party
```

## 🎮 Discord Commands

```
!ciudad              - City overview
!chisme              - Random gossip
!npc <name>          - NPC information
!dia                 - Day summary
!ayuda               - Help
!mododios drama      - Increase drama (admin)
!mododios fiesta     - Trigger party (admin)
!mododios lluvia     - Change weather (admin)
```

## 🔐 Security

- **JWT Authentication**: All API endpoints require tokens
- **Role-Based Access**: admin, observer, bot roles
- **HTTPS/TLS**: All traffic encrypted
- **Database Isolation**: DB only accessible internally
- **Non-root Containers**: All services run as unprivileged users
- **Rate Limiting**: API rate limits on all endpoints
- **Security Headers**: HSTS, X-Frame-Options, CSP configured

## 📊 Database Schema

**Core Entities:**
- `city_states` - City state and metadata
- `npcs` - Character definitions
- `npc_relationships` - Relationship network
- `npc_routines` - Daily schedules
- `npc_memories` - Event memory system
- `life_events` - Simulation events
- `neighborhoods` - City districts
- `places` - Locations (bars, homes, offices, etc.)
- `weather_states` - Climate data
- `gossips` - Social narratives
- `day_summaries` - Narrative summaries
- `npc_finances` - Economic data

## 🧪 Testing

```bash
# Test API health
curl http://localhost:8000/health

# Test simulation tick
curl -X POST http://localhost:8002/life/tick

# Check database
docker-compose exec postgres psql -U alexverse -d alexverse -c "SELECT COUNT(*) FROM npcs;"

# Test Discord connection
# Check logs: docker-compose logs discord-bot
```

## 📈 Monitoring

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f core-api

# System resources
docker stats

# Database queries
docker-compose exec postgres psql -U alexverse

postgres=# SELECT table_name FROM information_schema.tables;
```

## 🐛 Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose logs

# Check ports
lsof -i -P -n

# Cleanup and restart
docker-compose down -v
docker-compose up -d
```

### Database connection errors

```bash
# Test DB connection
docker-compose exec postgres pg_isready

# Check DB exists
docker-compose exec postgres psql -U alexverse -l
```

### API not responding

```bash
# Check service status
docker-compose ps

# Restart service
docker-compose restart core-api

# Check network
docker network ls
docker network inspect alexverse_backend-net
```

## 📝 Development

### Project Structure

```
ALEXVERSE/
├── backend/
│   ├── core-api/              # Main API
│   ├── life-simulation-engine/ # Sim engine
│   ├── ai-orchestrator/       # AI service
│   ├── scheduler/             # Job runner
│   └── discord-bot/           # Discord integration
├── frontend/
│   └── web-panel/             # Next.js UI
├── infrastructure/
│   ├── nginx/                 # Reverse proxy
│   └── postgres/              # DB configuration
├── docker-compose.yml         # Orchestration
├── manage.sh                  # Management script
└── scripts/
    └── deploy.sh              # Deployment script
```

### Adding New NPCs

```python
# Via API
POST /api/v1/god/npc/create
{
  "name": "Alice",
  "age": 28,
  "gender": "female",
  "occupation": "Engineer"
}
```

### Extending Simulation

Edit `backend/life-simulation-engine/main.py`:
- Add new event types in `_generate_conflict_event()`
- Implement new mood changes in `update_npc_mood()`
- Add personality-based behaviors in `process_npc_routines()`

## 📚 Documentation

- [API Reference](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Architecture](docs/ARCHITECTURE.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📜 License

MIT License - See LICENSE file

## 🙋 Support

- Issues: GitHub Issues
- Discussions: GitHub Discussions
- Email: support@alexverse.local

---

**ALEXVERSE Life** - Where digital lives matter. 🌍✨
