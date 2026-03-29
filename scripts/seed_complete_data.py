"""
FOMO Arena - Complete Seed Data
Creates predictions, positions, users for testing full flow
"""
from pymongo import MongoClient
from datetime import datetime, timedelta
import random
import uuid

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017")
db = client.fomo_arena

print("=== FOMO Arena Seed Data ===\n")

# Clear old data
print("Clearing existing data...")
db.predictions.delete_many({})
db.positions.delete_many({})
db.users.delete_many({})
db.ledger.delete_many({})
db.notifications.delete_many({})
print("Done\n")

# Generate test wallets
test_wallets = [
    "0x" + "".join(random.choices("0123456789abcdef", k=40)) for _ in range(10)
]
demo_wallet = "0xdemo1234567890abcdef1234567890abcdef12345678"
test_wallets.insert(0, demo_wallet)

# Create users
print("Creating users...")
users = []
for i, wallet in enumerate(test_wallets):
    users.append({
        "wallet": wallet.lower(),
        "username": f"Trader{i}" if i > 0 else "DemoTrader",
        "balanceUsdt": random.randint(500, 5000) if i > 0 else 10000,
        "isDemo": i == 0,
        "totalBets": random.randint(5, 50),
        "totalWins": random.randint(2, 25),
        "totalVolume": random.randint(1000, 10000),
        "createdAt": datetime.utcnow() - timedelta(days=random.randint(1, 30)),
    })
db.users.insert_many(users)
print(f"Created {len(users)} users")

# Create predictions (markets)
print("\nCreating predictions (markets)...")
predictions = [
    {
        "question": "Will BTC reach $150,000 by end of Q1 2026?",
        "description": "Bitcoin price prediction based on historical halving cycles and institutional adoption trends.",
        "type": "single",
        "outcomes": [
            {"id": "yes", "label": "Yes", "probability": 65, "yesMultiplier": 1.54, "noMultiplier": 2.86},
            {"id": "no", "label": "No", "probability": 35, "yesMultiplier": 2.86, "noMultiplier": 1.54}
        ],
        "category": "crypto",
        "riskLevel": "high",
        "closeTime": datetime.utcnow() + timedelta(days=60),
        "status": "published",
        "createdBy": demo_wallet.lower(),
        "totalVolume": 12500,
        "totalBets": 85,
    },
    {
        "question": "Will ETH surpass $10,000 in 2026?",
        "description": "Ethereum price prediction considering Layer 2 scaling and DeFi growth.",
        "type": "single",
        "outcomes": [
            {"id": "yes", "label": "Yes", "probability": 55, "yesMultiplier": 1.82, "noMultiplier": 2.22},
            {"id": "no", "label": "No", "probability": 45, "yesMultiplier": 2.22, "noMultiplier": 1.82}
        ],
        "category": "crypto",
        "riskLevel": "medium",
        "closeTime": datetime.utcnow() + timedelta(days=90),
        "status": "published",
        "createdBy": test_wallets[1].lower(),
        "totalVolume": 8500,
        "totalBets": 62,
    },
    {
        "question": "Will AI token market cap exceed $100B by June 2026?",
        "description": "Prediction on total market capitalization of AI-focused cryptocurrencies.",
        "type": "single",
        "outcomes": [
            {"id": "yes", "label": "Yes", "probability": 70, "yesMultiplier": 1.43, "noMultiplier": 3.33},
            {"id": "no", "label": "No", "probability": 30, "yesMultiplier": 3.33, "noMultiplier": 1.43}
        ],
        "category": "ai",
        "riskLevel": "high",
        "closeTime": datetime.utcnow() + timedelta(days=45),
        "status": "published",
        "createdBy": test_wallets[2].lower(),
        "totalVolume": 15800,
        "totalBets": 124,
    },
    {
        "question": "Will Solana reach new ATH by end of March 2026?",
        "description": "Solana price prediction based on network growth and DeFi TVL.",
        "type": "single",
        "outcomes": [
            {"id": "yes", "label": "Yes", "probability": 48, "yesMultiplier": 2.08, "noMultiplier": 1.92},
            {"id": "no", "label": "No", "probability": 52, "yesMultiplier": 1.92, "noMultiplier": 2.08}
        ],
        "category": "crypto",
        "riskLevel": "medium",
        "closeTime": datetime.utcnow() + timedelta(days=7),
        "status": "published",
        "createdBy": demo_wallet.lower(),
        "totalVolume": 6200,
        "totalBets": 48,
    },
    {
        "question": "Will BNB Chain TVL exceed $20B in Q2 2026?",
        "description": "Total Value Locked prediction for BNB Chain ecosystem.",
        "type": "single",
        "outcomes": [
            {"id": "yes", "label": "Yes", "probability": 40, "yesMultiplier": 2.5, "noMultiplier": 1.67},
            {"id": "no", "label": "No", "probability": 60, "yesMultiplier": 1.67, "noMultiplier": 2.5}
        ],
        "category": "defi",
        "riskLevel": "low",
        "closeTime": datetime.utcnow() + timedelta(days=120),
        "status": "published",
        "createdBy": test_wallets[3].lower(),
        "totalVolume": 4300,
        "totalBets": 31,
    },
]

