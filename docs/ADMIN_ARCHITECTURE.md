# FOMO Arena - Архитектура Админки

## Версия: 1.0
## Дата: 14 марта 2026

---

## 1. Принципы

Админка — это **операционная панель платформы**, не просто табличка.

### Три главные задачи:

**A. Управление контентом**
- Новые prediction markets
- Модерация user-created markets
- Редактирование market data

**B. Управление экономикой**
- Ставки, позиции, payout
- Liquidity, fees
- Disputes

**C. Управление пользователями**
- Wallet profiles
- Bans/freeze
- XP / ranks / seasons
- Duel oversight

---

## 2. Структура админки

```
/admin
 ├── dashboard          # Overview всей платформы
 ├── markets            # Все живые рынки
 ├── drafts             # Модерация user-created markets
 ├── resolution         # Resolution center
 ├── users              # Управление пользователями
 ├── positions          # Все позиции
 ├── marketplace        # Secondary market
 ├── duels              # Дуэли
 ├── seasons            # Сезоны и лидерборд
 ├── notifications      # Системные уведомления
 ├── risk               # Risk monitor
 └── settings           # Настройки платформы
```

---

## 3. Детальное описание разделов

### 3.1 Dashboard

**Цель:** Overview всей платформы

**Метрики:**
- Total users
- Active markets
- Pending drafts
- Total volume
- Open disputes
- Active duels
- Payouts today
- Liquidity at risk

**UI Карточки:**
```
[Users]  [Markets]  [Volume]  [Open Duels]  [Pending Drafts]  [Unresolved Markets]
```

**Endpoint:**
```
GET /api/admin/dashboard
```

**Response:**
```json
{
  "users": { "total": 1250, "active24h": 89, "new7d": 156 },
  "markets": { "total": 128, "live": 45, "pending": 12, "resolved": 71 },
  "volume": { "total": 4300000, "today": 125000, "week": 890000 },
  "duels": { "active": 23, "pending": 8, "finished": 156 },
  "drafts": { "pending": 15, "review": 3 },
  "disputes": { "open": 2 },
  "liquidity": { "total": 890000, "atRisk": 45000 }
}
```

---

### 3.2 Markets

**Цель:** Управление всеми живыми рынками

**Таблица колонок:**
| Колонка | Описание |
|---------|----------|
| title | Название рынка |
| type | single/multi/conditional |
| category | crypto/sports/politics |
| status | published/locked/resolved |
| creator | wallet address |
| closeTime | Время закрытия |
| liquidity | Текущая ликвидность |
| volume | Объём торгов |
| participants | Количество участников |

**Actions:**
- `view` - Просмотр деталей
- `edit` - Редактирование
- `lock` - Заблокировать ставки
- `resolve` - Разрешить рынок
- `cancel` - Отменить рынок

**Endpoints:**
```
GET    /api/admin/markets
GET    /api/admin/markets/:id
PATCH  /api/admin/markets/:id
POST   /api/admin/markets/:id/lock
POST   /api/admin/markets/:id/resolve
POST   /api/admin/markets/:id/cancel
```

---

### 3.3 Drafts / Moderation

**Цель:** Один из самых важных разделов — модерация user-created markets

**Flow:**
```
Draft → Review → Approve/Reject → Published
```

**Таблица колонок:**
| Колонка | Описание |
|---------|----------|
| title | Название драфта |
| creator | Wallet создателя |
| stakeLocked | Заблокированный stake (100 USDT) |
| createdAt | Дата создания |
| oracleType | Тип оракула |
| status | draft/review/approved/rejected |

**Actions:**
- `preview` - Предпросмотр рынка
- `edit` - Редактирование перед approve
- `approve` - Одобрить
- `reject` - Отклонить (требует reason)

**Endpoints:**
```
GET    /api/admin/drafts
GET    /api/admin/drafts/:id
PATCH  /api/admin/drafts/:id
POST   /api/admin/drafts/:id/approve
POST   /api/admin/drafts/:id/reject
```

**Reject Request:**
```json
{
  "reason": "Unclear resolution criteria",
  "suggestions": "Please specify exact price threshold"
}
```

---

### 3.4 Resolution Center

**Цель:** Отдельный раздел для разрешения рынков (не просто кнопка)

**Показывает рынки:**
- Достигли closeTime
- Ждут oracle check
- Disputed
- Ждут community vote
- Готовы к финальному resolve

