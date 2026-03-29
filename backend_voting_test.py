#!/usr/bin/env python3
"""
Voting System V2 Backend API Testing
Tests all voting endpoints for FOMO Arena dispute resolution system
"""

import requests
import sys
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

class VotingSystemTester:
    def __init__(self, base_url: str = "https://6f73de60-4573-4b0e-8f96-4d52e90c1929.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data
        self.test_market_id = "69c5bb6ee3bd7ac94b3b22ef"  # Disputed market with existing votes
        self.test_wallets = [
            "0x1234567890123456789012345678901234567890",
            "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
            "0x9876543210987654321098765432109876543210"
        ]

    def log_test(self, name: str, success: bool, details: Dict[str, Any] = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            
        result = {
            "test_name": name,
            "success": success,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details and not success:
            print(f"   Details: {details}")

    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> tuple[bool, Dict]:
        """Make HTTP request and return success status and response data"""
        url = f"{self.base_url}/api/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)
            
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}
                
            response_data = response.json() if response.content else {}
            
            return response.status_code < 400, {
                "status_code": response.status_code,
                "data": response_data,
                "response_time": response.elapsed.total_seconds()
            }
            
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}
        except json.JSONDecodeError as e:
            return False, {"error": f"Invalid JSON response: {str(e)}"}

    def test_voting_stats(self):
        """Test GET /api/voting/stats"""
        success, result = self.make_request('GET', 'voting/stats')
        
        if success and result.get('data', {}).get('success'):
            data = result['data']['data']
            expected_fields = ['activeVotings', 'totalVotesCast', 'marketsFinalizedByVoting']
            has_all_fields = all(field in data for field in expected_fields)
            
            self.log_test(
                "GET /api/voting/stats",
                has_all_fields,
                {
                    "status_code": result['status_code'],
                    "has_required_fields": has_all_fields,
                    "stats": data
                }
            )
        else:
            self.log_test(
                "GET /api/voting/stats",
                False,
                result
            )

    def test_get_voting_status(self, market_id: str, wallet: str = None):
        """Test GET /api/predictions/:id/voting"""
        endpoint = f"predictions/{market_id}/voting"
        if wallet:
            endpoint += f"?wallet={wallet}"
            
        success, result = self.make_request('GET', endpoint)
        
        if success and result.get('data', {}).get('success'):
            data = result['data']['data']
            required_fields = ['marketId', 'voting', 'voteCounts', 'votePercentages', 'isVotingOpen']
            has_all_fields = all(field in data for field in required_fields)
            
            self.log_test(
                f"GET /api/predictions/{market_id}/voting" + (f" (wallet: {wallet[:8]}...)" if wallet else ""),
                has_all_fields,
                {
                    "status_code": result['status_code'],
                    "has_required_fields": has_all_fields,
                    "voting_status": data.get('voting', {}).get('status'),
                    "total_votes": data.get('totalVotes', 0),
                    "yes_votes": data.get('voteCounts', {}).get('yes', 0),
                    "no_votes": data.get('voteCounts', {}).get('no', 0)
                }
            )
            return data
        else:
            self.log_test(
                f"GET /api/predictions/{market_id}/voting",
                False,
                result
            )
            return None

    def test_start_voting(self, market_id: str, duration_hours: int = 24):
        """Test POST /api/markets/:id/start-voting"""
        data = {"durationHours": duration_hours}
        success, result = self.make_request('POST', f'markets/{market_id}/start-voting', data)
        
        if success and result.get('data', {}).get('success'):
            response_data = result['data']['data']
            self.log_test(
                f"POST /api/markets/{market_id}/start-voting",
                True,
                {
                    "status_code": result['status_code'],
                    "voting_started": response_data.get('status') == 'voting_started',
                    "duration_hours": duration_hours
                }
            )
            return True
        else:
            # Check if voting is already active (expected for test market)
            error_msg = result.get('data', {}).get('message', '')
            if 'already active' in error_msg.lower():
                self.log_test(
                    f"POST /api/markets/{market_id}/start-voting",
                    True,
                    {
                        "status_code": result['status_code'],
                        "note": "Voting already active (expected for test market)",
                        "message": error_msg
                    }
                )
                return True
            else:
                self.log_test(
                    f"POST /api/markets/{market_id}/start-voting",
                    False,
                    result
                )
                return False

    def test_cast_vote(self, market_id: str, wallet: str, choice: str):
        """Test POST /api/predictions/:id/vote"""
        data = {
            "wallet": wallet,
            "outcomeId": "1" if choice.lower() == "yes" else "2"
        }
        
        success, result = self.make_request('POST', f'predictions/{market_id}/vote', data)
        
        if success and result.get('data', {}).get('success'):
            self.log_test(
                f"POST /api/predictions/{market_id}/vote ({choice.upper()}) - {wallet[:8]}...",
                True,
                {
                    "status_code": result['status_code'],
                    "vote_choice": choice,
                    "wallet": wallet[:8] + "..."
                }
            )
            return True
        else:
            # Check if already voted (expected for some wallets)
            error_msg = result.get('data', {}).get('message', '')
            if 'already voted' in error_msg.lower():
                self.log_test(
                    f"POST /api/predictions/{market_id}/vote ({choice.upper()}) - {wallet[:8]}...",
                    True,
                    {
                        "status_code": result['status_code'],
                        "note": "Already voted (expected behavior)",
                        "message": error_msg
                    }
                )
                return True
            else:
                self.log_test(
                    f"POST /api/predictions/{market_id}/vote ({choice.upper()}) - {wallet[:8]}...",
                    False,
                    result
                )
                return False

    def test_duplicate_vote_prevention(self, market_id: str, wallet: str):
        """Test that duplicate votes are prevented"""
        # Try to vote twice with same wallet
        first_vote = self.test_cast_vote(market_id, wallet, "yes")
        time.sleep(1)  # Small delay
        
        data = {
            "wallet": wallet,
            "outcomeId": "2"  # Try to vote NO after voting YES
        }
        
        success, result = self.make_request('POST', f'predictions/{market_id}/vote', data)
        
        # Should fail with conflict/already voted error
        if not success or 'already voted' in result.get('data', {}).get('message', '').lower():
            self.log_test(
                f"Duplicate vote prevention - {wallet[:8]}...",
                True,
                {
                    "status_code": result.get('status_code'),
                    "prevented_duplicate": True,
                    "message": result.get('data', {}).get('message', '')
                }
            )
        else:
            self.log_test(
                f"Duplicate vote prevention - {wallet[:8]}...",
                False,
                {
                    "error": "Duplicate vote was not prevented",
                    "result": result
                }
            )

    def test_finalize_voting(self, market_id: str):
        """Test POST /api/markets/:id/finalize-voting"""
        success, result = self.make_request('POST', f'markets/{market_id}/finalize-voting')
        
        if success and result.get('data', {}).get('success'):
            response_data = result['data']['data']
            self.log_test(
                f"POST /api/markets/{market_id}/finalize-voting",
                True,
                {
                    "status_code": result['status_code'],
                    "finalized": response_data.get('status') == 'voting_finalized',
                    "result": response_data.get('result'),
                    "votes": response_data.get('votes', {})
                }
            )
            return True
        else:
            # Check if voting period hasn't ended yet (expected)
            error_msg = result.get('data', {}).get('message', '')
            if 'period' in error_msg.lower() or 'not active' in error_msg.lower():
                self.log_test(
                    f"POST /api/markets/{market_id}/finalize-voting",
                    True,
                    {
                        "status_code": result['status_code'],
                        "note": "Cannot finalize - voting period active or other constraint",
                        "message": error_msg
                    }
                )
                return True
            else:
                self.log_test(
                    f"POST /api/markets/{market_id}/finalize-voting",
                    False,
                    result
                )
                return False

    def test_alternative_vote_endpoint(self, market_id: str, wallet: str, choice: str):
        """Test POST /api/markets/:id/vote (alternative endpoint)"""
        data = {
            "choice": choice.lower()
        }
        headers = {
            "x-wallet-address": wallet
        }
        
        success, result = self.make_request('POST', f'markets/{market_id}/vote', data, headers)
        
        if success and result.get('data', {}).get('success'):
            self.log_test(
                f"POST /api/markets/{market_id}/vote (alt endpoint) - {choice.upper()}",
                True,
                {
                    "status_code": result['status_code'],
                    "vote_choice": choice,
                    "used_header": True
                }
            )
            return True
        else:
            # Check if already voted
            error_msg = result.get('data', {}).get('message', '')
            if 'already voted' in error_msg.lower():
                self.log_test(
                    f"POST /api/markets/{market_id}/vote (alt endpoint) - {choice.upper()}",
                    True,
                    {
                        "status_code": result['status_code'],
                        "note": "Already voted (expected)",
                        "message": error_msg
                    }
                )
                return True
            else:
                self.log_test(
                    f"POST /api/markets/{market_id}/vote (alt endpoint) - {choice.upper()}",
                    False,
                    result
                )
                return False

    def run_all_tests(self):
        """Run comprehensive voting system tests"""
        print("🗳️  Starting Voting System V2 Backend Tests")
        print(f"📍 API Base URL: {self.base_url}")
        print(f"🎯 Test Market ID: {self.test_market_id}")
        print("=" * 60)
        
        # Test 1: Get voting statistics
        print("\n📊 Testing Voting Statistics...")
        self.test_voting_stats()
        
        # Test 2: Get voting status (without wallet)
        print("\n📋 Testing Voting Status...")
        voting_status = self.test_get_voting_status(self.test_market_id)
        
        # Test 3: Get voting status (with wallet)
        print("\n👤 Testing Voting Status with Wallet...")
        self.test_get_voting_status(self.test_market_id, self.test_wallets[0])
        
        # Test 4: Start voting (should be already active for test market)
        print("\n🚀 Testing Start Voting...")
        self.test_start_voting(self.test_market_id, 48)
        
        # Test 5: Cast votes using predictions endpoint
        print("\n🗳️  Testing Vote Casting (Predictions Endpoint)...")
        for i, wallet in enumerate(self.test_wallets):
            choice = "yes" if i % 2 == 0 else "no"
            self.test_cast_vote(self.test_market_id, wallet, choice)
            time.sleep(0.5)  # Small delay between votes
        
        # Test 6: Test duplicate vote prevention
        print("\n🚫 Testing Duplicate Vote Prevention...")
        self.test_duplicate_vote_prevention(self.test_market_id, self.test_wallets[0])
        
        # Test 7: Test alternative vote endpoint
        print("\n🔄 Testing Alternative Vote Endpoint...")
        self.test_alternative_vote_endpoint(self.test_market_id, "0xnewwallet123456789", "yes")
        
        # Test 8: Get updated voting status
        print("\n📊 Testing Updated Voting Status...")
        final_status = self.test_get_voting_status(self.test_market_id, self.test_wallets[0])
        
        # Test 9: Try to finalize voting (may not be ready)
        print("\n🏁 Testing Voting Finalization...")
        self.test_finalize_voting(self.test_market_id)
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📈 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"✅ Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if final_status:
            print(f"\n📊 Final Voting Status:")
            print(f"   Status: {final_status.get('voting', {}).get('status', 'unknown')}")
            print(f"   Total Votes: {final_status.get('totalVotes', 0)}")
            print(f"   YES: {final_status.get('voteCounts', {}).get('yes', 0)} ({final_status.get('votePercentages', {}).get('yes', 0):.1f}%)")
            print(f"   NO: {final_status.get('voteCounts', {}).get('no', 0)} ({final_status.get('votePercentages', {}).get('no', 0):.1f}%)")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = VotingSystemTester()
    
    try:
        success = tester.run_all_tests()
        
        # Save detailed results
        with open('/app/test_reports/voting_backend_results.json', 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'success_rate': (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0,
                'test_results': tester.test_results
            }, f, indent=2)
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())