inserted_predictions = db.predictions.insert_many(predictions)
prediction_ids = inserted_predictions.inserted_ids
print(f"Created {len(predictions)} predictions")

# Create positions
print("\nCreating positions...")
positions = []
for idx, pred_id in enumerate(prediction_ids):
    num_positions = random.randint(5, 20)
    for i in range(num_positions):
        wallet = random.choice(test_wallets).lower()
        outcome_id = "yes" if random.random() > 0.4 else "no"
        stake = random.randint(10, 200)
        odds = random.uniform(1.3, 3.5)
        
        positions.append({
            "marketId": str(pred_id),
            "predictionId": str(pred_id),
            "wallet": wallet,
            "outcomeId": outcome_id,
            "outcomeLabel": "Yes" if outcome_id == "yes" else "No",
            "stake": stake,
            "odds": round(odds, 2),
            "potentialReturn": round(stake * odds, 2),
            "status": "open",
            "createdAt": datetime.utcnow() - timedelta(hours=random.randint(1, 72)),
        })

db.positions.insert_many(positions)
print(f"Created {len(positions)} positions")

# Create demo user positions specifically
print("\nCreating demo user positions...")
demo_positions = []
for idx, pred_id in enumerate(prediction_ids[:3]):
    outcome_id = "yes" if idx % 2 == 0 else "no"
    stake = random.randint(50, 150)
    odds = random.uniform(1.5, 2.5)
    
    demo_positions.append({
        "marketId": str(pred_id),
        "predictionId": str(pred_id),
        "wallet": demo_wallet.lower(),
        "outcomeId": outcome_id,
        "outcomeLabel": "Yes" if outcome_id == "yes" else "No",
        "stake": stake,
        "odds": round(odds, 2),
        "potentialReturn": round(stake * odds, 2),
        "status": "open",
        "createdAt": datetime.utcnow() - timedelta(hours=random.randint(1, 24)),
    })

if demo_positions:
    db.positions.insert_many(demo_positions)
    print(f"Created {len(demo_positions)} demo user positions")

# Create ledger entries
print("\nCreating ledger entries...")
ledger_entries = []
for pos in positions[:30]:
    ledger_entries.append({
        "wallet": pos["wallet"],
        "type": "bet",
        "amount": -pos["stake"],
        "balanceAfter": random.randint(100, 5000),
        "reference": str(pos.get("_id", "")),
        "description": f"Bet on market",
        "createdAt": pos["createdAt"],
    })

if ledger_entries:
    db.ledger.insert_many(ledger_entries)
    print(f"Created {len(ledger_entries)} ledger entries")

# Create notifications
print("\nCreating notifications...")
notifications = []
for wallet in test_wallets[:5]:
    notifications.append({
        "wallet": wallet.lower(),
        "type": "POSITION_CREATED",
        "title": "Position Created",
        "message": "Your bet has been placed successfully!",
        "read": random.choice([True, False]),
        "createdAt": datetime.utcnow() - timedelta(hours=random.randint(1, 48)),
    })
    
    if random.random() > 0.5:
        notifications.append({
            "wallet": wallet.lower(),
            "type": "XP_EARNED",
            "title": "XP Earned!",
            "message": f"You earned {random.randint(10, 50)} XP for placing a bet!",
            "read": False,
            "createdAt": datetime.utcnow() - timedelta(hours=random.randint(1, 24)),
        })

db.notifications.insert_many(notifications)
print(f"Created {len(notifications)} notifications")

# Summary
print("\n" + "="*50)
print("SEED DATA COMPLETE!")
print("="*50)
print(f"\n✅ Users: {len(users)}")
print(f"✅ Predictions (Markets): {len(predictions)}")
print(f"✅ Positions: {len(positions) + len(demo_positions)}")
print(f"✅ Ledger entries: {len(ledger_entries)}")
print(f"✅ Notifications: {len(notifications)}")
print(f"\n🔑 Demo Wallet: {demo_wallet}")
print(f"   Balance: 10000 USDT")
print("\n🎮 You can now test the full flow!")
