#!/bin/bash
#
# FOMO Arena - Cold Start Bootstrap Script
# Полный запуск проекта с нуля
#

set -e

echo "========================================"
echo "🚀 FOMO Arena - Cold Start Bootstrap"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="/app"
cd $PROJECT_ROOT

# ==================== STEP 1: Check Prerequisites ====================
echo -e "${YELLOW}[1/7] Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi
echo "  ✅ Node.js $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi
echo "  ✅ npm $(npm -v)"

# Check yarn
if ! command -v yarn &> /dev/null; then
    echo "  ⚠️ Installing yarn..."
    npm install -g yarn
fi
echo "  ✅ yarn $(yarn -v)"

# Check MongoDB
if ! command -v mongosh &> /dev/null; then
    echo -e "${YELLOW}  ⚠️ mongosh not found, assuming MongoDB is running${NC}"
else
    echo "  ✅ MongoDB tools available"
fi

# Check Python (for proxy)
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 not found${NC}"
    exit 1
fi
echo "  ✅ Python $(python3 --version)"

echo ""

# ==================== STEP 2: Create Environment Files ====================
echo -e "${YELLOW}[2/7] Creating environment files...${NC}"

# Backend .env
if [ ! -f "$PROJECT_ROOT/backend/.env" ]; then
    cat > "$PROJECT_ROOT/backend/.env" << 'EOF'
PORT=4001
MONGO_URL=mongodb://localhost:27017/fomo_arena
DB_NAME=fomo_arena
JWT_SECRET=fomo-arena-secret-key-2026
ARENA_ONCHAIN_ENABLED=true
CHAIN_RPC=https://bsc-testnet.publicnode.com
CHAIN_ID=97
PREDICTION_CONTRACT=0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e
ARENA_CORE_ADDRESS=0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e
ARENA_COLLATERAL_ADDRESS=0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948
EOF
    echo "  ✅ Created backend/.env"
else
    echo "  ⏭️ backend/.env already exists"
fi

# Frontend .env
if [ ! -f "$PROJECT_ROOT/frontend/.env" ]; then
    # Get the preview URL from existing env or use default
    PREVIEW_URL=${REACT_APP_BACKEND_URL:-"http://localhost:8001"}
    cat > "$PROJECT_ROOT/frontend/.env" << EOF
NEXT_PUBLIC_API_URL=${PREVIEW_URL}
NEXT_PUBLIC_CHAIN_ID=97
NEXT_PUBLIC_ONCHAIN_ENABLED=true
NEXT_PUBLIC_CONTRACT_ADDRESS=0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e
NEXT_PUBLIC_STABLE_TOKEN=0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948
EOF
    echo "  ✅ Created frontend/.env"
else
    echo "  ⏭️ frontend/.env already exists"
fi

