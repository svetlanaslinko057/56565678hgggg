# FOMO Arena - Frontend ↔ Backend Audit Report

## Дата: 21 марта 2026

---

## РЕЗЮМЕ

| Категория | Статус | Детали |
|-----------|--------|--------|
| **Core APIs** | ✅ 100% | health, predictions, activity, leaderboard, seasons, duels |
| **Market APIs** | ✅ 100% | details, stats, bet-preview, odds-history, live-bets |
| **Auth APIs** | ⚠️ 80% | nonce работает, wallet/me требует auth |
| **Admin APIs** | ⚠️ Требует auth | Правильно защищены |
| **Demo Cleanup** | ✅ 100% | Полностью удалён |

---

## 1. BACKEND API STATUS

### ✅ РАБОТАЮЩИЕ ENDPOINTS (без auth)

| # | Endpoint | Статус | Использование |
|---|----------|--------|---------------|
| 1 | GET /api/health | ✅ OK | Healthcheck |
| 2 | GET /api/predictions | ✅ OK | ArenaTab карточки |
| 3 | GET /api/predictions/:id | ✅ OK | PredictionDetails |
| 4 | GET /api/activity/live | ✅ OK | Live Bets секция |
| 5 | GET /api/analysts/leaderboard | ✅ OK | LeaguesTab |
| 6 | GET /api/leaderboard/profit | ✅ OK | Profit leaderboard |
| 7 | GET /api/seasons/current | ✅ OK | Season info |
| 8 | GET /api/duels | ✅ OK | DuelsTab список |
| 9 | GET /api/duels/open | ✅ OK | Open duels |
| 10 | GET /api/markets/:id/stats | ✅ OK | Market stats |
| 11 | POST /api/markets/:id/bet-preview | ✅ OK | Bet modal preview |
| 12 | GET /api/markets/:id/odds-history | ✅ OK | Price chart |
| 13 | GET /api/markets/:id/live-bets | ✅ OK | Market activity |
| 14 | GET /api/marketplace/listings | ✅ OK | Marketplace page |
| 15 | GET /api/markets/drafts/config | ✅ OK | Create market config |
| 16 | GET /api/markets/drafts/votes/active | ✅ OK | Active votes |
| 17 | GET /api/indexer/status | ✅ OK | Indexer health |
| 18 | GET /api/indexer/mirror/markets | ✅ OK | On-chain mirror |
| 19 | GET /api/auth/nonce | ✅ OK | SIWE nonce |
| 20 | GET /api/growth/streak/:wallet | ✅ OK | User streak |
| 21 | GET /api/growth/analysts/top | ✅ OK | Top analysts |
| 22 | GET /api/reputation/:wallet | ✅ OK | Creator reputation |
| 23 | GET /api/reputation/leaderboard/creators | ✅ OK | Creator leaderboard |
| 24 | GET /api/share/leaderboard/referrers | ✅ OK | Referral leaderboard |
| 25 | GET /api/notifications | ✅ OK | Notifications list |
| 26 | GET /api/notifications/unread-count | ✅ OK | Unread count |

### ⚠️ ТРЕБУЮТ АВТОРИЗАЦИИ (Правильно)

