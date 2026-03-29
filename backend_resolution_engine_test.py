#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta

class ResolutionEngineV1Tester:
    def __init__(self, base_url="https://cold-start-repo.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.admin_wallet = "admin"
        self.test_market_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if params:
            print(f"   Params: {params}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2)[:200]}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, params=params, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=15)

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

    def test_oracle_price_bitcoin(self):
        """Test GET /api/markets/oracle/price?asset=bitcoin&metric=price"""
        return self.run_test(
            "Oracle Price - Bitcoin",
            "GET",
            "markets/oracle/price",
            200,
            params={"asset": "bitcoin", "metric": "price"}
        )

    def test_oracle_price_ethereum(self):
        """Test GET /api/markets/oracle/price?asset=ethereum&metric=price"""
        return self.run_test(
            "Oracle Price - Ethereum",
            "GET",
            "markets/oracle/price",
            200,
            params={"asset": "ethereum", "metric": "price"}
        )

    def test_oracle_price_solana(self):
        """Test GET /api/markets/oracle/price?asset=solana&metric=price"""
        return self.run_test(
            "Oracle Price - Solana",
            "GET",
            "markets/oracle/price",
            200,
            params={"asset": "solana", "metric": "price"}
        )

    def test_oracle_fdv_bitcoin(self):
        """Test GET /api/markets/oracle/price?asset=bitcoin&metric=fdv"""
        return self.run_test(
            "Oracle FDV - Bitcoin",
            "GET",
            "markets/oracle/price",
            200,
            params={"asset": "bitcoin", "metric": "fdv"}
        )

    def test_oracle_market_cap_ethereum(self):
        """Test GET /api/markets/oracle/price?asset=ethereum&metric=market_cap"""
        return self.run_test(
            "Oracle Market Cap - Ethereum",
            "GET",
            "markets/oracle/price",
            200,
            params={"asset": "ethereum", "metric": "market_cap"}
        )

    def test_resolution_stats(self):
        """Test GET /api/markets/resolution/stats"""
        success, response = self.run_test(
            "Resolution Statistics",
            "GET",
            "markets/resolution/stats",
            200
        )
        
        if success and response.get('data'):
            stats = response['data']
            expected_fields = ['pendingOracle', 'pendingAdmin', 'autoResolved', 'manualResolved', 'disputed']
            print(f"   Resolution Stats:")
            for field in expected_fields:
                if field in stats:
                    print(f"     {field}: {stats[field]}")
                else:
                    print(f"     ⚠️  Missing field: {field}")
                    
        return success, response

    def test_resolution_trigger(self):
        """Test POST /api/markets/resolution/trigger - manual trigger for resolution worker"""
        return self.run_test(
            "Resolution Worker Trigger",
            "POST",
            "markets/resolution/trigger",
            200
        )

    def create_test_market_with_oracle(self):
        """Create a test market with oracle resolution for testing"""
        future_date = datetime.now() + timedelta(minutes=1)  # Close in 1 minute for testing
        
        market_data = {
            "title": f"Test Oracle Market {datetime.now().strftime('%H%M%S')}",
            "description": "Testing oracle resolution engine",
            "category": "crypto",
            "type": "single",
            "outcomes": [
                {"id": "1", "label": "Yes"},
                {"id": "2", "label": "No"}
            ],
            "closeTime": future_date.isoformat(),
            "creatorAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
            "stake": 100,
            "resolution": {
                "mode": "oracle",
                "metric": "price",
                "asset": "bitcoin",
                "source": "coingecko",
                "operator": ">=",
                "targetValue": 50000,
                "evaluationTime": future_date.isoformat(),
                "status": "pending"
            }
        }
        
        success, response = self.run_test(
            "Create Oracle Test Market",
            "POST",
            "markets/drafts",
            201,
            data=market_data,
            headers={'X-Wallet-Address': '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'}
        )
        
        if success and response.get('data', {}).get('_id'):
            self.test_market_id = response['data']['_id']
            print(f"   Created test market ID: {self.test_market_id}")
            
            # Submit for review to make it available for testing
            submit_success, submit_response = self.run_test(
                "Submit Oracle Test Market",
                "POST",
                f"markets/drafts/{self.test_market_id}/submit",
                200,
                headers={'X-Wallet-Address': '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'}
            )
            
            return submit_success, submit_response
            
        return success, response

    def create_test_market_with_admin(self):
        """Create a test market with admin resolution for testing"""
        future_date = datetime.now() + timedelta(minutes=1)
        
        market_data = {
            "title": f"Test Admin Market {datetime.now().strftime('%H%M%S')}",
            "description": "Testing admin resolution engine",
            "category": "crypto",
            "type": "single",
            "outcomes": [
                {"id": "1", "label": "Yes"},
                {"id": "2", "label": "No"}
            ],
            "closeTime": future_date.isoformat(),
            "creatorAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
            "stake": 100,
            "resolution": {
                "mode": "admin",
                "instructions": "YES: Bitcoin reaches $100,000\nNO: Bitcoin stays below $100,000\nSource: CoinGecko",
                "adminNotesRequired": True,
                "status": "pending"
            }
        }
        
        success, response = self.run_test(
            "Create Admin Test Market",
            "POST",
            "markets/drafts",
            201,
            data=market_data,
            headers={'X-Wallet-Address': '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'}
        )
        
        if success and response.get('data', {}).get('_id'):
            admin_market_id = response['data']['_id']
            print(f"   Created admin test market ID: {admin_market_id}")
            
            # Submit for review
            submit_success, submit_response = self.run_test(
                "Submit Admin Test Market",
                "POST",
                f"markets/drafts/{admin_market_id}/submit",
                200,
                headers={'X-Wallet-Address': '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'}
            )
            
            return submit_success, submit_response
            
        return success, response

    def test_oracle_check(self):
        """Test POST /api/markets/:id/oracle-check"""
        if not self.test_market_id:
            print("   ⚠️  No test market available for oracle check")
            return False, {}
            
        return self.run_test(
            f"Oracle Check - Market {self.test_market_id}",
            "POST",
            f"markets/{self.test_market_id}/oracle-check",
            200
        )

    def test_admin_resolve(self):
        """Test POST /api/markets/:id/admin-resolve"""
        # Get a market that needs admin resolution
        success, response = self.run_test(
            "Get Markets for Admin Resolution",
            "GET",
            "admin/resolution/pending",
            200,
            headers={'X-Admin-Wallet': self.admin_wallet}
        )
        
        if not success or not response.get('data'):
            print("   ⚠️  No markets available for admin resolution test")
            return False, {}
            
        markets = response['data']
        if not markets:
            print("   ⚠️  No markets in admin resolution queue")
            return False, {}
            
        test_market = markets[0]
        market_id = test_market['id']
        
        return self.run_test(
            f"Admin Resolve - Market {market_id}",
            "POST",
            f"markets/{market_id}/admin-resolve",
            200,
            data={
                "outcome": "YES",
                "reason": "Test admin resolution - market conditions met",
                "adminId": self.admin_wallet
            }
        )

    def test_dispute_market(self):
        """Test POST /api/markets/:id/dispute"""
        # Get a resolved market to dispute
        success, response = self.run_test(
            "Get Markets for Dispute Test",
            "GET",
            "admin/markets?status=resolved",
            200,
            headers={'X-Admin-Wallet': self.admin_wallet}
        )
        
        if not success or not response.get('data'):
            print("   ⚠️  No resolved markets available for dispute test")
            return False, {}
            
        markets = response['data']
        if not markets:
            print("   ⚠️  No resolved markets available")
            return False, {}
            
        test_market = markets[0]
        market_id = test_market['id']
        
        return self.run_test(
            f"Dispute Market - Market {market_id}",
            "POST",
            f"markets/{market_id}/dispute",
            200,
            data={
                "reason": "Test dispute - questioning the resolution accuracy based on additional evidence",
                "evidence": "Additional data source shows different outcome"
            }
        )

    def test_coingecko_provider_health(self):
        """Test if CoinGecko provider is working by checking multiple assets"""
        assets_to_test = [
            ("bitcoin", "price"),
            ("ethereum", "price"),
            ("solana", "price"),
            ("bitcoin", "market_cap"),
            ("ethereum", "fdv")
        ]
        
        working_count = 0
        total_count = len(assets_to_test)
        
        for asset, metric in assets_to_test:
            success, response = self.run_test(
                f"CoinGecko Provider - {asset} {metric}",
                "GET",
                "markets/oracle/price",
                200,
                params={"asset": asset, "metric": metric}
            )
            
            if success and response.get('data', {}).get('value') is not None:
                working_count += 1
                value = response['data']['value']
                source = response['data'].get('source', 'unknown')
                print(f"   ✅ {asset} {metric}: ${value:,.2f} from {source}")
            else:
                print(f"   ❌ {asset} {metric}: Failed to get value")
        
        print(f"\n   CoinGecko Provider Health: {working_count}/{total_count} working ({working_count/total_count*100:.1f}%)")
        return working_count == total_count, {"working": working_count, "total": total_count}

    def print_summary(self):
        """Print test summary"""
        print(f"\n" + "="*70)
        print(f"📊 FOMO Arena Resolution Engine V1 Test Summary")
        print(f"="*70)
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
    print("🚀 Starting FOMO Arena Resolution Engine V1 Tests...")
    print("="*70)
    
    # Setup
    tester = ResolutionEngineV1Tester()

    # Test Oracle Price API endpoints
    print("\n🔮 Testing Oracle Price APIs...")
    tester.test_oracle_price_bitcoin()
    tester.test_oracle_price_ethereum()
    tester.test_oracle_price_solana()
    tester.test_oracle_fdv_bitcoin()
    tester.test_oracle_market_cap_ethereum()
    
    # Test Resolution Statistics
    print("\n📊 Testing Resolution Statistics...")
    tester.test_resolution_stats()
    
    # Test Resolution Worker
    print("\n⚙️  Testing Resolution Worker...")
    tester.test_resolution_trigger()
    
    # Test CoinGecko Provider Health
    print("\n🌐 Testing CoinGecko Provider...")
    tester.test_coingecko_provider_health()
    
    # Create test markets for resolution testing
    print("\n🏗️  Creating Test Markets...")
    tester.create_test_market_with_oracle()
    tester.create_test_market_with_admin()
    
    # Test Oracle Check
    print("\n🔍 Testing Oracle Check...")
    tester.test_oracle_check()
    
    # Test Admin Resolution
    print("\n👨‍💼 Testing Admin Resolution...")
    tester.test_admin_resolve()
    
    # Test Market Dispute
    print("\n⚖️  Testing Market Dispute...")
    tester.test_dispute_market()

    # Print results
    tester.print_summary()
    
    # Save detailed results
    with open('/app/test_reports/resolution_engine_v1_results.json', 'w') as f:
        json.dump({
            "summary": {
                "tests_run": tester.tests_run,
                "tests_passed": tester.tests_passed,
                "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0
            },
            "results": tester.test_results,
            "timestamp": datetime.now().isoformat()
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/test_reports/resolution_engine_v1_results.json")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())