#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class FOMOArenaFeatureTester:
    def __init__(self, base_url="https://b8f41f9c-0691-4c5e-ab7e-ea96241f853c.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "timestamp": datetime.now().isoformat()
            }

            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    result["response_data"] = response_data
                    print(f"   Response: {json.dumps(response_data, indent=2)[:300]}...")
                except:
                    result["response_data"] = response.text[:200]
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    result["error_data"] = error_data
                    print(f"   Error: {json.dumps(error_data, indent=2)}")
                except:
                    result["error_data"] = response.text
                    print(f"   Error: {response.text}")

            self.test_results.append(result)
            return success, response.json() if success and response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            result = {
                "test_name": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": "ERROR",
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
            self.test_results.append(result)
            return False, {}

    def test_health_endpoint(self):
        """Test backend health check /api/health"""
        return self.run_test("Backend Health Check", "GET", "api/health", 200)

    def test_nft_eligibility_empty_wallet(self):
        """Test NFT eligibility check for empty wallet - should return eligible=false"""
        empty_wallet = "0x0000000000000000000000000000000000000000"
        success, response = self.run_test(
            "NFT Eligibility (Empty Wallet)", 
            "GET", 
            f"api/voting/eligibility/{empty_wallet}", 
            200
        )
        
        if success and response.get('data'):
            eligibility_data = response['data']
            eligible = eligibility_data.get('eligible', True)  # Default to True to catch failures
            
            if eligible == False:
                print(f"✅ Correctly returned eligible=false for empty wallet")
                return True, response
            else:
                print(f"❌ Expected eligible=false, got eligible={eligible}")
                return False, response
        
        return success, response

    def test_nft_eligibility_test_wallet(self):
        """Test NFT eligibility check for test wallet"""
        test_wallet = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
        success, response = self.run_test(
            "NFT Eligibility (Test Wallet)", 
            "GET", 
            f"api/voting/eligibility/{test_wallet}", 
            200
        )
        
        if success and response.get('data'):
            eligibility_data = response['data']
            print(f"   Eligibility details: {json.dumps(eligibility_data, indent=2)}")
            
            # Check required fields
            required_fields = ['eligible', 'wallet', 'dbPositions', 'onChainBalance']
            for field in required_fields:
                if field in eligibility_data:
                    print(f"   ✅ Found {field}: {eligibility_data[field]}")
                else:
                    print(f"   ⚠️  Missing {field} in eligibility response")
        
        return success, response

    def test_xp_stats_new_wallet(self):
        """Test XP stats for new wallet - should return level 1, xp 0"""
        new_wallet = "0x1111111111111111111111111111111111111111"
        success, response = self.run_test(
            "XP Stats (New Wallet)", 
            "GET", 
            f"api/xp/stats/{new_wallet}", 
            200
        )
        
        if success and response.get('data'):
            xp_data = response['data']
            level = xp_data.get('level', 0)
            xp = xp_data.get('xp', -1)
            
            print(f"   XP Data: level={level}, xp={xp}")
            
            if level == 1 and xp == 0:
                print(f"✅ Correctly returned level=1, xp=0 for new wallet")
                return True, response
            else:
                print(f"❌ Expected level=1, xp=0, got level={level}, xp={xp}")
                return False, response
        
        return success, response

    def test_xp_stats_test_wallet(self):
        """Test XP stats for test wallet"""
        test_wallet = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
        success, response = self.run_test(
            "XP Stats (Test Wallet)", 
            "GET", 
            f"api/xp/stats/{test_wallet}", 
            200
        )
        
        if success and response.get('data'):
            xp_data = response['data']
            print(f"   XP Stats: {json.dumps(xp_data, indent=2)}")
            
            # Check required fields
            required_fields = ['wallet', 'xp', 'level', 'xpProgress', 'totalBets', 'badges']
            for field in required_fields:
                if field in xp_data:
                    print(f"   ✅ Found {field}: {xp_data[field]}")
                else:
                    print(f"   ⚠️  Missing {field} in XP stats")
        
        return success, response

    def test_xp_badges_list(self):
        """Test XP badges endpoint - should return list of available badges"""
        success, response = self.run_test("XP Badges List", "GET", "api/xp/badges", 200)
        
        if success and response.get('data'):
            badges = response['data']
            print(f"   Found {len(badges)} badges")
            
            # Check badge structure
            for badge in badges[:3]:  # Check first 3 badges
                if isinstance(badge, dict) and 'id' in badge and 'name' in badge:
                    print(f"   Badge: {badge.get('name')} ({badge.get('id')})")
                    if 'emoji' in badge:
                        print(f"     Emoji: {badge.get('emoji')}")
                    if 'description' in badge:
                        print(f"     Description: {badge.get('description')[:50]}...")
                else:
                    print(f"   ⚠️  Badge missing required fields: {badge}")
        
        return success, response

    def test_xp_leaderboard(self):
        """Test XP leaderboard endpoint"""
        success, response = self.run_test("XP Leaderboard", "GET", "api/xp/leaderboard", 200)
        
        if success and response.get('data'):
            leaderboard = response['data']
            print(f"   Found {len(leaderboard)} users in leaderboard")
            
            # Check leaderboard structure
            for user in leaderboard[:3]:  # Check first 3 users
                if isinstance(user, dict):
                    rank = user.get('rank', 'N/A')
                    wallet = user.get('wallet', 'N/A')
                    xp = user.get('xp', 'N/A')
                    level = user.get('level', 'N/A')
                    print(f"   #{rank}: {wallet[:10]}... - Level {level}, {xp} XP")
                else:
                    print(f"   ⚠️  Invalid user entry: {user}")
        
        return success, response

    def test_voting_stats(self):
        """Test voting stats endpoint"""
        success, response = self.run_test("Voting Stats", "GET", "api/voting/stats", 200)
        
        if success and response.get('data'):
            voting_stats = response['data']
            print(f"   Voting Stats: {json.dumps(voting_stats, indent=2)}")
            
            # Check for expected stats fields
            expected_fields = ['totalVotes', 'activeVotings', 'completedVotings']
            for field in expected_fields:
                if field in voting_stats:
                    print(f"   ✅ Found {field}: {voting_stats[field]}")
                else:
                    print(f"   ⚠️  Missing {field} in voting stats")
        
        return success, response

    def print_summary(self):
        """Print test summary"""
        print(f"\n" + "="*60)
        print(f"📊 FOMO Arena Feature Test Summary")
        print(f"="*60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.tests_run - self.tests_passed > 0:
            print(f"\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   - {result['test_name']}: {result.get('error', 'Status ' + str(result['actual_status']))}")

def main():
    print("🚀 Starting FOMO Arena Feature Tests...")
    print("="*60)
    
    # Setup
    tester = FOMOArenaFeatureTester()

    # Run all tests as specified in review request
    print("\n📋 Running Backend Feature Tests...")
    
    # 1. Backend health check
    tester.test_health_endpoint()
    
    # 2. NFT eligibility checks
    print("\n🎫 Testing NFT Eligibility APIs...")
    tester.test_nft_eligibility_empty_wallet()
    tester.test_nft_eligibility_test_wallet()
    
    # 3. XP system tests
    print("\n⭐ Testing XP System APIs...")
    tester.test_xp_stats_new_wallet()
    tester.test_xp_stats_test_wallet()
    tester.test_xp_badges_list()
    tester.test_xp_leaderboard()
    
    # 4. Voting stats
    print("\n🗳️  Testing Voting APIs...")
    tester.test_voting_stats()

    # Print results
    tester.print_summary()
    
    # Save detailed results
    with open('/app/test_reports/fomo_arena_backend_results.json', 'w') as f:
        json.dump({
            "summary": {
                "tests_run": tester.tests_run,
                "tests_passed": tester.tests_passed,
                "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0
            },
            "results": tester.test_results,
            "timestamp": datetime.now().isoformat()
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/test_reports/fomo_arena_backend_results.json")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())