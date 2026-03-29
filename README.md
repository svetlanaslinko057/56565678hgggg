# FOMO Arena

Prediction Market Platform на BSC Testnet

## 🚀 Quick Start

```bash
# One command cold start
chmod +x /app/scripts/bootstrap.sh && /app/scripts/bootstrap.sh
```

## 📋 Documentation

- [Quick Start Guide](docs/QUICKSTART.md) - Полное руководство по запуску
- [Cold Start Guide](docs/COLDSTART.md) - Краткая инструкция
- [Execution Plan](docs/EXECUTION_PLAN.md) - План разработки
- [System Audit](docs/FULL_SYSTEM_AUDIT.md) - Аудит системы

## 🏗️ Architecture

```
Frontend (Next.js 14)  →  Proxy (FastAPI)  →  Backend (NestJS)
     :3000                   :8001               :4001
                                                   ↓
                                               MongoDB
                                                   ↑
Indexer (Node.js)  ←───────────────────────────────┘
     ↓
BSC Testnet (Smart Contract)
```

## 📦 Project Structure

```
/app
├── frontend/          # Next.js 14 frontend
├── backend/           # NestJS backend
├── arena-indexer/     # Blockchain event indexer
├── scripts/           # Utility scripts
│   └── bootstrap.sh   # Cold start script
├── docs/              # Documentation
└── memory/            # PRD and notes
```

## 🔧 Services

| Service | Port | Tech |
|---------|------|------|
| Frontend | 3000 | Next.js 14, TypeScript, TailwindCSS |
| Proxy | 8001 | FastAPI (Python) |
| Backend | 4001 | NestJS, TypeScript, Mongoose |
| Indexer | - | Node.js, ethers.js |
| Database | 27017 | MongoDB |

## 🔗 Smart Contract

| Parameter | Value |
|-----------|-------|
| Network | BSC Testnet (Chain ID: 97) |
| Contract | `0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e` |
| Stablecoin | `0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948` |
| Min Bet | 10 USDT |
| Platform Fee | 2% |

## 📊 Features

### Core
- ✅ Prediction markets (create, bet, resolve, claim)
- ✅ On-chain execution via smart contract
- ✅ Real-time indexer sync
- ✅ Mirror mode (indexer → backend → UI)

### Retention
- ✅ Notifications (toast + bell)
- ✅ Profile stats (winrate, PnL, streak)
- ✅ XP system (10 badge types)
- ✅ Level progression

### Admin
- ✅ Market management
- ✅ Resolve UI
- ✅ User stats

## 🧪 API Endpoints

```bash
# Health
curl /api/health

# Markets
curl /api/onchain/markets
curl /api/onchain/markets/:id

# Profile
curl /api/onchain/profile/:wallet
curl /api/xp/stats/:wallet

# Config
curl /api/onchain/config
curl /api/onchain/indexer/status
```

## 🛠️ Commands

```bash
# Restart all services
sudo supervisorctl restart all

# View logs
tail -f /var/log/supervisor/*.log

# Check status
sudo supervisorctl status

# Run bootstrap
/app/scripts/bootstrap.sh
```

## 📝 Environment Variables

See [QUICKSTART.md](docs/QUICKSTART.md#step-1-environment-files) for full list.

## License

MIT
