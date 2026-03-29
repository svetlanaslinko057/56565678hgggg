# FOMO Arena - Developer Tasks for Smart Contract

## Версия: 1.0
## Дата: 21 марта 2026

---

## ФИНАЛЬНЫЙ СТАТУС

| Компонент | Готовность |
|-----------|------------|
| Smart Contract Layer | **95%** |
| Production Skeleton | **ГОТОВ** |
| Передача разработчику | **МОЖНО** |

---

## ЧТО ГОТОВО ✅

### ArenaCore v3 (Production-Ready)
- [x] Custom errors (gas efficient)
- [x] SafeERC20 для всех трансферов
- [x] Nonce protection (`usedNonces`)
- [x] Digest protection (`usedQuoteDigests`)
- [x] maxBetAmount limit
- [x] maxMarketDeposited limit
- [x] Batch claim
- [x] Emergency withdraw
- [x] View helpers (`getMarketTotals`, `getOutcomeLiquidity`)
- [x] `isNonceUsed(address, nonce)` view function
- [x] `DOMAIN_SEPARATOR()` view function
- [x] Market states включая DISPUTED
- [x] Resolution source tracking
- [x] Creator bond с slash/release
- [x] Fee split (platform + creator)
- [x] Claim delay для dispute window
- [x] Liquidity check в claim (**ДОБАВЛЕНО**)
- [x] Role setup script (**ОБНОВЛЁН**)

---

## ЗАДАЧИ ДЛЯ РАЗРАБОТЧИКА (ПЕРЕД АУДИТОМ)

### 🔴 P0 - Критические (Must Have)

#### 1. Gas Optimization
```
Задачи:
- Профилирование gas для всех функций
- Оптимизация storage reads (кеширование в memory)
- Проверка packed structs
- unchecked blocks где безопасно
```

#### 2. Full Test Coverage
```
Текущее: 39/39 tests passing
Нужно:
- Edge cases для всех функций
- Fuzz testing для числовых параметров
- Invariant tests
- Gas snapshot tests
- Target: >95% coverage
```

#### 3. Security Hardening
```
Проверить:
- Все external calls после state changes (CEI)
- Нет remaining transfer() вызовов (только safeTransfer)
- Nonce overflow protection
- Reentrancy guards на всех public функциях
```

#### 4. Role Setup Script
```
Файл: /app/arena-contracts/scripts/setup-roles.ts
После deploy ОБЯЗАТЕЛЬНО:
- grantRole(QUOTER_ROLE, signer)
- grantRole(RESOLVER_ROLE, admin)
- grantRole(OPERATOR_ROLE, admin)
- grantRole(TREASURY_MANAGER_ROLE, admin)
- grantRole(MINTER_ROLE, arenaCoreAddress) на NFT
```

---

### 🟡 P1 - Важные (Should Have)

#### 5. USDT Decimals Documentation
```
Текущее: parseUnits(amount, 18)
USDT = 6 decimals

Решение:
- Зафиксировать в документации
- Либо использовать mock с 18 decimals для тестнета
- collateralToken.decimals() должен быть consistent
```

#### 6. Risk Limits Configuration
```
Перед testnet установить:
maxBetAmount = 1000 * 10^decimals      // 1000 USDT
maxMarketDeposited = 100000 * 10^decimals  // 100k USDT

Текущее: 0 (unlimited) - небезопасно для prod
```

#### 7. Deploy Script Updates
```
Файл: /app/arena-contracts/scripts/deploy.ts
Добавить:
- setRiskLimits() вызов после deploy
- Verify на BSCScan
- Save deployment artifacts
```

---

### 🟢 P2 - Улучшения (Nice to Have)

#### 8. EIP-2612 Permit Support
```
Для лучшего UX:
- Убрать approve шаг
- placeBetWithPermit() функция
```

#### 9. Granular Pausable
```
Отдельные паузы:
- pauseBetting()
- pauseClaiming()
- pauseMarketCreation()
```

#### 10. Multi-Signer Quoter (Future)
```
Текущее: QUOTER_ROLE = single point of failure
Будущее:
- Multi-signer quoter
- Rate limiting
- Fallback signer
```

---

## CHECKLIST ПЕРЕД АУДИТОМ

- [ ] Все тесты проходят
- [ ] Coverage > 95%
- [ ] Gas профилирование выполнено
- [ ] CEI паттерн везде
- [ ] SafeERC20 везде
- [ ] Nonce protection работает
- [ ] Risk limits установлены
- [ ] Role setup script протестирован
- [ ] Deployment script работает
- [ ] BSCScan verification работает

---

## ARCHITECTURE REMINDER

```
┌─────────────────────────────────────────────────────────────┐
│                        FOMO ARENA                            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  placeBet  ┌──────────────┐  events  ┌──────┐ │
│  │ Frontend │ ─────────▶ │  ArenaCore   │ ───────▶ │Indexer│ │
│  │(Next.js) │            │    (BSC)     │          └───┬──┘ │
│  └──────────┘            └──────────────┘              │    │
│       │                        │                       │    │
│       │ API                    │                       ▼    │
│       │                  ┌─────┴─────┐          ┌─────────┐ │
│       │            ┌─────┴─────┐ ┌───┴───┐      │ MongoDB │ │
│       │            │  Treasury │ │  NFT  │      │ (mirror)│ │
│       │            └───────────┘ └───────┘      └────┬────┘ │
│       │                                              │      │
│       └──────────────────────────────────────────────┘      │
│                    Backend (NestJS)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## КРИТИЧЕСКИЕ ПРАВИЛА

1. **Contract = Source of Truth**
   - Backend НИКОГДА не пишет балансы напрямую

2. **No Optimistic UI for Money**
   - НИКОГДА: `setBalance(balance - amount)` после tx
   - ВСЕГДА: Ждать indexer

3. **Tx Lifecycle**
   ```
   idle → approving → signing → pending → confirmed → indexed
   ```

4. **Network Enforcement**
   - Блокировать действия если неправильная сеть

---

## КОНТАКТЫ

- Репозиторий: `/app/arena-contracts/`
- Тесты: `/app/arena-contracts/test/`
- Deploy: `/app/arena-contracts/scripts/`
- Документация: `/app/docs/`

---

## Updated: March 21, 2026
