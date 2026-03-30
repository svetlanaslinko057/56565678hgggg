# FOMO Arena - Product Requirements Document

## Project Overview
FOMO Arena - Prediction Market platform on BSC Testnet with Telegram Mini App interface.

## Original Problem Statement
Deploy FOMO Arena repository from GitHub with implementation of:
- PHASE 3.5: CLAIM FLOW (withdrawal of winnings)
- PHASE 4: ECONOMY SYNC (XP/Leaderboard based on blockchain events)
- PHASE 5: VIRAL LOOP (Share Win for organic growth)

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
  - Share → +5 XP
  - Streak bonuses: 3-streak +100, 5-streak +200, 10-streak +500
- **OnchainController** - API endpoints for economy data:
  - GET /api/onchain/positions - User positions
  - GET /api/onchain/leaderboard - Real leaderboard from positions_mirror
  - GET /api/onchain/stats/:wallet - User economy stats
- **Indexer Webhooks** - Position events trigger XP awards
- **Notification Integration** - Notifications for all economy events

### PHASE 5 - VIRAL LOOP (Share Win) ✅
- **ShareWinModal.tsx** - Beautiful win card for sharing:
  - Animated confetti celebration
  - Profit amount display (large, green gradient)
  - Market question with outcome badge
  - Stats row: streak, rival beat, edge
  - FOMO Arena branding footer
- **Share Buttons**:
  - Share to Telegram (deep link: t.me/bot?startapp=win_123)
  - Share on X/Twitter
  - Copy Link with formatted text
- **XP Reward**: +5 XP for each share
- **Tracking API**: POST /api/share/win/:tokenId/track
  - Prevents duplicate rewards
  - Records platform (telegram, twitter, copy)

## User Personas
1. **Retail Bettors** - Casual users placing bets on crypto predictions
2. **Whales** - High-volume traders competing for leaderboard positions
3. **XP Hunters** - Users focused on badges and level progression
4. **Viral Sharers** - Users who share wins for social proof

## Prioritized Backlog

### P0 (Completed)
- [x] Claim flow UI
- [x] MyPositions component
- [x] Economy service
- [x] XP system integration
- [x] Share Win viral loop

### P1 (Next)
- [ ] Real-time position status updates via WebSocket
- [ ] Push notifications to Telegram
- [ ] Live bets feed
- [ ] Whale alerts

### P2 (Future)
- [ ] Streak visualization on Arena
- [ ] Loss recovery mechanics
- [ ] Revenge loop (rematch defeated rivals)
- [ ] Referral program with bonuses

## Next Tasks
1. PHASE 6: REAL-TIME ADDICTION
   - Live bets feed
   - Whale alerts
   - Edge jumps
   - Push notifications in Telegram
2. Add win streak counter to profile
3. Enhanced deep link landing page
