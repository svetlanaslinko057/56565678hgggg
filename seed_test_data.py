"""Seed test data for FOMO Arena testing"""
import asyncio
from pymongo import MongoClient
from datetime import datetime, timedelta
import random

client = MongoClient("mongodb://localhost:27017")
db = client.fomo_arena

# Clear existing test data
db.markets_mirror.delete_many({})
db.positions_mirror.delete_many({})
db.activities.delete_many({})

# Create test markets
markets = [
    {
        "marketId": 1,
        "question": "Will BTC reach $100k by end of Q1 2026?",
        "status": "active",
        "outcomes": [{"id": 1, "name": "YES"}, {"id": 2, "name": "NO"}],
        "totalVolume": "5000000000000000000000",  # 5000 USDT
        "totalBets": 45,
        "category": "Crypto",
        "closeTime": (datetime.utcnow() + timedelta(days=30)).isoformat(),
        "createdAt": datetime.utcnow(),
    },
    {
        "marketId": 2,
        "question": "Will ETH 2.0 fully launch in 2026?",
        "status": "active",
        "outcomes": [{"id": 1, "name": "YES"}, {"id": 2, "name": "NO"}],
        "totalVolume": "2500000000000000000000",  # 2500 USDT
        "totalBets": 28,
        "category": "Crypto",
        "closeTime": (datetime.utcnow() + timedelta(days=60)).isoformat(),
        "createdAt": datetime.utcnow(),
    },
    {
        "marketId": 3,
        "question": "Will AI token market cap exceed $50B?",
        "status": "active",
        "outcomes": [{"id": 1, "name": "YES"}, {"id": 2, "name": "NO"}],
        "totalVolume": "8000000000000000000000",  # 8000 USDT - trending
        "totalBets": 120,
        "category": "AI",
        "closeTime": (datetime.utcnow() + timedelta(days=45)).isoformat(),
        "createdAt": datetime.utcnow(),
    },
]

db.markets_mirror.insert_many(markets)
print(f"Created {len(markets)} markets")

# Create positions for market 3 (trending market)
positions = []
wallets = [f"0x{''.join(random.choices('0123456789abcdef', k=40))}" for _ in range(30)]

# More YES bets (bullish trend)
for i in range(20):
    positions.append({
        "tokenId": i + 1,
        "marketId": 3,
        "owner": wallets[i % len(wallets)],
        "outcome": 1,  # YES
        "amount": str(random.randint(100, 500) * 10**18),
        "status": "open",
        "createdAt": datetime.utcnow() - timedelta(minutes=random.randint(0, 10)),
    })

for i in range(5):
    positions.append({
        "tokenId": 20 + i + 1,
        "marketId": 3,
        "owner": wallets[(20 + i) % len(wallets)],
        "outcome": 2,  # NO
        "amount": str(random.randint(50, 200) * 10**18),
        "status": "open",
        "createdAt": datetime.utcnow() - timedelta(minutes=random.randint(0, 10)),
    })

db.positions_mirror.insert_many(positions)
print(f"Created {len(positions)} positions for market 3")

# Create recent activities (last 5 min) for FOMO effect
activities = []
for i in range(15):
    activities.append({
        "type": "BET",
        "marketId": 3,
        "user": wallets[i % len(wallets)],
        "amount": str(random.randint(100, 500) * 10**18),
        "outcome": 1 if random.random() > 0.3 else 2,
        "createdAt": datetime.utcnow() - timedelta(minutes=random.randint(0, 4)),
    })

db.activities.insert_many(activities)
print(f"Created {len(activities)} recent activities")

# Add positions for markets 1 and 2
positions_1_2 = []
for market_id in [1, 2]:
    for i in range(10):
        positions_1_2.append({
            "tokenId": 100 + market_id * 20 + i,
            "marketId": market_id,
            "owner": wallets[i % len(wallets)],
            "outcome": 1 if random.random() > 0.5 else 2,
            "amount": str(random.randint(50, 300) * 10**18),
            "status": "open",
            "createdAt": datetime.utcnow() - timedelta(hours=random.randint(1, 24)),
        })

db.positions_mirror.insert_many(positions_1_2)
print(f"Created {len(positions_1_2)} positions for markets 1 and 2")

print("\n✅ Test data seeded successfully!")
print("Market 3 should show HIGH activity and BULLISH trend")
