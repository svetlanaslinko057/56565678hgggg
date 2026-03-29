# FOMO Arena - Telegram Mini App Аудит

**Дата:** 29 березня 2026  
**Статус:** Частково реалізовано

---

## 🟢 РЕАЛІЗОВАНО (Працює)

### Backend Модулі
| Модуль | Опис | Статус |
|--------|------|--------|
| `telegram-auth` | Авторизація через Telegram initData | ✅ Готово |
| `predictions` | CRUD ринків, статуси, outcomes | ✅ Готово |
| `positions` | Ставки, bet preview, AMM odds | ✅ Готово |
| `liquidity` | AMM пули, dynamic odds | ✅ Готово |
| `markets` | Деталі ринку, odds history | ✅ Готово |
| `duels` | 1v1 дуелі | ✅ Готово |
| `notifications` | Push повідомлення | ✅ Готово |
| `xp` | Рівні, бейджі, досягнення | ✅ Готово |
| `leaderboard` | Таблиця лідерів | ✅ Готово |
| `profile` | Статистика користувача | ✅ Готово |
| `oracle` | Ціни BTC/ETH/SOL (CoinGecko) | ✅ Готово |
| `resolution` | Резолюція ринків | ✅ Готово |

### Frontend TG Mini App
| Компонент | Опис | Статус |
|-----------|------|--------|
| `/tg/arena` | Стрічка ринків з AI Edge | ✅ UI готовий |
| `/tg/duels` | Список дуелей | ✅ UI готовий |
| `/tg/leaderboard` | Лідерборд | ✅ UI готовий |
| `/tg/profile` | Профіль, XP, бейджі | ✅ UI готовий |
| `BetSheet` | Bottom sheet для ставок | ✅ UI готовий |
| Haptic Feedback | Вібрація на дії | ✅ Готово |

### Інфраструктура
| Компонент | Статус |
|-----------|--------|
| Web3Service | ✅ Підключення до BSC Testnet |
| MongoDB | ✅ Працює |
| JWT Auth | ✅ Працює |
| TELEGRAM_BOT_TOKEN | ✅ Налаштовано |

---

## 🟡 ЧАСТКОВО РЕАЛІЗОВАНО (Потребує доробки)

### 1. Indexer Service
**Проблема:** Event listeners прописані, але НЕ підключені до реального контракту
```typescript
// Зараз:
this.logger.log('Event listeners would be attached here');

// Потрібно:
contract.on('MarketCreated', this.handleMarketCreated);
contract.on('PositionMinted', this.handlePositionMinted);
contract.on('MarketResolved', this.handleMarketResolved);
```

### 2. PlaceBet Flow
**Проблема:** Ставки створюються в БД, але НЕ виконуються on-chain
```typescript
// Зараз в positions.service.ts:
// Note: Balance deduction happens on-chain via smart contract
// Backend only tracks positions for indexing/display purposes

// Потрібно: Frontend повинен викликати контракт напряму через wagmi
```

### 3. Claim Payout
**Проблема:** Claim оновлює статус в БД, але НЕ викликає контракт
```typescript
// Потрібно додати в claim():
await this.web3Service.claimOnChain(tokenId);
```

---

## 🔴 НЕ РЕАЛІЗОВАНО (Критично)

### 1. On-Chain Bet Placement (КРИТИЧНО)
**Що відсутнє:**
- Frontend НЕ викликає `placeBet()` на контракті
- Користувач НЕ підписує транзакцію
- Кошти НЕ списуються з гаманця

**Що потрібно:**
```typescript
// В TG Mini App BetSheet.tsx:
const { writeContract } = useWriteContract();

const placeBet = async () => {
  // 1. Approve USDT
  await writeContract({
    address: USDT_ADDRESS,
    abi: erc20Abi,
    functionName: 'approve',
    args: [ARENA_CORE_ADDRESS, parseUnits(amount, 18)]
  });
  
  // 2. Place bet
  await writeContract({
    address: ARENA_CORE_ADDRESS,
    abi: arenaCoreAbi,
    functionName: 'placeBet',
    args: [marketId, outcomeId, parseUnits(amount, 18), shares]
  });
};
```

