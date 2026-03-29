#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime
import uuid

class DiscussionsAPITester:
    def __init__(self, base_url="https://2281a529-8676-4279-bbae-bfda8bc394f2.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []
        self.test_wallet = f"0x{uuid.uuid4().hex[:40]}"  # Generate test wallet address

    def log_result(self, test_name, success, response_data=None, error=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {error}")
        
        self.results.append({
            "test": test_name,
            "success": success,
            "response": response_data,
            "error": str(error) if error else None
        })

    def test_api_endpoint(self, method, endpoint, expected_status, data=None, headers=None):
        """Test a single API endpoint"""
        url = f"{self.base_url}/api/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=default_headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            response_data = None
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            return success, response_data, response.status_code

        except Exception as e:
            return False, None, str(e)

    def test_discussions_list(self):
        """Test GET /api/discussions"""
        success, data, status = self.test_api_endpoint('GET', 'discussions', 200)
        
        if success and data and data.get('success'):
            self.log_result("GET /api/discussions - returns discussions list", True, data)
            return data.get('data', [])
        else:
            self.log_result("GET /api/discussions - returns discussions list", False, data, f"Status: {status}")
            return []

    def test_discussions_with_params(self):
        """Test GET /api/discussions with parameters"""
        # Test with pagination
        success, data, status = self.test_api_endpoint('GET', 'discussions?page=1&limit=5', 200)
        self.log_result("GET /api/discussions with pagination", success, data)
        
        # Test with sort
        success, data, status = self.test_api_endpoint('GET', 'discussions?sort=trending', 200)
        self.log_result("GET /api/discussions with sort=trending", success, data)
        
        # Test with tag filter
        success, data, status = self.test_api_endpoint('GET', 'discussions?tag=Blockchain', 200)
        self.log_result("GET /api/discussions with tag filter", success, data)

    def test_topics_list(self):
        """Test GET /api/discussions/topics/list"""
        success, data, status = self.test_api_endpoint('GET', 'discussions/topics/list', 200)
        
        if success and data and data.get('success'):
            self.log_result("GET /api/discussions/topics/list - returns topics", True, data)
            return data.get('data', [])
        else:
            self.log_result("GET /api/discussions/topics/list - returns topics", False, data, f"Status: {status}")
            return []

    def test_top_contributors(self):
        """Test GET /api/discussions/contributors/top"""
        success, data, status = self.test_api_endpoint('GET', 'discussions/contributors/top', 200)
        
        if success and data and data.get('success'):
            self.log_result("GET /api/discussions/contributors/top - returns contributors", True, data)
            return data.get('data', [])
        else:
            self.log_result("GET /api/discussions/contributors/top - returns contributors", False, data, f"Status: {status}")
            return []

    def test_today_stats(self):
        """Test GET /api/discussions/stats/today"""
        success, data, status = self.test_api_endpoint('GET', 'discussions/stats/today', 200)
        self.log_result("GET /api/discussions/stats/today - returns today stats", success, data)

    def test_seed_topics(self):
        """Test POST /api/discussions/seed"""
        success, data, status = self.test_api_endpoint('POST', 'discussions/seed', 200)
        self.log_result("POST /api/discussions/seed - seeds default topics", success, data)

    def test_create_discussion(self):
        """Test POST /api/discussions (requires auth)"""
        headers = {'x-wallet-address': self.test_wallet}
        discussion_data = {
            "title": f"Test Discussion {datetime.now().strftime('%H:%M:%S')}",
            "content": "This is a test discussion created by automated testing.",
            "tags": ["Blockchain", "AI"]
        }
        
        success, data, status = self.test_api_endpoint('POST', 'discussions', 201, discussion_data, headers)
        
        if success and data and data.get('success'):
            self.log_result("POST /api/discussions - creates new discussion", True, data)
            return data.get('data', {}).get('id')
        else:
            self.log_result("POST /api/discussions - creates new discussion", False, data, f"Status: {status}")
            return None

    def test_get_single_discussion(self, discussion_id):
        """Test GET /api/discussions/:id"""
        if not discussion_id:
            self.log_result("GET /api/discussions/:id - get single discussion", False, None, "No discussion ID provided")
            return None
            
        success, data, status = self.test_api_endpoint('GET', f'discussions/{discussion_id}', 200)
        
        if success and data and data.get('success'):
            self.log_result("GET /api/discussions/:id - get single discussion", True, data)
            return data.get('data')
        else:
            self.log_result("GET /api/discussions/:id - get single discussion", False, data, f"Status: {status}")
            return None

    def test_vote_discussion(self, discussion_id):
        """Test POST /api/discussions/:id/vote"""
        if not discussion_id:
            self.log_result("POST /api/discussions/:id/vote - vote on discussion", False, None, "No discussion ID provided")
            return
            
        headers = {'x-wallet-address': self.test_wallet}
        vote_data = {"type": "up"}
        
        success, data, status = self.test_api_endpoint('POST', f'discussions/{discussion_id}/vote', 200, vote_data, headers)
        self.log_result("POST /api/discussions/:id/vote - vote on discussion", success, data)

    def test_discussion_comments(self, discussion_id):
        """Test discussion comments endpoints"""
        if not discussion_id:
            self.log_result("Discussion comments tests", False, None, "No discussion ID provided")
            return
            
        # Test get comments
        success, data, status = self.test_api_endpoint('GET', f'discussions/{discussion_id}/comments', 200)
        self.log_result("GET /api/discussions/:id/comments - get comments", success, data)
        
        # Test create comment
        headers = {'x-wallet-address': self.test_wallet}
        comment_data = {"content": f"Test comment {datetime.now().strftime('%H:%M:%S')}"}
        
        success, data, status = self.test_api_endpoint('POST', f'discussions/{discussion_id}/comments', 201, comment_data, headers)
        
        if success and data and data.get('success'):
            self.log_result("POST /api/discussions/:id/comments - create comment", True, data)
            comment_id = data.get('data', {}).get('id')
            
            # Test comment like/dislike
            if comment_id:
                success, data, status = self.test_api_endpoint('POST', f'discussions/comments/{comment_id}/like', 200, {}, headers)
                self.log_result("POST /api/discussions/comments/:id/like - like comment", success, data)
                
                success, data, status = self.test_api_endpoint('POST', f'discussions/comments/{comment_id}/dislike', 200, {}, headers)
                self.log_result("POST /api/discussions/comments/:id/dislike - dislike comment", success, data)
        else:
            self.log_result("POST /api/discussions/:id/comments - create comment", False, data, f"Status: {status}")

    def run_all_tests(self):
        """Run all discussion API tests"""
        print(f"🚀 Starting Discussions API Tests...")
        print(f"📍 Base URL: {self.base_url}")
        print(f"🔑 Test Wallet: {self.test_wallet}")
        print("=" * 60)

        # Test basic endpoints first
        discussions = self.test_discussions_list()
        self.test_discussions_with_params()
        topics = self.test_topics_list()
        contributors = self.test_top_contributors()
        self.test_today_stats()
        self.test_seed_topics()

        # Test authenticated endpoints
        discussion_id = self.test_create_discussion()
        discussion_data = self.test_get_single_discussion(discussion_id)
        self.test_vote_discussion(discussion_id)
        self.test_discussion_comments(discussion_id)

        # Print summary
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        print(f"✅ Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Save results to file
        results_file = "/app/test_reports/backend_discussions_results.json"
        with open(results_file, 'w') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "total_tests": self.tests_run,
                "passed_tests": self.tests_passed,
                "success_rate": f"{(self.tests_passed/self.tests_run)*100:.1f}%",
                "test_wallet": self.test_wallet,
                "results": self.results
            }, f, indent=2)
        
        print(f"📄 Detailed results saved to: {results_file}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = DiscussionsAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())