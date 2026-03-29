# FOMO Arena - ТЗ для Solidity-разработчика

## Версия: 1.0
## Дата: 14 марта 2026

---

## 1. Общее описание

### 1.1 Проект
FOMO Arena — платформа предсказательных рынков (prediction markets) с NFT-позициями.

### 1.2 Цель контракта
Реализовать settlement layer для prediction markets на BSC-compatible EVM.

### 1.3 Главный принцип

> **Смарт-контракт делает только то, что блокчейн делает лучше backend:**
> - Custody / Escrow
> - Ownership (NFT)
> - Immutable settlement rules
> - Claim payouts

**НЕ делать в контракте:**
- LMSR расчёты
- Oracle fetching
- Moderation queue
- Voting logic
- Ranking/XP
- Duels
- UI logic

---

## 2. Контрактная архитектура

### 2.1 Контракты

| Контракт | Описание |
|----------|----------|
| `ArenaCore.sol` | Основной контракт: markets, escrow, resolution, claims |
| `ArenaPositionNFT.sol` | ERC721 контракт для позиций |

### 2.2 Связь контрактов

```
┌─────────────────────────────────────────────────────────────┐
│                       ArenaCore                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Markets   │  │   Escrow    │  │   Resolution        │  │
│  │   Registry  │  │   (USDT)    │  │   + Claims          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│               ┌───────────────────────┐                     │
│               │  ArenaPositionNFT     │                     │
│               │  (ERC721)             │                     │
│               └───────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Структуры данных

### 3.1 Market

```solidity
struct Market {
    uint256 id;              // Уникальный ID (из backend)
    uint64 closeTime;        // Время закрытия ставок
    uint8 outcomeCount;      // Количество outcomes (обычно 2: Yes/No)
    uint8 winningOutcome;    // Победивший outcome (0 = не resolved)
    MarketStatus status;     // Статус рынка
    uint256 totalStake;      // Общий объём ставок
    bool exists;             // Флаг существования
}

enum MarketStatus {
    Open,       // Ставки принимаются
    Locked,     // Ставки закрыты
    Resolved,   // Рынок разрешён
    Cancelled   // Рынок отменён
}
```

### 3.2 Position (NFT)

```solidity
struct Position {
    uint256 marketId;    // ID рынка
    uint8 outcomeId;     // ID выбранного outcome (1 = Yes, 2 = No)
    uint256 stake;       // Размер ставки в USDT (6 decimals)
    uint256 shares;      // Количество shares (для payout calculation)
    bool claimed;        // Уже получен payout
}
```

### 3.3 Outcome Pool

```solidity
// Для каждого marketId -> outcomeId -> total staked
mapping(uint256 => mapping(uint8 => uint256)) public outcomePools;
```

---

## 4. Основные функции

### 4.1 ArenaCore.sol

#### createMarket
```solidity
/**
 * @notice Создание нового рынка (только admin/backend)
 * @param marketId Уникальный ID из backend
 * @param closeTime Unix timestamp закрытия ставок
 * @param outcomeCount Количество outcomes
 */
function createMarket(
    uint256 marketId,
    uint64 closeTime,
    uint8 outcomeCount
) external onlyResolver;
```

#### placeBet
```solidity
/**
 * @notice Размещение ставки
 * @param marketId ID рынка
 * @param outcomeId ID outcome (1-based)
 * @param amount Сумма ставки в USDT
 * @return tokenId ID созданного NFT
 */
function placeBet(
    uint256 marketId,
    uint8 outcomeId,
    uint256 amount
) external returns (uint256 tokenId);
```

**Логика:**
1. Проверить что market.status == Open
2. Проверить что block.timestamp < closeTime
3. Проверить amount >= minimumBet
4. TransferFrom USDT от user
5. Mint Position NFT
6. Обновить outcomePools
7. Emit PositionMinted event

#### lockMarket
```solidity
/**
 * @notice Заблокировать ставки (вызывается автоматически или admin)
 * @param marketId ID рынка
 */
function lockMarket(uint256 marketId) external onlyResolver;
```

#### resolveMarket
```solidity
/**
 * @notice Разрешить рынок с указанием победившего outcome
 * @param marketId ID рынка
 * @param winningOutcome ID победившего outcome
 */
function resolveMarket(
    uint256 marketId,
    uint8 winningOutcome
) external onlyResolver;
```

**Логика:**
1. Проверить что market.status == Locked
2. Проверить что winningOutcome <= outcomeCount
3. Установить market.winningOutcome
4. Установить market.status = Resolved
5. Emit MarketResolved event

#### claim
```solidity
/**
 * @notice Получить payout за выигравшую позицию
 * @param tokenId ID NFT позиции
 */
