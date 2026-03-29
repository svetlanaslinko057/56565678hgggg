#!/usr/bin/env python3
"""
Test to check existing duels and debug resolution
"""

import requests
import sys
import json

def check_duels():
    base_url = "https://b8f41f9c-0691-4c5e-ab7e-ea96241f853c.preview.emergentagent.com"
    alice_wallet = "0xAlice111111111111111111111111111111111"
    
    print("🔍 Checking existing duels")
    
    # Get Alice's duels
    headers = {'x-wallet-address': alice_wallet}
    response = requests.get(f"{base_url}/api/duels/history", headers=headers)
    
    if response.status_code == 200:
        duels_data = response.json()
        print(f"Response structure: {json.dumps(duels_data, indent=2)}")
        
        # Handle different response structures
        if 'data' in duels_data:
            if isinstance(duels_data['data'], dict) and 'data' in duels_data['data']:
                duels = duels_data['data']['data']
            elif isinstance(duels_data['data'], list):
                duels = duels_data['data']
            else:
                duels = []
        else:
            duels = []
        
        print(f"Found {len(duels)} duels for Alice")
        
        # Show recent duels
        for i, duel in enumerate(duels[:5]):
            print(f"\nDuel {i+1}:")
            print(f"  ID: {duel.get('id', duel.get('_id'))}")
            print(f"  Market: {duel.get('marketId')}")
            print(f"  Status: {duel.get('status')}")
            print(f"  Creator: {duel.get('creatorWallet')}")
            print(f"  Opponent: {duel.get('opponentWallet')}")
            print(f"  Creator Side: {duel.get('creatorSide')}")
            print(f"  Total Pot: {duel.get('totalPot')}")
    else:
        print(f"Failed to get duels: {response.status_code} - {response.text}")

if __name__ == "__main__":
    check_duels()