### 2. Wallet Connection (КРИТИЧНО)
**Що відсутнє:**
- TG Mini App НЕ підключає гаманець
- Немає WalletConnect / RainbowKit в TG версії

**Що потрібно:**
```typescript
// В TgShell.tsx:
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';

// Або Telegram Wallet:
import { TonConnectButton } from '@tonconnect/ui-react';
```

### 3. Real Indexer Listener (КРИТИЧНО)
**Що відсутнє:**
- Indexer НЕ слухає події контракту
- Немає синхронізації on-chain → DB

**Що потрібно:**
```typescript
// В indexer.service.ts startListening():
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(ARENA_CORE_ADDRESS, ABI, provider);

contract.on('PositionMinted', async (tokenId, marketId, user, outcome, stake, shares, event) => {
  await this.handlePositionMinted({
    tokenId: tokenId.toString(),
    marketId: marketId.toString(),
    owner: user,
    outcome: Number(outcome),
    stake: stake.toString(),
    shares: shares.toString(),
    txHash: event.log.transactionHash,
    blockNumber: event.log.blockNumber,
  });
});
```

### 4. Mock Data в Arena Feed
**Проблема:** Якщо API повертає пустий масив, показуються mockMarkets
```typescript
// ArenaFeed.tsx:
if (result.data && result.data.length > 0) {
  setMarkets(transformed);
} else {
  setMarkets(mockMarkets); // ← MOCK!
}
```

### 5. AI Edge Calculation
**Проблема:** AI Edge захардкожений в mock data
```typescript
// types.ts mockMarkets:
ai: {
  probability: 0.58,  // ← Фейкові дані
  edge: 0.13,
  signal: 'buy',
  confidence: 0.82,
}
```

---

## 📋 ПЛАН ДІЙ (Пріоритет)

### Phase 1: Wallet Connection (P0)
1. Додати WalletConnect до TG Mini App
2. Або інтегрувати TON Connect / Telegram Wallet
3. Зберігати wallet address в сесії

### Phase 2: On-Chain Bets (P0)
1. Frontend викликає `approve()` + `placeBet()`
2. Backend отримує txHash і зберігає
3. Indexer синхронізує позиції

### Phase 3: Indexer Live Sync (P1)
1. Підключити ethers.js listeners
2. Sync on-chain стану в MongoDB
3. WebSocket оновлення для UI

### Phase 4: Real Data (P1)
1. Прибрати mockMarkets fallback
2. Показувати реальні ринки з контракту
3. AI Edge через FOMO Engine (якщо готово)

### Phase 5: Claim Flow (P2)
1. Frontend викликає `claim()` на контракті
2. Backend оновлює статус після tx confirm

---

## 🔧 ENV Variables Needed

```env
# Backend (.env)
TELEGRAM_BOT_TOKEN=8539686854:AAHM6g76lGGVTog0yW-fQ0KYcDmsHjz0kRU
ARENA_CORE_ADDRESS=0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e
ARENA_POSITION_NFT_ADDRESS=<NFT_CONTRACT_ADDRESS>
USDT_ADDRESS=0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948
OPERATOR_PRIVATE_KEY=<FOR_SERVER_SIDE_OPS>
ARENA_ONCHAIN_ENABLED=true
CHAIN_RPC=https://bsc-testnet.publicnode.com
CHAIN_ID=97

# Frontend (.env)
NEXT_PUBLIC_ARENA_CORE_ADDRESS=0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e
NEXT_PUBLIC_USDT_ADDRESS=0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948
NEXT_PUBLIC_CHAIN_ID=97
```

---

## Резюме

| Категорія | Готовність |
|-----------|------------|
| UI/UX | 85% |
| Backend API | 90% |
| Auth (Telegram) | 100% |
| On-Chain Integration | 20% |
| Indexer Sync | 10% |
| **Загалом** | **~50%** |

**Головна проблема:** Ставки не йдуть on-chain. Користувач бачить красивий UI, але реальних транзакцій немає.