function claim(uint256 tokenId) external;
```

**Логика:**
1. Проверить что caller == ownerOf(tokenId)
2. Проверить что position.claimed == false
3. Проверить что market.status == Resolved
4. Проверить что position.outcomeId == market.winningOutcome
5. Рассчитать payout
6. Установить position.claimed = true
7. Transfer USDT пользователю
8. Emit PositionClaimed event

#### cancelMarket
```solidity
/**
 * @notice Отменить рынок (для edge cases / disputes)
 * @param marketId ID рынка
 */
function cancelMarket(uint256 marketId) external onlyResolver;
```

#### refund
```solidity
/**
 * @notice Получить refund при отмене рынка
 * @param tokenId ID NFT позиции
 */
function refund(uint256 tokenId) external;
```

**Логика:**
1. Проверить что market.status == Cancelled
2. Проверить что position.claimed == false
3. Вернуть stake пользователю
4. Установить position.claimed = true

---

### 4.2 ArenaPositionNFT.sol

ERC721 контракт с дополнительными функциями:

```solidity
/**
 * @notice Mint новой позиции (только ArenaCore)
 */
function mint(
    address to,
    uint256 marketId,
    uint8 outcomeId,
    uint256 stake,
    uint256 shares
) external onlyCore returns (uint256 tokenId);

/**
 * @notice Получить данные позиции
 */
function getPosition(uint256 tokenId) external view returns (Position memory);

/**
 * @notice Пометить позицию как claimed (только ArenaCore)
 */
function markClaimed(uint256 tokenId) external onlyCore;
```

---

## 5. Payout Calculation

### 5.1 Формула

```
totalWinningPool = outcomePools[marketId][winningOutcome]
totalLosingPool = sum of all other outcome pools

userPayout = (userStake / totalWinningPool) * (totalWinningPool + totalLosingPool - fees)
```

### 5.2 Fees

```solidity
uint256 public feeBps = 200; // 2%

uint256 totalPool = totalWinningPool + totalLosingPool;
uint256 platformFee = (totalPool * feeBps) / 10000;
uint256 payoutPool = totalPool - platformFee;
```

---

## 6. Events

### 6.1 Обязательные события

```solidity
// Market events
event MarketCreated(
    uint256 indexed marketId,
    uint64 closeTime,
    uint8 outcomeCount
);

event MarketLocked(
    uint256 indexed marketId,
    uint256 timestamp
);

event MarketResolved(
    uint256 indexed marketId,
    uint8 winningOutcome,
    uint256 timestamp
);

event MarketCancelled(
    uint256 indexed marketId,
    uint256 timestamp
);

// Position events
event PositionMinted(
    uint256 indexed tokenId,
    uint256 indexed marketId,
    address indexed user,
    uint8 outcomeId,
    uint256 stake,
    uint256 shares
);

event PositionClaimed(
    uint256 indexed tokenId,
    uint256 indexed marketId,
    address indexed user,
    uint256 payout
);

event PositionRefunded(
    uint256 indexed tokenId,
    uint256 indexed marketId,
    address indexed user,
    uint256 amount
);

// Fee events
event FeesAccrued(
    uint256 indexed marketId,
    uint256 amount
);

event FeesWithdrawn(
    address indexed to,
    uint256 amount
);
```

---

## 7. Access Control

### 7.1 Роли

```solidity
bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");
bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
```

### 7.2 Permissions

| Функция | Роль |
|---------|------|
| createMarket | RESOLVER_ROLE |
| lockMarket | RESOLVER_ROLE |
| resolveMarket | RESOLVER_ROLE |
| cancelMarket | RESOLVER_ROLE |
| setFeeBps | ADMIN_ROLE |
| withdrawFees | ADMIN_ROLE |
| pause/unpause | ADMIN_ROLE |
| placeBet | Anyone |
| claim | Position owner |
| refund | Position owner |

---

## 8. Security Requirements

### 8.1 Обязательные паттерны

- [ ] **ReentrancyGuard** на всех функциях с transfer
- [ ] **Pausable** для emergency stop
- [ ] **AccessControl** для ролей
- [ ] **Checked market existence** перед операциями
- [ ] **Claimed flag** для предотвращения double claim
- [ ] **SafeERC20** для USDT transfers

### 8.2 Проверки

```solidity
// Market existence
require(markets[marketId].exists, "Market does not exist");

// Market status
require(markets[marketId].status == MarketStatus.Open, "Market not open");

// Time check
require(block.timestamp < markets[marketId].closeTime, "Market closed");

// Amount check
require(amount >= minimumBet, "Below minimum bet");

// Ownership check
require(positionNFT.ownerOf(tokenId) == msg.sender, "Not owner");

// Not claimed
require(!positions[tokenId].claimed, "Already claimed");

