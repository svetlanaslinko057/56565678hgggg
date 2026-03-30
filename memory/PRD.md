# FOMO Arena - Product Requirements Document

## Original Problem Statement
Deploy and enhance FOMO Arena prediction market platform from GitHub repository. Implement PHASE 6 - REAL-TIME ADDICTION ENGINE.

## Architecture
- **Frontend**: Next.js 14 (port 3000)
- **Backend**: NestJS TypeScript (port 4001)
- **Proxy**: FastAPI Python (port 8001)
- **Indexer**: Node.js blockchain indexer
- **Database**: MongoDB

## Core Requirements (Static)
1. Prediction market on BSC Testnet
2. Telegram Mini App integration
3. Real-time WebSocket updates
4. Onchain betting with smart contracts
5. XP/Leagues gamification system
6. Duels PvP system

## User Personas
1. **Crypto Traders** - Bet on market movements
2. **Gamers** - Compete in duels and leagues
3. **Social Users** - Share wins, build rivalries

## What's Been Implemented

### 2026-03-30 - PHASE 6: REAL-TIME ADDICTION ENGINE

#### ✅ Push Notifications System
- `/app/backend/src/modules/push-notifications/`
  - `push-notifications.schema.ts` - UserSubscriptions, PushNotificationLog schemas
  - `push-notifications.service.ts` - Auto triggers, rate limiting, deep links
  - `push-notifications.controller.ts` - API endpoints
  - `push-notifications.module.ts` - Module registration

#### ✅ Live Activity Gateway
- `/app/backend/src/modules/live-activity/`
  - `live-activity.gateway.ts` - WebSocket gateway for real-time feed
  - `live-activity.controller.ts` - REST API for stats
  - `live-activity.module.ts` - Module registration

#### ✅ Frontend Components
- `LiveActivityTicker.tsx` - Scrolling real-time activity bar with fallback data
- `NotificationSettingsPanel.tsx` - User notification preferences UI

#### ✅ Integration Points
- Added PushNotificationsModule & LiveActivityModule to app.module.ts
- Integrated LiveActivityTicker into ArenaFeed.tsx
- Added NotificationSettingsPanel to NotificationsPanel.tsx

### Push Notification Types Implemented
1. **Edge Alert** - When edge jumps above threshold
2. **Whale Bet** - Big bets on watched markets
3. **Closing Soon** - Markets about to close
4. **Win** - User won a bet
5. **Rival Challenge** - Duel challenge received
6. **Rival Beat** - Beat a rival in duel
7. **Weekly Pressure** - League competition updates
8. **Activity Spike** - High activity on market

### Auto Triggers
- Edge > threshold (default 10%)
- Whale bet > threshold (default $100)
- Market closing < 2h
- Activity spike > 10 bets/5min

### Rate Limiting
- Max 3-5 notifications per day (configurable)
- Daily counter reset at midnight
- Per-user settings

### Deep Links
- `t.me/bot?startapp=market_123` - Direct to market
- `t.me/bot?startapp=duel_123` - Direct to duel
- `t.me/bot?tab=leagues` - Direct to leaderboard

## API Endpoints Added
- `GET /api/push/subscriptions/:wallet`
- `POST /api/push/subscriptions/:wallet/watch-market`
- `DELETE /api/push/subscriptions/:wallet/watch-market/:marketId`
- `POST /api/push/subscriptions/:wallet/watch-rival`
- `PUT /api/push/subscriptions/:wallet/settings`
- `POST /api/push/subscriptions/:wallet/link-telegram`
- `GET /api/push/stats/:wallet`
- `POST /api/push/track-click/:notificationId`
- `GET /api/live/stats`

## Next Action Items
1. Configure Telegram Bot Token in .env
2. Add more FOMO triggers in FOMO Engine
3. Implement notification analytics dashboard
4. Add A/B testing for notification copy
5. Scale to 1k-10k users

## Future/Backlog
- P0: Production deployment on mainnet
- P1: Influencer integration
- P1: Referral wars system
- P2: TG channel partnerships
- P2: Whale accounts tracking
