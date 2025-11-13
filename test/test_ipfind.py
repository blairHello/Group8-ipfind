import unittest
from unittest.mock import patch, MagicMock
import sys
import os

# Add the parent directory to the path to import your actual app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import your actual Flask app - adjust based on your file structure
try:
    from ipfind import app, is_valid_public_ip
except ImportError:
    # If your main file has a different name or structure
    try:
        import importlib.util
        spec = importlib.util.spec_from_file_location("ipfind", "../app.py")
        ipfind = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(ipfind)
        app = ipfind.app
        is_valid_public_ip = ipfind.is_valid_public_ip
    except Exception as e:
        print(f"Error importing app: {e}")
        # Fallback - create minimal app for testing
        from flask import Flask
        app = Flask(__name__)
        def is_valid_public_ip(ip):
            return True, "Test validation"

class TestIPValidation(unittest.TestCase):
    
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
    
    def test_valid_public_ipv4(self):
        """Test valid public IPv4 addresses"""
        valid_ips = ["8.8.8.8", "1.1.1.1", "208.67.222.222"]
        for ip in valid_ips:
            with self.subTest(ip=ip):
                is_valid, message = is_valid_public_ip(ip)
                self.assertTrue(is_valid)
                self.assertEqual(message, "Valid public IP")
    
    def test_invalid_private_ipv4(self):
        """Test private IPv4 addresses are rejected"""
        private_ips = [
            "10.0.0.1",
            "172.16.0.1", 
            "192.168.1.1",
            "169.254.0.1",
            "127.0.0.1"
        ]
        for ip in private_ips:
            with self.subTest(ip=ip):
                is_valid, message = is_valid_public_ip(ip)
                self.assertFalse(is_valid)
                self.assertIn("not allowed", message)
    
    def test_invalid_ip_formats(self):
        """Test invalid IP formats"""
        invalid_ips = ["invalid", "256.256.256.256", "192.168.1", ""]
        for ip in invalid_ips:
            with self.subTest(ip=ip):
                is_valid, message = is_valid_public_ip(ip)
                self.assertFalse(is_valid)
    
    def test_empty_ip(self):
        """Test empty IP address"""
        is_valid, message = is_valid_public_ip(None)
        self.assertFalse(is_valid)
        self.assertEqual(message, "No IP address provided")

class TestAppRoutes(unittest.TestCase):
    
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
    
    @patch('ipfind.requests.get')
    def test_home_route_get(self, mock_requests):
        """Test GET request to home route"""
        # Mock external API responses
        mock_ipv4_response = MagicMock()
        mock_ipv4_response.text = "203.0.113.1"
        
        mock_ipv6_response = MagicMock()
        mock_ipv6_response.text = "2001:db8::1"
        
        mock_details_response = MagicMock()
        mock_details_response.json.return_value = {
            "ip": "203.0.113.1",
            "city": "Test City",
            "region": "Test Region",
            "country_name": "Test Country",
            "org": "Test ISP",
            "asn": "AS12345",
            "country_code": "TC"
        }
        
        mock_requests.side_effect = [
            mock_ipv4_response,    # ipify.org for IPv4
            mock_ipv6_response,    # ipify.org for IPv6
            mock_details_response  # ipapi.co for details
        ]
        
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        # Test for content that should be in your page
        self.assertIn(b'Just Type (IP)', response.data)
    
    @patch('ipfind.requests.get')
    def test_home_route_post_valid_ip(self, mock_requests):
        """Test POST request with valid IP"""
        # Mock responses
        mock_ipv4_response = MagicMock()
        mock_ipv4_response.text = "203.0.113.1"
        
        mock_ipv6_response = MagicMock()
        mock_ipv6_response.text = "2001:db8::1"
        
        mock_details_response = MagicMock()
        mock_details_response.json.return_value = {
            "ip": "8.8.8.8",
            "city": "Mountain View",
            "region": "California", 
            "country_name": "United States",
            "org": "Google LLC",
            "asn": "AS15169",
            "country_code": "US"
        }
        
        mock_requests.side_effect = [
            mock_ipv4_response,
            mock_ipv6_response,  
            mock_details_response,
            mock_details_response
        ]
        
        # Since your app uses JavaScript, test that it handles POST without crashing
        response = self.app.post('/', data={'IpIn': '8.8.8.8'})
        self.assertEqual(response.status_code, 200)
    
    @patch('ipfind.requests.get') 
    def test_home_route_post_invalid_ip(self, mock_requests):
        """Test POST request with invalid IP"""
        mock_ipv4_response = MagicMock()
        mock_ipv4_response.text = "203.0.113.1"
        
        mock_ipv6_response = MagicMock()
        mock_ipv6_response.text = "2001:db8::1"
        
        mock_details_response = MagicMock()
        mock_details_response.json.return_value = {
            "ip": "203.0.113.1",
            "city": "Test City",
            "region": "Test Region",
            "country_name": "Test Country", 
            "org": "Test ISP",
            "asn": "AS12345",
            "country_code": "TC"
        }
        
        mock_requests.side_effect = [
            mock_ipv4_response,
            mock_ipv6_response,
            mock_details_response
        ]
        
        response = self.app.post('/', data={'IpIn': 'invalid_ip'})
        self.assertEqual(response.status_code, 200)

class TestIntegration(unittest.TestCase):
    
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
    
    def test_response_headers(self):
        """Test response headers and content type"""
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('text/html', response.content_type)
    
    def test_page_content(self):
        """Test that key content is present in the response"""
        response = self.app.get('/')
        # Test for content that should definitely be in your page
        self.assertIn(b'Just Type (IP)', response.data)
        self.assertIn(b'IP Lookup', response.data)
        self.assertIn(b'Network Diagnostic', response.data)

class TestSecurity(unittest.TestCase):
    
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
    
    def test_sql_injection_prevention(self):
        """Test that SQL injection attempts are handled safely"""
        injection_attempts = [
            "8.8.8.8'; DROP TABLE users;--",
            "1' OR '1'='1", 
            "\\' OR 1=1 --"
        ]
        
        for attempt in injection_attempts:
            with self.subTest(attempt=attempt):
                response = self.app.post('/', data={'IpIn': attempt})
                self.assertEqual(response.status_code, 200)

if __name__ == '__main__':
    unittest.main()