// Winning outcome
require(
    positions[tokenId].outcomeId == markets[marketId].winningOutcome,
    "Position did not win"
);
```

---

## 9. Configuration

### 9.1 Constants

```solidity
address public immutable USDT;           // USDT token address
address public treasury;                  // Treasury for fees
uint256 public minimumBet = 1e6;         // 1 USDT (6 decimals)
uint256 public feeBps = 200;             // 2%
```

### 9.2 Testnet Config (BSC Testnet)

```
Chain ID: 97
RPC: https://bsc-testnet.publicnode.com
USDT: 0x337610d27c682E347C9cD60BD4b3b107C9d34dDd (или mock token)
```

---

## 10. Тесты (Обязательные)

### 10.1 Unit Tests

| Test | Description |
|------|-------------|
| `test_createMarket` | Создание рынка |
| `test_createMarket_onlyResolver` | Только resolver может создать |
| `test_placeBet` | Размещение ставки |
| `test_placeBet_belowMinimum` | Revert если ниже minimum |
| `test_placeBet_marketClosed` | Revert если market closed |
| `test_placeBet_afterCloseTime` | Revert после closeTime |
| `test_lockMarket` | Блокировка рынка |
| `test_resolveMarket` | Разрешение рынка |
| `test_claim` | Получение payout |
| `test_claim_notOwner` | Revert если не owner |
| `test_claim_alreadyClaimed` | Revert если уже claimed |
| `test_claim_losingPosition` | Revert если position проиграла |
| `test_cancelMarket` | Отмена рынка |
| `test_refund` | Получение refund |
| `test_refund_notCancelled` | Revert если market не cancelled |
| `test_transferNFT` | Трансфер NFT позиции |
| `test_claim_afterTransfer` | Claim после трансфера NFT |
| `test_feesCalculation` | Проверка расчёта fees |
| `test_withdrawFees` | Вывод fees |

### 10.2 Integration Tests

- Full flow: create → bet → lock → resolve → claim
- Cancel flow: create → bet → cancel → refund
- Multiple bettors scenario
- NFT transfer and claim by new owner

---

## 11. Deliverables

### 11.1 Код

- [ ] `ArenaCore.sol`
- [ ] `ArenaPositionNFT.sol`
- [ ] `interfaces/IArenaCore.sol`
- [ ] `interfaces/IArenaPositionNFT.sol`

### 11.2 Тесты

- [ ] Unit tests (Hardhat/Foundry)
- [ ] Coverage report (>90%)

### 11.3 Deployment

- [ ] Deploy scripts
- [ ] Verified on BSCScan (testnet)
- [ ] ABI files

### 11.4 Документация

- [ ] NatSpec comments
- [ ] README с примерами использования

---

## 12. Что НЕ входит в scope

Явно исключено из контракта:

| Функциональность | Где реализуется |
|------------------|-----------------|
| LMSR pricing | Backend |
| Oracle data fetching | Backend |
| Moderation | Backend Admin |
| Community voting | Backend |
| XP / Seasons / Leaderboard | Backend |
| Duels | Backend |
| Notifications | Backend |
| UI/UX | Frontend |

---

## 13. Timeline

| Этап | Срок |
|------|------|
| Контракты + тесты | 1-2 недели |
| Deploy testnet + verify | 2-3 дня |
| Code review / audit | 1 неделя |
| Bug fixes | 2-3 дня |
| **Итого** | **3-4 недели** |

---

## 14. Контакты

При вопросах обращаться:
- Архитектурные вопросы: [Backend team]
- Интеграция: [Integration lead]
- Бизнес-логика: [Product owner]

---

## Приложение A: Пример использования

### A.1 Создание рынка (Backend → Contract)

```javascript
// Backend calls
const tx = await arenaCore.createMarket(
    123,           // marketId from DB
    1710000000,    // closeTime (unix)
    2              // outcomeCount (Yes/No)
);
await tx.wait();
```

### A.2 Размещение ставки (Frontend → Contract)

```javascript
// 1. Approve USDT
await usdt.approve(arenaCore.address, amount);

// 2. Place bet
const tx = await arenaCore.placeBet(
    123,    // marketId
    1,      // outcomeId (1 = Yes)
    amount  // USDT amount (6 decimals)
);
const receipt = await tx.wait();

// 3. Get tokenId from event
const event = receipt.events.find(e => e.event === 'PositionMinted');
const tokenId = event.args.tokenId;
```

### A.3 Claim payout (Frontend → Contract)

```javascript
const tx = await arenaCore.claim(tokenId);
await tx.wait();
```

---

## Приложение B: Диаграмма потоков

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER FLOW                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. PLACE BET                                                    │
│     User → approve USDT → placeBet() → NFT minted               │
│                                                                  │
│  2. WAIT FOR RESOLUTION                                          │
│     Backend monitors → lockMarket() → resolveMarket()           │
│                                                                  │
│  3. CLAIM                                                        │
│     User → claim(tokenId) → USDT transferred                    │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                         CANCEL FLOW                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CANCEL                                                       │
│     Admin → cancelMarket()                                       │
│                                                                  │
│  2. REFUND                                                       │
│     User → refund(tokenId) → stake returned                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```
