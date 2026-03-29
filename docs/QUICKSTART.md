# FOMO Arena - Quick Start Guide

## 🚀 Cold Start (One Command)

```bash
chmod +x /app/scripts/bootstrap.sh && /app/scripts/bootstrap.sh
```

This script will:
1. Check prerequisites (Node.js, npm, yarn, Python)
2. Create environment files (.env)
3. Install all dependencies
4. Configure supervisor
5. Start all services
6. Verify deployment

---

## 📋 Manual Setup

### Prerequisites
- Node.js 18+
- npm / yarn
- Python 3.11+
- MongoDB 6+
- Supervisor (optional)

### Step 1: Environment Files

**Backend** (`/app/backend/.env`):
```env
PORT=4001
MONGO_URL=mongodb://localhost:27017/fomo_arena
DB_NAME=fomo_arena
JWT_SECRET=your-secret-key
ARENA_ONCHAIN_ENABLED=true
CHAIN_RPC=https://bsc-testnet.publicnode.com
CHAIN_ID=97
PREDICTION_CONTRACT=0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e
ARENA_CORE_ADDRESS=0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e
ARENA_COLLATERAL_ADDRESS=0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948
```

**Frontend** (`/app/frontend/.env`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8001
NEXT_PUBLIC_CHAIN_ID=97
NEXT_PUBLIC_ONCHAIN_ENABLED=true
NEXT_PUBLIC_CONTRACT_ADDRESS=0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e
NEXT_PUBLIC_STABLE_TOKEN=0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948
```

**Indexer** (`/app/arena-indexer/.env`):
```env
RPC_URL=https://bsc-testnet.publicnode.com
CONTRACT_ADDRESS=0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e
STABLE_TOKEN=0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948
MONGO_URI=mongodb://localhost:27017/fomo_arena
CHAIN_ID=97
CONFIRMATIONS=3
START_BLOCK=97400000
BACKEND_URL=http://localhost:4001
```

### Step 2: Install Dependencies

```bash
# Backend
cd /app/backend && npm install

# Frontend
cd /app/frontend && yarn install

# Indexer
cd /app/arena-indexer && npm install

# Python proxy
pip install httpx fastapi uvicorn
```

### Step 3: Start Services

**With Supervisor (recommended):**
```bash
sudo supervisorctl restart backend frontend indexer
```

**Manual start:**
```bash
# Terminal 1 - Backend
cd /app/backend && npm run start:dev

# Terminal 2 - Frontend
cd /app/frontend && yarn dev

# Terminal 3 - Indexer
cd /app/arena-indexer && npx ts-node src/main.ts
```

### Step 4: Verify

```bash
# Health check
curl http://localhost:8001/api/health

# Indexer status
curl http://localhost:8001/api/onchain/indexer/status

# Contract config
curl http://localhost:8001/api/onchain/config
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FOMO Arena                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Frontend │───▶│  Proxy   │───▶│ Backend  │              │
│  │ Next.js  │    │ FastAPI  │    │ NestJS   │              │
│  │ :3000    │    │ :8001    │    │ :4001    │              │
│  └──────────┘    └──────────┘    └────┬─────┘              │
│                                       │                      │
│                                       ▼                      │
│                                 ┌──────────┐                │
│                                 │ MongoDB  │                │
│                                 │          │                │
│                                 └────┬─────┘                │
│                                      │                      │
│  ┌──────────┐                       │                      │
│  │ Indexer  │───────────────────────┘                      │
│  │ Node.js  │                                               │
│  └────┬─────┘                                               │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────┐                                               │
│  │ BSC      │                                               │
│  │ Testnet  │                                               │
│  └──────────┘                                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 API Endpoints

### Health & Status
- `GET /api/health` - Service health
- `GET /api/onchain/indexer/status` - Indexer sync status
- `GET /api/onchain/config` - Contract configuration

### Markets
- `GET /api/onchain/markets` - List all markets
- `GET /api/onchain/markets/:id` - Market details
- `GET /api/onchain/stats` - Global statistics

### Positions
- `GET /api/onchain/positions` - List positions
- `GET /api/onchain/positions/tokens/:owner` - User's token IDs

### Profile & XP
- `GET /api/onchain/profile/:wallet` - User profile stats
- `GET /api/xp/stats/:wallet` - XP and badges
- `GET /api/xp/leaderboard` - XP leaderboard
- `GET /api/xp/badges` - Available badges

### Notifications
- `GET /api/notifications` - User notifications
- `POST /api/onchain/webhook/event` - Indexer webhook

---

## 🔧 Troubleshooting

### Backend not starting
```bash
tail -f /var/log/supervisor/backend.err.log
```

### Frontend build errors
```bash
cd /app/frontend && yarn build
```

### Indexer not syncing
```bash
# Check logs
tail -f /var/log/supervisor/indexer.out.log

# Update START_BLOCK to current
curl -s -X POST https://bsc-testnet.publicnode.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### MongoDB connection issues
```bash
# Check MongoDB status
mongosh --eval "db.adminCommand('ping')"
```

---

## 📝 Contract Info

| Parameter | Value |
|-----------|-------|
| Network | BSC Testnet |
| Chain ID | 97 |
| Contract | `0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e` |
| Stablecoin | `0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948` |
| Min Bet | 10 USDT |
| Platform Fee | 2% |

---

## 🎯 Quick Commands

```bash
# Restart all services
sudo supervisorctl restart all

# View all logs
tail -f /var/log/supervisor/*.log

# Check service status
sudo supervisorctl status

# Test API
curl http://localhost:8001/api/health

# Run bootstrap
/app/scripts/bootstrap.sh
```
