# FOMO Arena - Product Requirements Document

## Project Overview
FOMO Arena - Prediction Market platform on BSC Testnet with Telegram Mini App interface.

## Original Problem Statement
Deploy FOMO Arena repository from GitHub with implementation of:
- PHASE 3.5: CLAIM FLOW (withdrawal of winnings)
- PHASE 4: ECONOMY SYNC (XP/Leaderboard based on blockchain events)

## Architecture
- **Frontend**: Next.js 14 (port 3000)
- **Backend**: NestJS proxied through FastAPI (port 8001 -> 4001)
- **Indexer**: Node.js blockchain event listener
- **Database**: MongoDB
- **Blockchain**: BSC Testnet

### Contract Address
- Prediction Market: `0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e`
- Collateral Token: `0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948`

## Core Requirements
1. **Wallet Integration** ✅ - Connect wallet functionality
2. **Place Bets** ✅ - Users can place bets on prediction markets
3. **Indexer Sync** ✅ - Blockchain events synced to database
4. **UI Sync** ✅ - Real-time UI updates

## What's Been Implemented (March 2026)

### PHASE 3.5 - CLAIM FLOW ✅
- **ClaimSheet.tsx** - Full claim UI with transaction states:
  - idle → signing → pending → confirmed → indexing → indexed
  - Success banner with amount claimed
  - View TX button linking to BSCScan
  - Error handling with retry option
- **MyPositions.tsx** - User positions list:
  - Shows all user positions with status badges (WON, LOST, CLAIMED, ACTIVE)
  - Claim button for winning positions
  - Balance preview after claim
- **Profile Page Integration** - MyPositions added to /tg/profile

### PHASE 4 - ECONOMY SYNC ✅
- **EconomyService** - Event-driven XP system:
  - BetPlaced → +10 XP
  - Win → +50 XP + streak bonus
  - Loss → +5 XP (consolation)
  - Claim → +20 XP
  - Streak bonuses: 3-streak +100, 5-streak +200, 10-streak +500
- **OnchainController** - API endpoints for economy data:
  - GET /api/onchain/positions - User positions
  - GET /api/onchain/leaderboard - Real leaderboard from positions_mirror
  - GET /api/onchain/stats/:wallet - User economy stats
- **Indexer Webhooks** - Position events trigger XP awards:
  - bet_placed, position_won, position_lost, position_claimed events
- **Notification Integration** - Notifications for all economy events

## User Personas
1. **Retail Bettors** - Casual users placing bets on crypto predictions
2. **Whales** - High-volume traders competing for leaderboard positions
3. **XP Hunters** - Users focused on badges and level progression

## Prioritized Backlog

### P0 (Completed)
- [x] Claim flow UI
- [x] MyPositions component
- [x] Economy service
- [x] XP system integration

### P1 (Next)
- [ ] Real-time position status updates via WebSocket
- [ ] Enhanced claim preview with gas estimation
- [ ] PnL chart on profile page
- [ ] Streak visualization

### P2 (Future)
- [ ] Share win on social media
- [ ] Achievement system expansion
- [ ] Referral program
- [ ] Retention mechanics (loss recovery, revenge loop)

## Next Tasks
1. Implement WebSocket for real-time position updates
2. Add streak pressure UI (current streak display on Arena)
3. Enhance leaderboard with real PnL data
4. Add claim history to profile
