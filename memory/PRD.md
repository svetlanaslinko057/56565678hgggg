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

## User Personas
1. **Trader/Predictor** - Creates predictions and places bets
2. **Spectator** - Views markets and follows predictions
3. **Admin** - Manages markets and resolves outcomes

## Core Requirements (Static)
- Wallet connection via WalletConnect (Telegram compatible)
- BSC Testnet integration (Chain ID: 97)
- Market creation and betting
- On-chain execution via smart contract
- Real-time indexer sync

## What's Been Implemented

### Date: 2026-03-29 - Initial Deployment
- [x] Repository cloned and deployed from GitHub
- [x] Next.js 14 frontend running (port 3000)
- [x] FastAPI proxy running (port 8001)
- [x] NestJS backend running (port 4001)
- [x] MongoDB connected
- [x] Blockchain indexer configured and running
- [x] RainbowKit wallet integration with WalletConnect FIRST
- [x] Telegram Mini App version (/tg routes)
- [x] Profile, Arena, Duels, Leaderboard pages
- [x] Environment files configured

### Date: 2026-03-29 - PHASE 2: REAL BET FLOW
- [x] BetSheet completely rewritten with contract integration
- [x] TX State Machine implemented:
  - idle → checking → approving → approved → betting → success → error
- [x] Allowance check before betting
- [x] Approve USDT flow (ERC20 approve)
- [x] placeBet() via smart contract
- [x] Success state with txHash and BSCScan explorer link
- [x] Error handling with user-friendly messages
- [x] Telegram haptic feedback integration
- [x] WalletConnect FIRST in wallet selector (Telegram priority)
- [x] Amount presets ($10, $25, $50, $100)
- [x] Custom amount input
- [x] Payout preview with odds calculation
- [x] Balance display when wallet connected

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
### PHASE 1 - Deployment
- Backend: 92% passed
- Frontend: 100% passed
- Overall: 96%

### PHASE 2 - Real Bet Flow
- Backend: 70% (no test markets in DB)
- Frontend: 90%
- Wallet Integration: 95%
- BetSheet Implementation: 100%

## Prioritized Backlog

### P0 - Critical (Next Phase)
1. **PHASE 3: INDEXER SYNC** - tx → DB → UI → positions
2. Create test markets for full flow validation
3. Claim rewards flow

### P1 - Important
1. WalletConnect Allowlist - Add domain to cloud.reown.com
2. Market resolution via oracle
3. Transaction history
4. Remove mock data when real markets exist

### P2 - Nice to Have
1. XP system integration
2. Achievement badges
3. Social sharing

## Next Tasks
1. Create test markets in database
2. Verify complete betting flow with real wallet
3. Test indexer syncs BetPlaced events
4. Implement claim flow

## Services Status
| Service | Port | Status |
|---------|------|--------|
| Frontend | 3000 | RUNNING |
| Proxy | 8001 | RUNNING |
| Backend | 4001 | RUNNING |
| Indexer | - | RUNNING |
| MongoDB | 27017 | RUNNING |