**Таблица колонок:**
| Колонка | Описание |
|---------|----------|
| market | Название рынка |
| oracleResult | Результат от оракула |
| adminStatus | Статус админа |
| voteStatus | Статус community vote |
| finalOutcome | Финальный результат |

**Actions:**
- `confirm` - Подтвердить oracle result
- `override` - Перезаписать результат
- `dispute` - Открыть диспут
- `finalize` - Финализировать
- `simulate` - Симуляция payout

**Endpoints:**
```
GET  /api/admin/resolution
POST /api/admin/markets/:id/simulate
POST /api/admin/markets/:id/confirm
POST /api/admin/markets/:id/override
POST /api/admin/markets/:id/dispute
POST /api/admin/markets/:id/finalize
```

**Resolution Flow:**
```
Market Closed
     │
     ▼
Oracle Check
     │
     ├─► Auto-resolve (if clear)
     │
     ├─► Admin Review (if ambiguous)
     │        │
     │        ├─► Confirm
     │        └─► Override
     │
     └─► Disputed
              │
              ▼
         Community Vote
              │
              ▼
         Final Resolve
```

---

### 3.5 Users

**Цель:** Управление пользователями платформы

**Таблица колонок:**
| Колонка | Описание |
|---------|----------|
| wallet | Адрес кошелька |
| username | Никнейм |
| source | web/telegram |
| xp | Очки опыта |
| tier | Уровень |
| balance | Баланс |
| positions | Количество позиций |
| winRate | Процент побед |
| status | active/frozen/banned |

**Actions:**
- `view` - Просмотр профиля
- `freeze` - Заморозить аккаунт
- `unfreeze` - Разморозить
- `adjust-xp` - Изменить XP
- `adjust-balance` - Изменить баланс
- `verify` - Верифицировать

**Endpoints:**
```
GET  /api/admin/users
GET  /api/admin/users/:id
POST /api/admin/users/:id/freeze
POST /api/admin/users/:id/unfreeze
POST /api/admin/users/:id/adjust-xp
POST /api/admin/users/:id/adjust-balance
POST /api/admin/users/:id/verify
```

---

### 3.6 Positions

**Цель:** Просмотр и управление всеми позициями

**Таблица колонок:**
| Колонка | Описание |
|---------|----------|
| positionId | ID позиции |
| market | Название рынка |
| wallet | Владелец |
| side | yes/no |
| stake | Размер ставки |
| odds | Коэффициент |
| status | open/won/lost/claimed |
| payout | Выплата |
| tokenId | NFT Token ID |
| listed | Выставлена на продажу |

**Actions:**
- `inspect` - Детальный просмотр
- `cancel-listing` - Отменить листинг
- `force-claim` - Принудительный claim
- `dispute` - Пометить как спорную

**Endpoints:**
```
GET  /api/admin/positions
GET  /api/admin/positions/:id
POST /api/admin/positions/:id/cancel-listing
POST /api/admin/positions/:id/force-claim
POST /api/admin/positions/:id/dispute
```

---

### 3.7 Marketplace

**Цель:** Контроль secondary market

**Таблица колонок:**
| Колонка | Описание |
|---------|----------|
| orderId | ID ордера |
| positionId | ID позиции |
| seller | Продавец |
| buyer | Покупатель |
| price | Цена |
| status | active/sold/cancelled |
| createdAt | Дата создания |

**Actions:**
- `inspect` - Детали сделки
- `cancel` - Отменить ордер
- `freeze-seller` - Заморозить продавца

**Endpoints:**
```
GET  /api/admin/marketplace
GET  /api/admin/marketplace/:id
POST /api/admin/marketplace/:id/cancel
```

---

### 3.8 Duels

**Цель:** Управление дуэлями

**Таблица колонок:**
| Колонка | Описание |
|---------|----------|
| duelId | ID дуэли |
| playerA | Создатель |
| playerB | Оппонент |
| market | Привязанный рынок |
| stake | Ставка |
| status | pending/active/finished |
| winner | Победитель |
| createdAt | Дата создания |

**Actions:**
- `inspect` - Детали
- `cancel` - Отменить
- `resolve` - Разрешить вручную
- `dispute` - Открыть диспут

**Endpoints:**
```
GET  /api/admin/duels
GET  /api/admin/duels/:id
POST /api/admin/duels/:id/cancel
POST /api/admin/duels/:id/resolve
POST /api/admin/duels/:id/dispute
```

---

### 3.9 Seasons

