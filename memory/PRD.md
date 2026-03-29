# FOMO Arena - Product Requirements Document

## Overview
FOMO Arena - Prediction Market Platform на BSC Testnet. Платформа для создания и участия в рынках предсказаний с реальной интеграцией блокчейна.

## Original Problem Statement
Развернуть репозиторий https://github.com/svetlanaslinko057/454545454 с сохранением архитектуры Next.js (не React CRA). Настроить wallet интеграцию с приоритетом WalletConnect для Telegram Mini App.

## Architecture

```
Frontend (Next.js 14)  →  Proxy (FastAPI)  →  Backend (NestJS)
     :3000                   :8001               :4001
                                                   ↓
                                               MongoDB
                                                   ↑
Indexer (Node.js)  ←───────────────────────────────┘
     ↓
BSC Testnet (Smart Contract: 0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e)
```

## Tech Stack
- **Frontend**: Next.js 14, TypeScript, TailwindCSS, RainbowKit, wagmi
- **Backend**: NestJS + FastAPI proxy, TypeScript, MongoDB
- **Blockchain**: BSC Testnet (Chain ID: 97)
- **Wallet**: RainbowKit with WalletConnect priority
- **Indexer**: Node.js, ethers.js, MongoDB mirror collections

## User Personas
1. **Trader/Predictor** - Creates predictions and places bets
2. **Spectator** - Views markets and follows predictions
3. **Admin** - Manages markets and resolves outcomes

## What's Been Implemented

### Date: 2026-03-29 - Initial Deployment (PHASE 1)
- [x] Repository cloned and deployed from GitHub
- [x] Next.js 14 frontend running (port 3000)
- [x] FastAPI proxy running (port 8001)
- [x] NestJS backend running (port 4001)
- [x] MongoDB connected
- [x] RainbowKit wallet integration with WalletConnect FIRST
- [x] Telegram Mini App version (/tg routes)

### Date: 2026-03-29 - REAL BET FLOW (PHASE 2)
- [x] BetSheet with contract integration
- [x] TX State Machine: idle → approving → approved → betting → indexing → success
- [x] Allowance check & Approve USDT flow
- [x] placeBet() via smart contract
- [x] Success state with txHash and BSCScan link
- [x] Error handling with user-friendly messages
- [x] Telegram haptic feedback

### Date: 2026-03-29 - INDEXER SYNC (PHASE 3)
- [x] Indexer running and syncing BSC Testnet blocks
- [x] Event handlers: BetPlaced, MarketCreated, MarketResolved, PositionClaimed
- [x] MongoDB mirror collections: markets_mirror, positions_mirror, activities
- [x] Backend APIs: /api/onchain/markets, /api/onchain/positions, /api/onchain/profile
- [x] FOMO Engine: Market pressure, sentiment, whale tracking
- [x] ArenaFeed fetches from on-chain API with mock fallback
- [x] transformMarket parses on-chain data format
- [x] BetSheet 3-step flow: Approve → Place Bet → Sync
- [x] useIndexerPolling hook for tx status tracking
- [x] XP & Notifications on indexer events

## Contract Info
| Parameter | Value |
|-----------|-------|
| Network | BSC Testnet |
| Chain ID | 97 |
| Contract | 0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e |
| Stablecoin | 0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948 |
| Min Bet | 10 USDT |
| Platform Fee | 2% |

## Test Results (2026-03-29)
### PHASE 3 - Final
- Backend: **100%** - All indexer APIs working
- Frontend: **95%**
- Indexer Integration: **100%**
- BetSheet 3-step flow: **90%**

## Prioritized Backlog

### P0 - Critical (Complete ✅)
- [x] Wallet в TG (WalletConnect FIRST)
- [x] Real contract calls (approve + bet)
- [x] Indexer sync (tx → DB → UI)
- [x] UI от on-chain данных

### P1 - Next Phase
1. **Create test markets** on-chain for full flow testing
2. **Claim flow** - Withdraw winnings
3. **WalletConnect Allowlist** - Add domain to cloud.reown.com
4. **Market creation** via UI

### P2 - Future
1. XP system UI integration
2. Leaderboard from on-chain data
3. Achievement badges
4. Social sharing

## API Endpoints
| Endpoint | Description |
|----------|-------------|
| GET /api/onchain/markets | Get on-chain markets |
| GET /api/onchain/positions?owner=0x... | Get user positions |
| GET /api/onchain/profile/:wallet | Get user on-chain stats |
| GET /api/onchain/indexer/status | Indexer sync status |
| GET /api/onchain/config | Contract config |
| GET /api/onchain/markets/:id/pressure | FOMO engine data |
| POST /api/onchain/webhook/event | Indexer events webhook |

## Services Status
| Service | Port | Status |
|---------|------|--------|
| Frontend | 3000 | RUNNING |
| Proxy | 8001 | RUNNING |
| Backend | 4001 | RUNNING |
| Indexer | - | RUNNING |
| MongoDB | 27017 | RUNNING |

## Full Stack Flow
```
User clicks "Place Bet"
    ↓
BetSheet opens (check wallet connection)
    ↓
Check allowance → Approve USDT if needed
    ↓
Sign placeBet() transaction
    ↓
TX confirmed on-chain
    ↓
Show "Syncing..." (indexing state)
    ↓
Indexer catches BetPlaced event
    ↓
Write to positions_mirror collection
    ↓
Backend API serves position
    ↓
UI refreshes with new position
    ↓
XP awarded, notification sent
```
