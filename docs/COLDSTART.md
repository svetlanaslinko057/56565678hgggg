# FOMO Arena - Cold Start Guide

## Полный запуск проекта с нуля за 1 команду

### 🚀 One-Line Start

```bash
chmod +x /app/scripts/bootstrap.sh && /app/scripts/bootstrap.sh
```

---

## Что делает bootstrap.sh:

### 1️⃣ Проверка prerequisites
- Node.js 18+
- npm / yarn
- Python 3.11+
- MongoDB

### 2️⃣ Создание .env файлов
- `/app/backend/.env` - Backend конфигурация
- `/app/frontend/.env` - Frontend конфигурация  
- `/app/arena-indexer/.env` - Indexer конфигурация

### 3️⃣ Установка зависимостей
- Backend: `npm install`
- Frontend: `yarn install`
- Indexer: `npm install`
- Python: `pip install httpx fastapi uvicorn`

### 4️⃣ Настройка Supervisor
- Создание конфига для indexer
- Регистрация сервисов

### 5️⃣ Запуск сервисов
- Backend (NestJS) на порту 4001
- Frontend (Next.js) на порту 3000
- Indexer (Node.js)
- Proxy (FastAPI) на порту 8001

### 6️⃣ Верификация
- Health check backend
- Проверка frontend
- Проверка indexer sync

---

## 📍 После запуска

| Сервис | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8001/api |
| API Docs | http://localhost:8001/api/docs |

---

## 🔧 Supervisor команды

```bash
# Статус всех сервисов
sudo supervisorctl status

# Перезапуск всех
sudo supervisorctl restart all

# Перезапуск одного
sudo supervisorctl restart backend

# Логи
tail -f /var/log/supervisor/backend.out.log
tail -f /var/log/supervisor/frontend.out.log
tail -f /var/log/supervisor/indexer.out.log
```

---

## 🔗 Smart Contract

| Параметр | Значение |
|----------|----------|
| Network | BSC Testnet (Chain ID: 97) |
| Contract | `0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e` |
| Stablecoin | `0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948` |
| Min Bet | 10 USDT |
| Fee | 2% |

---

## 🤖 Telegram Bot

| Параметр | Значение |
|----------|----------|
| Bot Token | `8539686854:AAHM6g76lGGVTog0yW-fQ0KYcDmsHjz0kRU` |
| Web App URL | `https://repo-setup-54.preview.emergentagent.com/tg` |

Токен уже включен в `bootstrap.sh` и автоматически добавляется в `.env` при развертывании.

---

## ✅ Проверка работы

```bash
# Health check
curl http://localhost:8001/api/health
# Expected: {"status":"ok","service":"fomo-arena"}

# Indexer status
curl http://localhost:8001/api/onchain/indexer/status
# Expected: {"success":true,"data":{"lastSyncedBlock":...,"isRunning":true}}

# Contract config
curl http://localhost:8001/api/onchain/config
# Expected: {"success":true,"data":{"minBetFormatted":"10.0",...}}
```

---

## 🚨 Troubleshooting

### Backend не запускается
```bash
tail -50 /var/log/supervisor/backend.err.log
```

### Indexer не синхронизируется
```bash
# Проверить START_BLOCK в .env
cat /app/arena-indexer/.env | grep START_BLOCK

# Обновить на текущий блок
BLOCK=$(curl -s -X POST https://bsc-testnet.publicnode.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | python3 -c "import sys,json; print(int(json.load(sys.stdin)['result'], 16) - 1000)")
echo "START_BLOCK=$BLOCK"
```

### Frontend ошибки сборки
```bash
cd /app/frontend && yarn build
```