**Цель:** Управление сезонами и лидербордом

**Таблица колонок:**
| Колонка | Описание |
|---------|----------|
| season | Название сезона |
| start | Дата начала |
| end | Дата окончания |
| totalPlayers | Участники |
| totalVolume | Объём |
| status | upcoming/active/ended |

**Actions:**
- `create` - Создать сезон
- `start` - Запустить
- `close` - Закрыть
- `recalculate` - Пересчитать лидерборд
- `rewards` - Выдать награды

**Endpoints:**
```
GET  /api/admin/seasons
POST /api/admin/seasons
POST /api/admin/seasons/:id/start
POST /api/admin/seasons/:id/close
POST /api/admin/seasons/:id/recalculate
POST /api/admin/seasons/:id/rewards
```

---

### 3.10 Notifications

**Цель:** Мониторинг системных уведомлений

**Таблица колонок:**
| Колонка | Описание |
|---------|----------|
| user | Получатель |
| type | Тип уведомления |
| payload | Данные |
| delivered | Доставлено |
| read | Прочитано |
| createdAt | Дата |

**Actions:**
- `inspect` - Детали события
- `resend` - Переотправить
- `purge` - Удалить старые

**Endpoints:**
```
GET  /api/admin/notifications
GET  /api/admin/notifications/:id
POST /api/admin/notifications/:id/resend
POST /api/admin/notifications/purge
```

---

### 3.11 Risk Monitor

**Цель:** КРИТИЧЕСКИ ВАЖНЫЙ раздел для контроля рисков

**Мониторинг:**
- Oversized positions (большие ставки)
- Whale bets (китовые ставки)
- One-sided markets (односторонние рынки)
- Abnormal payout risk
- Disputed markets
- Low liquidity markets

**Таблица колонок:**
| Колонка | Описание |
|---------|----------|
| market | Рынок |
| riskType | Тип риска |
| severity | low/medium/high/critical |
| exposure | Размер экспозиции |
| largestWallet | Крупнейший участник |
| recommendedAction | Рекомендация |

**Endpoints:**
```
GET /api/admin/risk
GET /api/admin/risk/markets/:id
GET /api/admin/risk/alerts
```

---

### 3.12 Settings

**Цель:** Настройки платформы

**Параметры:**
| Параметр | Описание | Default |
|----------|----------|---------|
| marketCreationStake | Stake для создания рынка | 100 USDT |
| minimumBet | Минимальная ставка | 1 USDT |
| feeBps | Комиссия платформы | 200 (2%) |
| seasonXpMultiplier | Множитель XP | 1.0 |
| duelRewards | Награды за дуэли | {...} |
| oracleProviders | Провайдеры оракулов | [...] |
| communityVoteDuration | Время голосования | 24h |
| nftVotingThreshold | Порог для голосования | 1 NFT |

**Endpoints:**
```
GET   /api/admin/settings
PATCH /api/admin/settings
```

---

## 4. Роли в админке

### 4.1 Moderator
**Доступ:**
- Drafts (view, approve, reject)
- Users (view, freeze)
- Notifications (view)

### 4.2 Operator
**Доступ:**
- Всё от Moderator +
- Markets (full)
- Positions (full)
- Duels (full)
- Resolution (confirm)

### 4.3 Superadmin
**Доступ:**
- Всё +
- Settings
- Force resolve
- Balance adjustments
- Platform config
- Risk monitor (full)

---

## 5. Приоритет реализации

### V1 (Обязательно):
- [ ] Dashboard
- [ ] Drafts / Moderation
- [ ] Markets
- [ ] Resolution Center
- [ ] Users
- [ ] Positions
- [ ] Seasons
- [ ] Risk Monitor

### V2 (Желательно):
- [ ] Marketplace
- [ ] Notifications explorer
- [ ] Advanced analytics
- [ ] Audit logs

---

## 6. UI Guidelines

### Принципы:
- Светлая тема (не декоративная)
- Чистые таблицы с пагинацией
- Статусные бейджи с цветовой кодировкой
- Action bar справа в каждой строке
- Sticky filters сверху
- Confirm modals для разрушительных действий
- Breadcrumbs для навигации

### Цветовая кодировка статусов:
```
Green  - active, approved, won
Yellow - pending, review
Red    - rejected, disputed, frozen
Gray   - draft, cancelled
Blue   - resolved, claimed
```

---

## 7. API Response Format

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Admin role required",
  "statusCode": 403
}
```
