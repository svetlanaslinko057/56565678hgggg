#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

class TickerAPITester:
    def __init__(self, base_url="https://cold-start-repo.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_get_public_ticker(self):
        """Test GET /api/ticker - public endpoint with enabled items"""
        try:
            response = requests.get(f"{self.base_url}/api/ticker", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'success' in data and data['success'] and 'data' in data:
                    items = data['data']
                    if isinstance(items, list):
                        enabled_count = len([item for item in items if item.get('enabled', False)])
                        self.log_test("GET /api/ticker", True, f"Found {len(items)} items, {enabled_count} enabled")
                        return True, items
                    else:
                        self.log_test("GET /api/ticker", False, "Data is not a list")
                else:
                    self.log_test("GET /api/ticker", False, f"Invalid response format: {data}")
            else:
                self.log_test("GET /api/ticker", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("GET /api/ticker", False, f"Exception: {str(e)}")
        
        return False, []

    def test_get_admin_all(self):
        """Test GET /api/ticker/admin/all - all items for admin"""
        try:
            response = requests.get(f"{self.base_url}/api/ticker/admin/all", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'success' in data and data['success'] and 'data' in data:
                    items = data['data']
                    if isinstance(items, list):
                        self.log_test("GET /api/ticker/admin/all", True, f"Found {len(items)} total items")
                        return True, items
                    else:
                        self.log_test("GET /api/ticker/admin/all", False, "Data is not a list")
                else:
                    self.log_test("GET /api/ticker/admin/all", False, f"Invalid response format: {data}")
            else:
                self.log_test("GET /api/ticker/admin/all", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("GET /api/ticker/admin/all", False, f"Exception: {str(e)}")
        
        return False, []

    def test_get_admin_stats(self):
        """Test GET /api/ticker/admin/stats - get ticker stats"""
        try:
            response = requests.get(f"{self.base_url}/api/ticker/admin/stats", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'success' in data and data['success'] and 'data' in data:
                    stats = data['data']
                    if isinstance(stats, dict):
                        self.log_test("GET /api/ticker/admin/stats", True, f"Found {len(stats)} stat sources")
                        return True, stats
                    else:
                        self.log_test("GET /api/ticker/admin/stats", False, "Data is not a dict")
                else:
                    self.log_test("GET /api/ticker/admin/stats", False, f"Invalid response format: {data}")
            else:
                self.log_test("GET /api/ticker/admin/stats", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("GET /api/ticker/admin/stats", False, f"Exception: {str(e)}")
        
        return False, {}

    def test_toggle_item(self, key):
        """Test PUT /api/ticker/admin/:key/toggle - toggle enable/disable"""
        try:
            response = requests.put(f"{self.base_url}/api/ticker/admin/{key}/toggle", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'success' in data and data['success'] and 'data' in data:
                    item = data['data']
                    if 'enabled' in item:
                        self.log_test(f"PUT /api/ticker/admin/{key}/toggle", True, f"Toggled to enabled={item['enabled']}")
                        return True, item
                    else:
                        self.log_test(f"PUT /api/ticker/admin/{key}/toggle", False, "No enabled field in response")
                else:
                    self.log_test(f"PUT /api/ticker/admin/{key}/toggle", False, f"Invalid response format: {data}")
            else:
                self.log_test(f"PUT /api/ticker/admin/{key}/toggle", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test(f"PUT /api/ticker/admin/{key}/toggle", False, f"Exception: {str(e)}")
        
        return False, {}

    def test_create_item(self):
        """Test POST /api/ticker/admin/create - create new item"""
        test_item = {
            "key": f"test_item_{int(datetime.now().timestamp())}",
            "label": "Test Item",
            "icon": "star",
            "color": "#f59e0b",
            "enabled": True,
            "order": 999,
            "value": "Test Value",
            "changeValue": "+1",
            "changePositive": True,
            "isDynamic": False,
            "dynamicSource": None
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/ticker/admin/create",
                json=test_item,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 201 or response.status_code == 200:
                data = response.json()
                if 'success' in data and data['success'] and 'data' in data:
                    created_item = data['data']
                    if created_item.get('key') == test_item['key']:
                        self.log_test("POST /api/ticker/admin/create", True, f"Created item with key: {created_item['key']}")
                        return True, created_item
                    else:
                        self.log_test("POST /api/ticker/admin/create", False, "Created item key doesn't match")
                else:
                    self.log_test("POST /api/ticker/admin/create", False, f"Invalid response format: {data}")
            else:
                self.log_test("POST /api/ticker/admin/create", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("POST /api/ticker/admin/create", False, f"Exception: {str(e)}")
        
        return False, {}

    def test_update_item(self, key):
        """Test PUT /api/ticker/admin/:key - update item"""
        update_data = {
            "label": "Updated Test Item",
            "value": "Updated Value"
        }
        
        try:
            response = requests.put(
                f"{self.base_url}/api/ticker/admin/{key}",
                json=update_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'success' in data and data['success'] and 'data' in data:
                    updated_item = data['data']
                    if updated_item.get('label') == update_data['label']:
                        self.log_test(f"PUT /api/ticker/admin/{key}", True, f"Updated item label to: {updated_item['label']}")
                        return True, updated_item
                    else:
                        self.log_test(f"PUT /api/ticker/admin/{key}", False, "Update didn't apply correctly")
                else:
                    self.log_test(f"PUT /api/ticker/admin/{key}", False, f"Invalid response format: {data}")
            else:
                self.log_test(f"PUT /api/ticker/admin/{key}", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test(f"PUT /api/ticker/admin/{key}", False, f"Exception: {str(e)}")
        
        return False, {}

    def test_delete_item(self, key):
        """Test DELETE /api/ticker/admin/:key - delete item"""
        try:
            response = requests.delete(f"{self.base_url}/api/ticker/admin/{key}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'success' in data and data['success']:
                    self.log_test(f"DELETE /api/ticker/admin/{key}", True, "Item deleted successfully")
                    return True
                else:
                    self.log_test(f"DELETE /api/ticker/admin/{key}", False, f"Delete failed: {data}")
            else:
                self.log_test(f"DELETE /api/ticker/admin/{key}", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test(f"DELETE /api/ticker/admin/{key}", False, f"Exception: {str(e)}")
        
        return False

    def test_reorder_items(self, items):
        """Test POST /api/ticker/admin/reorder - reorder items"""
        if len(items) < 2:
            self.log_test("POST /api/ticker/admin/reorder", False, "Need at least 2 items to test reorder")
            return False
        
        # Create reorder data - swap first two items
        reorder_data = [
            {"key": items[0]['key'], "order": items[1]['order']},
            {"key": items[1]['key'], "order": items[0]['order']}
        ]
        
        try:
            response = requests.post(
                f"{self.base_url}/api/ticker/admin/reorder",
                json=reorder_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                if 'success' in data and data['success']:
                    self.log_test("POST /api/ticker/admin/reorder", True, "Items reordered successfully")
                    return True
                else:
                    self.log_test("POST /api/ticker/admin/reorder", False, f"Reorder failed: {data}")
            else:
                self.log_test("POST /api/ticker/admin/reorder", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("POST /api/ticker/admin/reorder", False, f"Exception: {str(e)}")
        
        return False

    def test_reset_to_defaults(self):
        """Test POST /api/ticker/admin/reset - reset to defaults"""
        try:
            response = requests.post(f"{self.base_url}/api/ticker/admin/reset", timeout=10)
            
            if response.status_code in [200, 201]:
                data = response.json()
                if 'success' in data and data['success'] and 'data' in data:
                    items = data['data']
                    if isinstance(items, list) and len(items) > 0:
                        self.log_test("POST /api/ticker/admin/reset", True, f"Reset successful, {len(items)} default items")
                        return True, items
                    else:
                        self.log_test("POST /api/ticker/admin/reset", False, "No items returned after reset")
                else:
                    self.log_test("POST /api/ticker/admin/reset", False, f"Invalid response format: {data}")
            else:
                self.log_test("POST /api/ticker/admin/reset", False, f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("POST /api/ticker/admin/reset", False, f"Exception: {str(e)}")
        
        return False, []

    def run_all_tests(self):
        """Run all ticker API tests"""
        print("🚀 Starting FOMO Arena Ticker API Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test 1: Get public ticker items
        success, public_items = self.test_get_public_ticker()
        
        # Test 2: Get all admin items
        success, admin_items = self.test_get_admin_all()
        
        # Test 3: Get admin stats
        success, stats = self.test_get_admin_stats()
        
        # Test 4: Toggle functionality (if we have items)
        if admin_items:
            first_item = admin_items[0]
            original_enabled = first_item.get('enabled', True)
            
            # Toggle once
            success, toggled_item = self.test_toggle_item(first_item['key'])
            if success:
                # Toggle back to original state
                self.test_toggle_item(first_item['key'])
        
        # Test 5: Create new item
        success, created_item = self.test_create_item()
        created_key = None
        if success:
            created_key = created_item.get('key')
            
            # Test 6: Update the created item
            if created_key:
                self.test_update_item(created_key)
        
        # Test 7: Reorder items (if we have enough)
        if len(admin_items) >= 2:
            self.test_reorder_items(admin_items)
        
        # Test 8: Delete the created item
        if created_key:
            self.test_delete_item(created_key)
        
        # Test 9: Reset to defaults (this should be last as it clears custom items)
        self.test_reset_to_defaults()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

def main():
    tester = TickerAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())