| # | Endpoint | Статус | Причина |
|---|----------|--------|---------|
| 1 | GET /api/wallet/balance | 🔒 Auth | Баланс пользователя |
| 2 | GET /api/wallet/me | 🔒 Auth | Профиль пользователя |
| 3 | GET /api/positions/my | 🔒 Auth | Мои позиции |
| 4 | GET /api/admin/* | 🔒 Auth | Админ панель |
| 5 | POST /api/pricing/preview | 🔒 Partial | Нужен marketId |

---

## 2. FRONTEND PAGES STATUS

### ✅ ПОЛНОСТЬЮ РАБОТАЮТ

| Страница | URL | API Связка |
|----------|-----|------------|
| Arena (Main) | / | ✅ predictions, activity, leaderboard |
| Arena Tab | /arena | ✅ Все карточки с API |
| Duels Tab | /duels | ✅ duels API |
| Leagues Tab | /leagues | ✅ analysts/leaderboard |
| Market Details | /arena/[marketId] | ✅ predictions/:id, stats |
| Analyst Profile | /arena/analyst/[wallet] | ✅ analysts/:wallet |
| Share Page | /s/[shareId] | ✅ share/:shareId |

### ⚠️ ТРЕБУЮТ WALLET AUTH

| Страница | URL | Проблема | Решение |
|----------|-----|----------|---------|
| My Positions | /arena/positions | Нет данных без auth | Connect Wallet → показать данные |
| Create Market | /arena/create | Требует wallet | Connect Wallet → разблокировать |
| My Markets | /arena/my-markets | Требует wallet | Connect Wallet → показать |
| Marketplace | /arena/marketplace | Buy требует wallet | ✅ Просмотр работает |

### ⚠️ ADMIN (Требует роль)

| Страница | URL | Статус |
|----------|-----|--------|
| Admin Dashboard | /admin | 🔒 Требует admin role |

---

## 3. ИСПРАВЛЕННЫЕ ПРОБЛЕМЫ

### Demo Cleanup (✅ Завершён)

**Удалено из Frontend:**
- [x] DemoButton.tsx
- [x] DemoAPI из arena.ts
- [x] demoWallet → currentWallet (7 файлов)
- [x] isDemo → isConnected (NotificationsPanel)

**Удалено из Backend:**
- [x] demo.module.ts, demo.service.ts, demo.controller.ts
- [x] DemoModule из app.module.ts
- [x] DemoService из wallet.module.ts, wallet.controller.ts
- [x] Demo balance checks из positions.service.ts
- [x] Demo payout credits из resolution.service.ts

---

## 4. ОСТАВШИЕСЯ ЗАДАЧИ

### P0 - КРИТИЧЕСКИЕ (Для работы продукта)

| # | Задача | Файлы | Описание |
|---|--------|-------|----------|
| 1 | **Wallet Connect Flow** | ProfileDropdown.tsx, AuthService | Подключить wagmi/web3modal |
| 2 | **SIWE Authentication** | auth.controller.ts, AuthContext | Sign-In With Ethereum → JWT |
| 3 | **Bet Execution** | PredictionCard.tsx, useExecution.ts | placeBet через смарт-контракт |
| 4 | **Transaction States** | useExecution.ts, UI | Approving → Signing → Pending → Confirmed |
| 5 | **Claim Payout** | positions/page.tsx | claim() через контракт |

### P1 - ВАЖНЫЕ

| # | Задача | Описание |
|---|--------|----------|
| 1 | WebSocket Reconnection | Авто-переподключение при disconnect |
| 2 | Error Handling | Единообразные error toasts |
| 3 | Loading States | Skeleton loaders для всех компонентов |
| 4 | Optimistic Updates | UI обновление до подтверждения |

### P2 - УЛУЧШЕНИЯ

| # | Задача | Описание |
|---|--------|----------|
| 1 | Offline Support | Service Worker для кэша |
| 2 | PWA | Installable app |
| 3 | Analytics | Event tracking |

---

## 5. DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CURRENT STATE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐                      ┌────────────────┐           │
│  │   Frontend   │ ──── REST API ────▶  │    Backend     │           │
│  │   (Next.js)  │ ◀─── Response ─────  │   (NestJS)     │           │
│  └──────────────┘                      └───────┬────────┘           │
│         │                                      │                     │
│         │ WebSocket                            │ MongoDB             │
│         │                                      ▼                     │
│         │                              ┌────────────────┐           │
│         └───────────────────────────▶  │    MongoDB     │           │
│                                        └────────────────┘           │
│                                                                      │
│  ✅ Data binding: COMPLETE                                          │
│  ⚠️ Auth flow: PENDING                                              │
│  ❌ Contract integration: PENDING                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                          TARGET STATE                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  quote   ┌────────────┐  sign   ┌──────────────┐ │
│  │   Frontend   │ ───────▶ │   Backend  │ ──────▶ │   QUOTER     │ │
│  │   (Next.js)  │          │  (NestJS)  │         └──────────────┘ │
│  └──────┬───────┘          └────────────┘                          │
│         │                                                           │
│         │ placeBet(quote, sig)                                      │
│         ▼                                                           │
│  ┌──────────────┐  events  ┌────────────┐         ┌──────────────┐ │
│  │  ArenaCore   │ ───────▶ │  Indexer   │ ──────▶ │   MongoDB    │ │
│  │  (Contract)  │          └────────────┘         │   (Mirror)   │ │
│  └──────────────┘                                 └──────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. API ENDPOINTS MATRIX

### Frontend → Backend Calls

| Component | API Call | Status |
|-----------|----------|--------|
| ArenaTab | GET /api/predictions | ✅ |
| ArenaTab | GET /api/activity/live | ✅ |
| ArenaTab | GET /api/analysts/leaderboard | ✅ |
| PredictionCard | POST /api/markets/:id/bet-preview | ✅ |
| PredictionCard | POST /api/markets/:id/bet | ⚠️ Backend-only (нужен contract) |
| BetPanel | POST /api/pricing/quote | ⚠️ Нужен для контракта |
| DuelsTab | GET /api/duels | ✅ |
| DuelsTab | GET /api/duels/summary | ✅ |
| DuelsTab | POST /api/duels | ⚠️ Требует wallet |
| LeaguesTab | GET /api/analysts/leaderboard | ✅ |
| LeaguesTab | GET /api/seasons/current | ✅ |
| NotificationsPanel | GET /api/notifications | ✅ |
| NotificationsPanel | POST /api/notifications/read-all | ✅ |
| PositionsPage | GET /api/positions/my | ⚠️ Требует wallet |
| PositionsPage | POST /api/positions/:id/claim | ⚠️ Нужен contract |
| CreateMarket | POST /api/markets/drafts | ⚠️ Требует wallet |
| MarketplacePage | GET /api/marketplace/listings | ✅ |
| MarketplacePage | POST /api/marketplace/:id/buy | ⚠️ Нужен contract |
| ProfileDropdown | GET /api/wallet/balance | ⚠️ Требует wallet |
| ProfileDropdown | GET /api/wallet/me | ⚠️ Требует wallet |

---

## 7. РЕКОМЕНДАЦИИ

### Немедленно (до деплоя контракта)

1. **Добавить wagmi/web3modal** для connect wallet
2. **Реализовать SIWE flow** в auth controller
3. **Подготовить useExecution hook** для transaction states

### После деплоя контракта

1. Включить `ARENA_ONCHAIN_ENABLED=true`
2. Запустить `setup-roles.ts` 
3. Подключить indexer к реальным событиям
4. Переключить placeBet на контракт

---

## 8. ТЕСТОВЫЕ ДАННЫЕ

**Текущие seed данные:**
- 20 markets (binary, multi-level, conditional)
- 10 analysts с stats
- 30 activity events
- 8 duels
- 25 notifications
- Active season

**Перезапуск seed:**
```bash
cd /app/backend && npx ts-node src/scripts/seed.ts
```

---

## Обновлено: 21 марта 2026
