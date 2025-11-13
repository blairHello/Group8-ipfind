import unittest
from unittest.mock import patch, MagicMock
import sys
import os
import ipfind


sys.path.insert(0, os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..')))


try:
    from ipfind import app, is_valid_public_ip
except ImportError:
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


if __name__ == '__main__':
    unittest.main()
