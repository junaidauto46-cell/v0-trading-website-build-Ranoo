#!/usr/bin/env python3
"""
CryptoHaven Backend API Testing Suite
Tests all major API endpoints and workflows
"""

import requests
import sys
import json
import time
from datetime import datetime

class CryptoHavenAPITester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            'name': name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat()
        })

    def make_request(self, method, endpoint, data=None, token=None, expected_status=200):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            return success, response.status_code, response.json() if response.content else {}
            
        except Exception as e:
            return False, 0, {'error': str(e)}

    def test_health_check(self):
        """Test health check endpoint"""
        success, status, response = self.make_request('GET', 'health')
        self.log_test("Health Check", success and response.get('success', False))
        return success

    def test_api_info(self):
        """Test API info endpoint"""
        success, status, response = self.make_request('GET', '')
        self.log_test("API Info", success and response.get('success', False))
        return success

    def test_user_registration(self):
        """Test user registration"""
        timestamp = int(time.time())
        test_data = {
            "name": "Test User",
            "email": f"testuser{timestamp}@example.com",
            "password": "TestPassword123!"
        }
        
        success, status, response = self.make_request('POST', 'auth/register', test_data, expected_status=201)
        
        if success and response.get('success'):
            self.access_token = response.get('data', {}).get('accessToken')
            self.refresh_token = response.get('data', {}).get('refreshToken')
            self.user_id = response.get('data', {}).get('user', {}).get('id')
            self.log_test("User Registration", True)
            return True
        else:
            self.log_test("User Registration", False, f"Status: {status}, Response: {response}")
            return False

    def test_user_login(self):
        """Test user login"""
        timestamp = int(time.time())
        login_data = {
            "email": f"testuser{timestamp}@example.com",
            "password": "TestPassword123!"
        }
        
        success, status, response = self.make_request('POST', 'auth/login', login_data)
        
        if success and response.get('success'):
            self.access_token = response.get('data', {}).get('accessToken')
            self.refresh_token = response.get('data', {}).get('refreshToken')
            self.log_test("User Login", True)
            return True
        else:
            self.log_test("User Login", False, f"Status: {status}, Response: {response}")
            return False

    def test_admin_login(self):
        """Test admin login"""
        admin_data = {
            "email": "admin@cryptohaven.com",
            "password": "SecureAdminPassword123!"
        }
        
        success, status, response = self.make_request('POST', 'auth/login', admin_data)
        
        if success and response.get('success'):
            self.admin_token = response.get('data', {}).get('accessToken')
            self.log_test("Admin Login", True)
            return True
        else:
            self.log_test("Admin Login", False, f"Status: {status}, Response: {response}")
            return False

    def test_protected_endpoint_without_token(self):
        """Test accessing protected endpoint without token"""
        success, status, response = self.make_request('GET', 'auth/profile', expected_status=401)
        self.log_test("Protected Endpoint Without Token", success)
        return success

    def test_user_profile(self):
        """Test getting user profile"""
        if not self.access_token:
            self.log_test("User Profile", False, "No access token available")
            return False
            
        success, status, response = self.make_request('GET', 'auth/profile', token=self.access_token)
        self.log_test("User Profile", success and response.get('success', False))
        return success

    def test_deposit_addresses(self):
        """Test getting deposit addresses"""
        if not self.access_token:
            self.log_test("Deposit Addresses", False, "No access token available")
            return False
            
        success, status, response = self.make_request('GET', 'deposits/addresses', token=self.access_token)
        self.log_test("Deposit Addresses", success and response.get('success', False))
        return success

    def test_create_deposit(self):
        """Test creating a deposit"""
        if not self.access_token:
            self.log_test("Create Deposit", False, "No access token available")
            return False
            
        deposit_data = {
            "txid": "0xtest123456789",  # Made longer to meet minimum requirement
            "chain": "ERC20",
            "amount_usd": 100,
            "coin": "USDT"
        }
        
        success, status, response = self.make_request('POST', 'deposits', deposit_data, token=self.access_token, expected_status=201)
        self.log_test("Create Deposit", success and response.get('success', False))
        return success

    def test_deposit_history(self):
        """Test getting deposit history"""
        if not self.access_token:
            self.log_test("Deposit History", False, "No access token available")
            return False
            
        success, status, response = self.make_request('GET', 'deposits', token=self.access_token)
        self.log_test("Deposit History", success and response.get('success', False))
        return success

    def test_investment_plans(self):
        """Test getting investment plans"""
        if not self.access_token:
            self.log_test("Investment Plans", False, "No access token available")
            return False
            
        success, status, response = self.make_request('GET', 'investments/plans', token=self.access_token)
        self.log_test("Investment Plans", success and response.get('success', False))
        return success

    def test_create_investment(self):
        """Test creating an investment (should fail due to insufficient balance)"""
        if not self.access_token:
            self.log_test("Create Investment", False, "No access token available")
            return False
            
        investment_data = {
            "plan_id": "1",  # Fixed field name
            "amount_usd": 50  # Fixed field name
        }
        
        success, status, response = self.make_request('POST', 'investments', investment_data, token=self.access_token, expected_status=400)
        # This should fail due to insufficient balance, so we expect a 400 status
        self.log_test("Create Investment (Expected Failure)", success)
        return success

    def test_admin_dashboard_stats(self):
        """Test admin dashboard statistics"""
        if not self.admin_token:
            self.log_test("Admin Dashboard Stats", False, "No admin token available")
            return False
            
        success, status, response = self.make_request('GET', 'admin/dashboard', token=self.admin_token)
        self.log_test("Admin Dashboard Stats", success and response.get('success', False))
        return success

    def test_admin_all_deposits(self):
        """Test getting all deposits for admin"""
        if not self.admin_token:
            self.log_test("Admin All Deposits", False, "No admin token available")
            return False
            
        success, status, response = self.make_request('GET', 'admin/deposits', token=self.admin_token)
        self.log_test("Admin All Deposits", success and response.get('success', False))
        return success

    def test_token_refresh(self):
        """Test token refresh mechanism"""
        if not self.refresh_token:
            self.log_test("Token Refresh", False, "No refresh token available")
            return False
            
        refresh_data = {"refreshToken": self.refresh_token}
        success, status, response = self.make_request('POST', 'auth/refresh', refresh_data)
        
        if success and response.get('success'):
            self.access_token = response.get('data', {}).get('accessToken')
            self.log_test("Token Refresh", True)
            return True
        else:
            self.log_test("Token Refresh", False, f"Status: {status}, Response: {response}")
            return False

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        invalid_data = {
            "email": "invalid@example.com",
            "password": "wrongpassword"
        }
        
        success, status, response = self.make_request('POST', 'auth/login', invalid_data, expected_status=401)
        self.log_test("Invalid Login", success)
        return success

    def test_duplicate_registration(self):
        """Test duplicate user registration"""
        duplicate_data = {
            "name": "Test User",
            "email": "testuser@example.com",
            "password": "TestPassword123!"
        }
        
        success, status, response = self.make_request('POST', 'auth/register', duplicate_data, expected_status=400)
        self.log_test("Duplicate Registration", success)
        return success

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting CryptoHaven Backend API Tests")
        print("=" * 50)
        
        # Basic connectivity tests
        self.test_health_check()
        self.test_api_info()
        
        # Authentication tests
        self.test_user_registration()
        self.test_user_login()
        self.test_admin_login()
        
        # Security tests
        self.test_protected_endpoint_without_token()
        self.test_invalid_login()
        self.test_duplicate_registration()
        
        # User functionality tests
        self.test_user_profile()
        self.test_deposit_addresses()
        self.test_create_deposit()
        self.test_deposit_history()
        self.test_investment_plans()
        self.test_create_investment()
        
        # Admin functionality tests
        self.test_admin_dashboard_stats()
        self.test_admin_all_deposits()
        
        # Token management tests
        self.test_token_refresh()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("❌ Some tests failed. Check the details above.")
            failed_tests = [test for test in self.test_results if not test['success']]
            print("\nFailed Tests:")
            for test in failed_tests:
                print(f"  - {test['name']}: {test['details']}")
            return 1

def main():
    """Main test runner"""
    tester = CryptoHavenAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())