# Indexer .env
if [ ! -f "$PROJECT_ROOT/arena-indexer/.env" ]; then
    # Get current block for start
    CURRENT_BLOCK=$(curl -s -X POST https://bsc-testnet.publicnode.com \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        | python3 -c "import sys,json; print(int(json.load(sys.stdin).get('result','0x0'), 16) - 10000)" 2>/dev/null || echo "97400000")
    
    cat > "$PROJECT_ROOT/arena-indexer/.env" << EOF
RPC_URL=https://bsc-testnet.publicnode.com
CONTRACT_ADDRESS=0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e
STABLE_TOKEN=0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948
MONGO_URI=mongodb://localhost:27017/fomo_arena
CHAIN_ID=97
CONFIRMATIONS=3
START_BLOCK=${CURRENT_BLOCK}
BACKEND_URL=http://localhost:4001
EOF
    echo "  ✅ Created arena-indexer/.env (START_BLOCK=${CURRENT_BLOCK})"
else
    echo "  ⏭️ arena-indexer/.env already exists"
fi

echo ""

# ==================== STEP 3: Install Dependencies ====================
echo -e "${YELLOW}[3/7] Installing dependencies...${NC}"

# Backend
echo "  📦 Installing backend dependencies..."
cd "$PROJECT_ROOT/backend"
npm install --silent 2>/dev/null || npm install
echo "  ✅ Backend dependencies installed"

# Frontend
echo "  📦 Installing frontend dependencies..."
cd "$PROJECT_ROOT/frontend"
yarn install --silent 2>/dev/null || yarn install
echo "  ✅ Frontend dependencies installed"

# Indexer
echo "  📦 Installing indexer dependencies..."
cd "$PROJECT_ROOT/arena-indexer"
npm install --silent 2>/dev/null || npm install
echo "  ✅ Indexer dependencies installed"

# Python dependencies
echo "  📦 Installing Python dependencies..."
pip install httpx fastapi uvicorn --quiet 2>/dev/null || pip install httpx fastapi uvicorn
echo "  ✅ Python dependencies installed"

cd "$PROJECT_ROOT"
echo ""

# ==================== STEP 4: Build Projects ====================
echo -e "${YELLOW}[4/7] Building projects...${NC}"

# Backend build (optional, ts-node runs directly)
echo "  🔨 Backend uses ts-node (no build required)"

# Frontend build check
echo "  🔨 Frontend will be built on first run"

echo ""

# ==================== STEP 5: Setup Supervisor ====================
echo -e "${YELLOW}[5/7] Checking supervisor configuration...${NC}"

# Check if supervisor is available
if command -v supervisorctl &> /dev/null; then
    # Check if indexer config exists
    if [ ! -f "/etc/supervisor/conf.d/indexer.conf" ]; then
        echo "  📝 Creating indexer supervisor config..."
        sudo tee /etc/supervisor/conf.d/indexer.conf > /dev/null << 'EOF'
[program:indexer]
command=npx ts-node src/main.ts
directory=/app/arena-indexer
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/indexer.err.log
stdout_logfile=/var/log/supervisor/indexer.out.log
stopsignal=TERM
stopwaitsecs=10
EOF
        echo "  ✅ Indexer config created"
        sudo supervisorctl reread
        sudo supervisorctl update
    else
        echo "  ⏭️ Indexer config already exists"
    fi
else
    echo "  ⚠️ Supervisor not found, services will need manual start"
fi

echo ""

# ==================== STEP 6: Start Services ====================
echo -e "${YELLOW}[6/7] Starting services...${NC}"

if command -v supervisorctl &> /dev/null; then
    echo "  🔄 Restarting all services..."
    sudo supervisorctl restart backend frontend indexer 2>/dev/null || true
    sleep 5
    
    echo "  📊 Service status:"
    sudo supervisorctl status
else
    echo "  ⚠️ Please start services manually:"
    echo "     Backend: cd /app/backend && npm run start:dev"
    echo "     Frontend: cd /app/frontend && yarn dev"
    echo "     Indexer: cd /app/arena-indexer && npx ts-node src/main.ts"
fi

echo ""

# ==================== STEP 7: Verify ====================
echo -e "${YELLOW}[7/7] Verifying deployment...${NC}"

sleep 5

# Check backend health
BACKEND_URL="http://localhost:8001"
echo "  🔍 Checking backend..."
for i in {1..10}; do
    if curl -s "$BACKEND_URL/api/health" | grep -q "ok"; then
        echo "  ✅ Backend is healthy"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "  ${RED}❌ Backend health check failed${NC}"
    fi
    sleep 2
done

# Check frontend
echo "  🔍 Checking frontend..."
if curl -s "http://localhost:3000" -o /dev/null -w "%{http_code}" | grep -q "200"; then
    echo "  ✅ Frontend is running"
else
    echo -e "  ${YELLOW}⚠️ Frontend may still be starting...${NC}"
fi

# Check indexer
echo "  🔍 Checking indexer..."
if curl -s "$BACKEND_URL/api/onchain/indexer/status" | grep -q "isRunning"; then
    echo "  ✅ Indexer is syncing"
else
    echo -e "  ${YELLOW}⚠️ Indexer may still be starting...${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}🎉 FOMO Arena Bootstrap Complete!${NC}"
echo "========================================"
echo ""
echo "📍 Services:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8001"
echo "   API Docs: http://localhost:8001/api/docs"
echo ""
echo "📊 Useful commands:"
echo "   Check status:  sudo supervisorctl status"
echo "   View logs:     tail -f /var/log/supervisor/*.log"
echo "   Restart all:   sudo supervisorctl restart all"
echo ""
echo "🔗 Contract Info:"
echo "   Network:  BSC Testnet (Chain ID: 97)"
echo "   Contract: 0x7Fcaa9aF01ee4Ab2fa6C2fb670ff58c673AefC8e"
echo "   Token:    0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948"
echo ""
