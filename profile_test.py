#!/usr/bin/env python3

import requests
import sys
import json
import base64
from datetime import datetime

class ProfileAPITester:
    def __init__(self, base_url="https://repo-setup-guide-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.test_wallet = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"  # Test wallet address

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=default_headers, timeout=10)

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

    def test_get_profile_me(self):
        """Test GET /api/profile/me - should return user profile with avatar field"""
        headers = {'x-wallet-address': self.test_wallet}
        success, response = self.run_test(
            "GET Profile Me", 
            "GET", 
            "profile/me", 
            200,
            headers=headers
        )
        
        if success and response.get('data'):
            profile_data = response['data']
            print(f"   Profile keys: {list(profile_data.keys())}")
            
            # Check if avatar field exists
            if 'avatar' in profile_data:
                print(f"✅ Avatar field found: {profile_data['avatar'][:50]}..." if profile_data['avatar'] else "✅ Avatar field found (empty)")
            else:
                print(f"❌ Avatar field missing from profile")
                
            # Check other expected fields
            expected_fields = ['wallet', 'username', 'avatar']
            for field in expected_fields:
                if field not in profile_data:
                    print(f"❌ Missing field: {field}")
                    
        return success, response

    def test_patch_profile_me_avatar(self):
        """Test PATCH /api/profile/me with avatar field - should save avatar to database"""
        headers = {'x-wallet-address': self.test_wallet}
        
        # Create a simple test avatar (base64 encoded small image)
        test_avatar = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        data = {
            "avatar": test_avatar
        }
        
        success, response = self.run_test(
            "PATCH Profile Me - Avatar Update", 
            "PATCH", 
            "profile/me", 
            200,
            data=data,
            headers=headers
        )
        
        if success:
            print(f"✅ Avatar update successful")
            
            # Verify the avatar was saved by getting the profile again
            print(f"   Verifying avatar was saved...")
            verify_success, verify_response = self.test_get_profile_me()
            
            if verify_success and verify_response.get('data', {}).get('avatar') == test_avatar:
                print(f"✅ Avatar successfully saved and retrieved")
                return True, response
            else:
                print(f"❌ Avatar not properly saved - retrieved: {verify_response.get('data', {}).get('avatar', 'None')[:50]}...")
                return False, response
        
        return success, response

    def test_patch_profile_me_username(self):
        """Test PATCH /api/profile/me with username field - should save username"""
        headers = {'x-wallet-address': self.test_wallet}
        
        test_username = f"TestUser_{datetime.now().strftime('%H%M%S')}"
        
        data = {
            "username": test_username
        }
        
        success, response = self.run_test(
            "PATCH Profile Me - Username Update", 
            "PATCH", 
            "profile/me", 
            200,
            data=data,
            headers=headers
        )
        
        if success:
            print(f"✅ Username update successful")
            
            # Verify the username was saved
            print(f"   Verifying username was saved...")
            verify_success, verify_response = self.test_get_profile_me()
            
            if verify_success and verify_response.get('data', {}).get('username') == test_username:
                print(f"✅ Username successfully saved and retrieved: {test_username}")
                return True, response
            else:
                print(f"❌ Username not properly saved - retrieved: {verify_response.get('data', {}).get('username', 'None')}")
                return False, response
        
        return success, response

    def test_profile_stats(self):
        """Test GET /api/profile/me/stats - should return user statistics"""
        headers = {'x-wallet-address': self.test_wallet}
        success, response = self.run_test(
            "GET Profile Stats", 
            "GET", 
            "profile/me/stats", 
            200,
            headers=headers
        )
        
        if success and response.get('data'):
            stats_data = response['data']
            print(f"   Stats keys: {list(stats_data.keys())}")
            
            # Check expected stats fields
            expected_stats = ['totalBets', 'won', 'lost', 'winRate', 'totalInvested', 'realizedPnL']
            for stat in expected_stats:
                if stat in stats_data:
                    print(f"   {stat}: {stats_data[stat]}")
                else:
                    print(f"❌ Missing stat: {stat}")
                    
        return success, response

    def print_summary(self):
        """Print test summary"""
        print(f"\n" + "="*60)
        print(f"📊 Profile API Test Summary")
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
    print("🚀 Starting Profile API Tests...")
    print("="*60)
    
    # Setup
    tester = ProfileAPITester()

    # Run profile-specific tests
    print("\n📋 Running Profile API Tests...")
    
    # Test profile retrieval
    tester.test_get_profile_me()
    
    # Test avatar upload/save
    tester.test_patch_profile_me_avatar()
    
    # Test username update
    tester.test_patch_profile_me_username()
    
    # Test profile stats
    tester.test_profile_stats()

    # Print results
    tester.print_summary()
    
    # Save detailed results
    with open('/app/test_reports/profile_api_results.json', 'w') as f:
        json.dump({
            "summary": {
                "tests_run": tester.tests_run,
                "tests_passed": tester.tests_passed,
                "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0
            },
            "results": tester.test_results,
            "timestamp": datetime.now().isoformat()
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/test_reports/profile_api_results.json")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())