#!/usr/bin/env python3
"""
Simple test to debug duel resolution issue
"""

import requests
import sys
import json
import time

def test_duel_resolution():
    base_url = "https://b8f41f9c-0691-4c5e-ab7e-ea96241f853c.preview.emergentagent.com"
    alice_wallet = "0xAlice111111111111111111111111111111111"
    bob_wallet = "0xBob22222222222222222222222222222222222"
    
    print("🔍 Testing duel resolution debug")
    
    # Create a duel
    duel_data = {
        "marketId": f"debug-test-{int(time.time())}",
        "predictionId": "debug-prediction-123",
        "predictionTitle": "Debug Test Prediction",
        "side": "yes",
        "stakeAmount": 10,
        "opponentWallet": bob_wallet
    }
    
    headers = {
        'Content-Type': 'application/json',
        'x-wallet-address': alice_wallet
    }
    
    # Create duel
    response = requests.post(f"{base_url}/api/duels", json=duel_data, headers=headers)
    print(f"Create duel response: {response.status_code}")
    if response.status_code != 201:
        print(f"Failed to create duel: {response.text}")
        return
    
    duel_response = response.json()
    duel_id = duel_response.get('data', {}).get('id')
    print(f"Created duel: {duel_id}")
    
    # Accept duel
    headers['x-wallet-address'] = bob_wallet
    response = requests.post(f"{base_url}/api/duels/{duel_id}/accept", json={}, headers=headers)
    print(f"Accept duel response: {response.status_code}")
    if response.status_code != 200:
        print(f"Failed to accept duel: {response.text}")
        return
    
    print("Duel accepted")
    
    # Get duel details before resolution
    response = requests.get(f"{base_url}/api/duels/{duel_id}")
    if response.status_code == 200:
        duel_details = response.json()
        print(f"Duel details before resolution: {json.dumps(duel_details, indent=2)}")
    
    # Resolve duel
    resolve_data = {"winningOutcome": "yes"}
    response = requests.post(f"{base_url}/api/duels/resolve-market/{duel_data['marketId']}", json=resolve_data)
    print(f"Resolve duel response: {response.status_code}")
    print(f"Resolve response: {response.text}")
    
    if response.status_code == 200:
        print("✅ Duel resolved successfully")
    else:
        print(f"❌ Duel resolution failed: {response.text}")

if __name__ == "__main__":
    test_duel_resolution()