# FOMO Arena - Execution Plan

## Версия: 1.0
## Дата: 14 марта 2026

---

## Диагноз

**Текущее состояние:** UI + Mongo + иллюзия ставок (симуляция продукта)

| Компонент | Готовность |
|-----------|------------|
| Backend | 85% |
| Frontend | 80% |
| Smart Contract | 10% |
| Web3 Integration | 5% |

**Главный блокер:** Без смарт-контракта нет реальных денег → нет реального рынка

---

## PHASE 1: STABILIZATION (Срочно)

**Цель:** Сделать систему честно работающей OFF-CHAIN

### TASK 1.1 — Wallet Auth
- [ ] `POST /auth/wallet` endpoint
- [ ] Backend: `generateNonce(wallet)`
- [ ] Frontend: `signMessage(nonce)`
- [ ] Backend: `verifySignature → issue JWT`

### TASK 1.2 — Убрать Demo Mode
- [ ] Удалить demo wallet
- [ ] Удалить fake balance
- [ ] Одна логика баланса

### TASK 1.3 — Единый баланс
- [ ] ONE SOURCE OF TRUTH: `User.balance`
- [ ] Убрать дублирование

### TASK 1.4 — Fix Betting Logic
- [ ] Списание баланса
- [ ] Запись позиции
- [ ] LMSR odds calculation
- [ ] Payout calculation

---

## PHASE 2: PRODUCT CORE (UX)

**Цель:** Продукт выглядит и ощущается как настоящий

### TASK 2.1 — Header ✅
- [x] Clean layout
- [x] Убран мусор
- [x] Один CTA

### TASK 2.2 — Arena Layout ✅
- [x] Modes (tabs)
- [x] Controls (search/sort/filter)
- [x] Context (stats)
- [x] Grid (cards)

### TASK 2.3 — Market Card
- [ ] YES/NO читаемые
- [ ] Probability bar
- [ ] Быстрые действия

### TASK 2.4 — Create Market Page
- [ ] `/arena/create`
- [ ] Title, description
- [ ] Resolution condition
- [ ] End date
- [ ] Category
- [ ] Stake (100 USDT)

### TASK 2.5 — Resolution UI
- [ ] Resolved state
- [ ] Result explanation
- [ ] Payout info

---

## PHASE 3: ADMIN SYSTEM

**Цель:** Операционная панель платформы

### Обязательно для V1:
- [ ] Dashboard
- [ ] Drafts / Moderation
- [ ] Markets management
- [ ] Resolution Center
- [ ] Users management
- [ ] Positions view
- [ ] Seasons management
- [ ] Risk Monitor

### V2:
- [ ] Marketplace
- [ ] Notifications explorer
- [ ] Audit logs

**Документация:** `/app/docs/ADMIN_ARCHITECTURE.md`

---

## PHASE 4: SMART CONTRACT

**Цель:** Escrow + NFT ownership + Claims

### Контракты:
1. `ArenaCore.sol` - markets, escrow, resolution
2. `ArenaPositionNFT.sol` - ERC721 positions

### Функции:
- [ ] createMarket (admin only)
- [ ] placeBet (user)
- [ ] lockMarket (admin)
- [ ] resolveMarket (admin)
- [ ] claim (user)
- [ ] cancelMarket (admin)
- [ ] refund (user)

### НЕ делать в контракте:
- ❌ LMSR
- ❌ Oracle fetching
- ❌ Voting logic
- ❌ XP/Seasons

**ТЗ:** `/app/docs/SMART_CONTRACT_TZ.md`

---

## PHASE 5: INTEGRATION

### Step 1: Replace balance
```
Mongo balance → Blockchain balance
```

### Step 2: Update bet flow
```
POST /bet → calls contract
```

### Step 3: Event listener
```
Contract events → Backend indexer
```

### Step 4: DB Sync
```
Contract → Backend DB (read-only mirror)
```

---

## PHASE 6: TELEGRAM MINI APP

**Только после:**
- ✅ Контракт работает
- ✅ Админка есть
- ✅ Рынок живой

---

## Приоритетный порядок

```
1. Wallet auth
2. Убрать demo
3. Починить баланс и ставки
4. Доделать UI (header + cards)
5. Сделать create market page
6. Сделать админку
7. Написать smart contract
8. Интегрировать
9. Telegram Mini App
```

---

## Критические ошибки (НЕ делать)

- ❌ Писать контракт до стабилизации
- ❌ Делать сложную on-chain логику
- ❌ Оставлять demo параллельно
- ❌ Дублировать баланс (DB + chain)

---

## Разделение ответственности

| Layer | Responsibility |
|-------|----------------|
| **Smart Contract** | Деньги, позиции, выплаты |
| **Backend** | Markets creation, oracle, resolution, voting, admin |
| **Frontend** | UI, UX, Web3 calls |

---

## Документы проекта

| Документ | Путь |
|----------|------|
| Аудит | `/app/AUDIT_REPORT.md` |
| PRD | `/app/memory/PRD.md` |
| Архитектура админки | `/app/docs/ADMIN_ARCHITECTURE.md` |
| ТЗ смарт-контракта | `/app/docs/SMART_CONTRACT_TZ.md` |
| Execution Plan | `/app/docs/EXECUTION_PLAN.md` |
