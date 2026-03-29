#!/usr/bin/env python3
"""
Seed script for discussions - creates sample discussions for testing
"""
import requests
import json
import sys

API_URL = sys.argv[1] if len(sys.argv) > 1 else "https://ba85e5cb-63d7-4161-91f5-e5abf3de2b2a.preview.emergentagent.com"

# Sample discussions data
DISCUSSIONS = [
    {
        "wallet": "0x1234567890abcdef1234567890abcdef12345678",
        "title": "BTC to $150K by Q2 2026? Analysis of Current Market Trends",
        "content": "Looking at the current market dynamics, institutional adoption, and the upcoming halving effects still playing out, I believe we could see BTC reach $150K by Q2 2026. What are your thoughts?",
        "tags": ["Market", "Analytics", "Blockchain"]
    },
    {
        "wallet": "0xabcdef1234567890abcdef1234567890abcdef12",
        "title": "Is AI Integration in DeFi Protocols the Next Big Thing?",
        "content": "We're seeing more DeFi protocols integrate AI for risk assessment and yield optimization. Projects like this could revolutionize how we interact with DeFi. Discuss!",
        "tags": ["AI", "DeFi", "Strategy"]
    },
    {
        "wallet": "0x9876543210fedcba9876543210fedcba98765432",
        "title": "Top 5 Upcoming Airdrops to Watch in 2026",
        "content": "Here's my list of the most promising airdrops coming up:\n1. LayerZero V2\n2. Scroll\n3. zkSync Era expansions\n4. Linea\n5. Blast L2\n\nWhat would you add?",
        "tags": ["Airdrops", "Strategy", "Invests"]
    },
    {
        "wallet": "0xfedcba9876543210fedcba9876543210fedcba98",
        "title": "NFT Market Recovery: Blue Chips Leading the Way",
        "content": "After the prolonged bear market, we're finally seeing some recovery in blue chip NFTs. BAYC, Pudgy Penguins, and Azuki are all showing strong momentum. Is this the start of NFT summer 2.0?",
        "tags": ["NFTs", "Market", "Invests"]
    },
    {
        "wallet": "0x5555555555555555555555555555555555555555",
        "title": "Warning: New Phishing Scam Targeting MetaMask Users",
        "content": "⚠️ PSA: There's a new sophisticated phishing scam circulating via Twitter DMs. They're impersonating official MetaMask support. Never share your seed phrase! Report suspicious accounts.",
        "tags": ["Scam", "Blockchain"]
    }
]

def seed_discussions():
    print("🌱 Seeding discussions...")
    
    for disc in DISCUSSIONS:
        try:
            response = requests.post(
                f"{API_URL}/api/discussions",
                headers={
                    "Content-Type": "application/json",
                    "x-wallet-address": disc["wallet"]
                },
                json={
                    "title": disc["title"],
                    "content": disc["content"],
                    "tags": disc["tags"]
                }
            )
            
            if response.status_code == 201 or response.status_code == 200:
                data = response.json()
                print(f"✅ Created: {disc['title'][:50]}...")
            else:
                print(f"❌ Failed: {disc['title'][:50]}... - {response.status_code}")
                print(response.text)
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n✨ Seeding complete!")
    
    # Verify
    response = requests.get(f"{API_URL}/api/discussions?limit=10")
    data = response.json()
    print(f"📊 Total discussions: {data.get('total', len(data.get('data', [])))}")

if __name__ == "__main__":
    seed_discussions()
