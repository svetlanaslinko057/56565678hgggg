# FOMO Arena - PRD

## Обзор проекта
FOMO Arena — платформа предсказательных рынков (prediction markets) с NFT-позициями на BSC Testnet.

## Архитектура
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

## Технологии
- **Frontend**: Next.js 14, TypeScript, TailwindCSS, RainbowKit, wagmi, ethers.js
- **Backend Proxy**: FastAPI (Python) - порт 8001
- **Backend API**: NestJS, TypeScript, Mongoose - порт 4001
- **Database**: MongoDB
- **Blockchain**: BSC Testnet (Chain ID: 97)
- **Indexer**: Node.js + ethers.js

## Smart Contract
| Parameter | Value |
|-----------|-------|
| Network | BSC Testnet (Chain ID: 97) |
| Contract | `0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e` |
| Stablecoin | `0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948` |
| Min Bet | 10 USDT |
| Platform Fee | 2% |

## Реализованные функции
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

## Статус развертывания - 29 марта 2026
- ✅ Репозиторий клонирован
- ✅ Backend NestJS запущен через FastAPI proxy
- ✅ Frontend Next.js 14 работает
- ✅ MongoDB подключена
- ✅ .env файлы настроены
- ✅ Смарт-контракт подключен (BSC Testnet)

## Следующие шаги
- Доработки по интеграции смарт-контракта (по запросу пользователя)
- Запуск arena-indexer для синхронизации событий блокчейна

## API Endpoints
- `GET /api/health` - Service health
- `GET /api/onchain/config` - Contract configuration
- `GET /api/onchain/markets` - List all markets
- `GET /api/onchain/indexer/status` - Indexer sync status
- `GET /api/onchain/profile/:wallet` - User profile stats
- `GET /api/xp/stats/:wallet` - XP and badges
