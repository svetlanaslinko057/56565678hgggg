#!/usr/bin/env python3
"""
FOMO Arena Rivals System Integration Test
Tests rivalry updates after duel resolution and streak tracking
"""

import requests
import sys
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

class RivalsIntegrationTester:
    def __init__(self, base_url: str = "https://b8f41f9c-0691-4c5e-ab7e-ea96241f853c.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test wallets for rivalry testing
        self.alice_wallet = "0xAlice111111111111111111111111111111111"
        self.bob_wallet = "0xBob22222222222222222222222222222222222"
        self.charlie_wallet = "0xCharlie333333333333333333333333333333"

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED")
        else:
            print(f"❌ {name}: FAILED - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> tuple[bool, Dict, int]:
        """Make HTTP request and return success, response, status_code"""
        url = f"{self.base_url}/api/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=10)
            else:
                return False, {"error": "Unsupported method"}, 0
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}
            
            return response.status_code < 400, response_data, response.status_code
        except Exception as e:
            return False, {"error": str(e)}, 0

    def test_rivalry_creation_and_updates(self):
        """Test that rivalries are created and updated correctly after duels"""
        print(f"\n🔍 Testing rivalry creation and updates")
        
        # Get initial head-to-head stats
        success, initial_response, status = self.make_request('GET', f'rivals/{self.alice_wallet}/{self.bob_wallet}')
        
        if not success:
            self.log_test("Rivalry creation and updates", False, f"Failed to get initial h2h: {status}", initial_response)
            return
        
        initial_data = initial_response.get('data', {})
        initial_total_duels = initial_data.get('totalDuels', 0)
        initial_alice_wins = initial_data.get('wins', 0)
        initial_alice_losses = initial_data.get('losses', 0)
        
        print(f"Initial stats - Total duels: {initial_total_duels}, Alice wins: {initial_alice_wins}, Alice losses: {initial_alice_losses}")
        
        # Create a duel
        duel_data = {
            "marketId": f"rivalry-integration-test-{int(time.time())}",
            "predictionId": "test-prediction-123",
            "predictionTitle": "Test Rivalry Prediction",
            "side": "yes",
            "stakeAmount": 15,
            "opponentWallet": self.bob_wallet
        }
        
        headers = {'x-wallet-address': self.alice_wallet}
        success, duel_response, status = self.make_request('POST', 'duels', duel_data, headers)
        
        if not success:
            self.log_test("Rivalry creation and updates", False, f"Failed to create duel: {status}", duel_response)
            return
        
        duel_id = duel_response.get('data', {}).get('id')
        if not duel_id:
            self.log_test("Rivalry creation and updates", False, "No duel ID returned", duel_response)
            return
        
        print(f"Created duel: {duel_id}")
        
        # Accept the duel
        headers = {'x-wallet-address': self.bob_wallet}
        success, accept_response, status = self.make_request('POST', f'duels/{duel_id}/accept', {}, headers)
        
        if not success:
            self.log_test("Rivalry creation and updates", False, f"Failed to accept duel: {status}", accept_response)
            return
        
        print(f"Duel accepted by Bob")
        
        # Resolve the duel (Alice wins)
        resolve_data = {"winningOutcome": "yes"}
        success, resolve_response, status = self.make_request('POST', f'duels/resolve-market/{duel_data["marketId"]}', resolve_data)
        
        if not success:
            self.log_test("Rivalry creation and updates", False, f"Failed to resolve duel: {status}", resolve_response)
            return
        
        print(f"Duel resolved with outcome: yes (Alice wins)")
        
        # Wait a moment for rivalry update
        time.sleep(1)
        
        # Get updated head-to-head stats
        success, updated_response, status = self.make_request('GET', f'rivals/{self.alice_wallet}/{self.bob_wallet}')
        
        if not success:
            self.log_test("Rivalry creation and updates", False, f"Failed to get updated h2h: {status}", updated_response)
            return
        
        updated_data = updated_response.get('data', {})
        updated_total_duels = updated_data.get('totalDuels', 0)
        updated_alice_wins = updated_data.get('wins', 0)
        updated_alice_losses = updated_data.get('losses', 0)
        
        print(f"Updated stats - Total duels: {updated_total_duels}, Alice wins: {updated_alice_wins}, Alice losses: {updated_alice_losses}")
        
        # Verify the rivalry was updated correctly
        if updated_total_duels != initial_total_duels + 1:
            self.log_test("Rivalry creation and updates", False, f"Total duels not incremented correctly: {updated_total_duels} vs {initial_total_duels + 1}", updated_response)
            return
        
        if updated_alice_wins != initial_alice_wins + 1:
            self.log_test("Rivalry creation and updates", False, f"Alice wins not incremented: {updated_alice_wins} vs {initial_alice_wins + 1}", updated_response)
            return
        
        if updated_alice_losses != initial_alice_losses:
            self.log_test("Rivalry creation and updates", False, f"Alice losses changed unexpectedly: {updated_alice_losses} vs {initial_alice_losses}", updated_response)
            return
        
        self.log_test("Rivalry creation and updates", True, f"Rivalry correctly updated after duel resolution", updated_response)

    def test_streak_tracking(self):
        """Test that streak tracking works correctly"""
        print(f"\n🔍 Testing streak tracking")
        
        # Get current head-to-head to check streak
        success, response, status = self.make_request('GET', f'rivals/{self.alice_wallet}/{self.bob_wallet}')
        
        if not success:
            self.log_test("Streak tracking", False, f"Failed to get h2h for streak test: {status}", response)
            return
        
        data = response.get('data', {})
        current_streak_wallet = data.get('currentStreakWallet')
        current_streak_count = data.get('currentStreakCount', 0)
        
        print(f"Current streak: {current_streak_wallet} with {current_streak_count} wins")
        
        # Verify streak logic
        if current_streak_count > 0:
            if not current_streak_wallet:
                self.log_test("Streak tracking", False, "Streak count > 0 but no streak wallet", response)
                return
            
            if current_streak_wallet.lower() not in [self.alice_wallet.lower(), self.bob_wallet.lower()]:
                self.log_test("Streak tracking", False, f"Invalid streak wallet: {current_streak_wallet}", response)
                return
        
        # Check dominance text includes streak info for long streaks
        dominance_text = data.get('dominanceText', '')
        if current_streak_count >= 3:
            if 'streak' not in dominance_text.lower():
                self.log_test("Streak tracking", False, f"Dominance text should mention streak for count >= 3: {dominance_text}", response)
                return
        
        self.log_test("Streak tracking", True, f"Streak tracking working correctly", response)

    def test_rivalry_summary(self):
        """Test rivalry summary endpoint"""
        print(f"\n🔍 Testing rivalry summary")
        
        headers = {'x-wallet-address': self.alice_wallet}
        success, response, status = self.make_request('GET', 'rivals/summary', headers=headers)
        
        if not success:
            self.log_test("Rivalry summary", False, f"Failed to get rivalry summary: {status}", response)
            return
        
        data = response.get('data', {})
        
        # Check all required fields
        required_fields = ['totalRivals', 'totalRivalryDuels', 'dominatedCount', 'dominatedByCount', 'longestStreak', 'topRival', 'nemesis']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            self.log_test("Rivalry summary", False, f"Missing fields in summary: {missing_fields}", response)
            return
        
        # Validate data types and logic
        if not isinstance(data['totalRivals'], int) or data['totalRivals'] < 0:
            self.log_test("Rivalry summary", False, f"Invalid totalRivals: {data['totalRivals']}", response)
            return
        
        if not isinstance(data['totalRivalryDuels'], int) or data['totalRivalryDuels'] < 0:
            self.log_test("Rivalry summary", False, f"Invalid totalRivalryDuels: {data['totalRivalryDuels']}", response)
            return
        
        # Check that dominated counts make sense
        total_rivals = data['totalRivals']
        dominated_count = data['dominatedCount']
        dominated_by_count = data['dominatedByCount']
        
        if dominated_count + dominated_by_count > total_rivals:
            self.log_test("Rivalry summary", False, f"Dominated counts exceed total rivals: {dominated_count} + {dominated_by_count} > {total_rivals}", response)
            return
        
        print(f"Summary: {total_rivals} rivals, {data['totalRivalryDuels']} duels, dominating {dominated_count}, dominated by {dominated_by_count}")
        
        self.log_test("Rivalry summary", True, f"Rivalry summary working correctly", response)

    def test_dominance_calculation(self):
        """Test dominance calculation in head-to-head"""
        print(f"\n🔍 Testing dominance calculation")
        
        success, response, status = self.make_request('GET', f'rivals/{self.alice_wallet}/{self.bob_wallet}')
        
        if not success:
            self.log_test("Dominance calculation", False, f"Failed to get h2h for dominance test: {status}", response)
            return
        
        data = response.get('data', {})
        wins = data.get('wins', 0)
        losses = data.get('losses', 0)
        dominance_text = data.get('dominanceText', '')
        
        print(f"Alice vs Bob: {wins}-{losses}, dominance: {dominance_text}")
        
        # Verify dominance logic
        if wins > losses * 2:
            if 'dominate' not in dominance_text.lower():
                self.log_test("Dominance calculation", False, f"Should show domination for {wins}-{losses}: {dominance_text}", response)
                return
        elif losses > wins * 2:
            if 'dominate' not in dominance_text.lower():
                self.log_test("Dominance calculation", False, f"Should show being dominated for {wins}-{losses}: {dominance_text}", response)
                return
        elif wins > losses:
            if 'edge' not in dominance_text.lower() and 'streak' not in dominance_text.lower():
                self.log_test("Dominance calculation", False, f"Should show having edge for {wins}-{losses}: {dominance_text}", response)
                return
        elif losses > wins:
            if 'edge' not in dominance_text.lower() and 'streak' not in dominance_text.lower():
                self.log_test("Dominance calculation", False, f"Should show them having edge for {wins}-{losses}: {dominance_text}", response)
                return
        else:
            if 'even' not in dominance_text.lower() and 'streak' not in dominance_text.lower():
                self.log_test("Dominance calculation", False, f"Should show evenly matched for {wins}-{losses}: {dominance_text}", response)
                return
        
        self.log_test("Dominance calculation", True, f"Dominance calculation working correctly", response)

    def run_all_tests(self):
        """Run all rivals integration tests"""
        print("🚀 Starting FOMO Arena Rivals System Integration Tests")
        print(f"Base URL: {self.base_url}")
        print(f"Test wallets: Alice={self.alice_wallet}, Bob={self.bob_wallet}")
        
        # Test all functionality
        self.test_rivalry_creation_and_updates()
        self.test_streak_tracking()
        self.test_rivalry_summary()
        self.test_dominance_calculation()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = RivalsIntegrationTester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": tester.tests_run,
        "passed_tests": tester.tests_passed,
        "failed_tests": tester.tests_run - tester.tests_passed,
        "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0,
        "test_details": tester.test_results
    }
    
    with open('/app/test_reports/rivals_integration_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())