#!/usr/bin/env python3
"""
Windows-compatible CI setup script
"""

import os
import sys
import subprocess
import importlib

def run_command(command, check=True):
    """Run a command and return the result"""
    print(f"🚀 Running: {command}")
    try:
        result = subprocess.run(command, shell=True, check=check, 
                              capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        if result.stderr and result.returncode != 0:
            print(f"⚠️  {result.stderr}")
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"❌ Command failed: {e}")
        return False

def main():
    print("🚀 Setting up CI environment for Windows...")
    
    # Check current directory
    print(f"📁 Current directory: {os.getcwd()}")
    print("📁 Directory contents:")
    for item in os.listdir('.'):
        print(f"   {item}")

    # Upgrade pip
    print("\n📦 Upgrading pip...")
    run_command("python -m pip install --upgrade pip")

    # Install project dependencies
    print("\n📦 Installing project dependencies...")
    if os.path.exists("requirements.txt"):
        print("✅ Found requirements.txt")
        run_command("pip install -r requirements.txt")
    else:
        print("⚠️  requirements.txt not found, installing basic dependencies...")
        run_command("pip install flask requests ipaddress")

    # Install test dependencies
    print("\n📦 Installing test dependencies...")
    if os.path.exists("requirements-test.txt"):
        print("✅ Found requirements-test.txt")
        run_command("pip install -r requirements-test.txt")
    else:
        print("⚠️  requirements-test.txt not found, installing test dependencies...")
        run_command("pip install pytest pytest-cov flask-testing requests")

    # Install additional testing packages
    print("\n📦 Installing additional test packages...")
    run_command("pip install pytest pytest-cov flake8")

    # Verify installations
    print("\n🔍 Verifying installations...")
    packages = ['flask', 'pytest', 'requests']
    for package in packages:
        try:
            importlib.import_module(package)
            print(f"✅ {package} installed")
        except ImportError:
            print(f"❌ {package} failed to import")

    # Check if we can import the app
    print("\n🔍 Testing app import...")
    try:
        # Add parent directory to path
        sys.path.insert(0, '..')
        sys.path.insert(0, '.')
        
        from app import app, is_valid_public_ip
        print("✅ App imported successfully")
    except ImportError as e:
        print(f"❌ App import failed: {e}")
        # Try direct import
        try:
            import importlib.util
            spec = importlib.util.spec_from_file_location("app_module", "app.py")
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            print("✅ App imported via alternative method")
        except Exception as e2:
            print(f"❌ Alternative import also failed: {e2}")

    # Run tests
    print("\n🧪 Running tests...")
    
    # Change to test directory if it exists
    test_dir = "test"
    original_dir = os.getcwd()
    
    if os.path.exists(test_dir) and os.path.isdir(test_dir):
        os.chdir(test_dir)
        print(f"📁 Changed to test directory: {os.getcwd()}")

    # Run unit tests
    print("\n=== Running Unit Tests ===")
    run_command("python -m unittest test_ipfind.py -v", check=False)

    # Run security tests if they exist
    if os.path.exists("test_security.py"):
        print("\n=== Running Security Tests ===")
        run_command("python -m unittest test_security.py -v", check=False)

    # Run performance tests if they exist
    if os.path.exists("test_performance.py"):
        print("\n=== Running Performance Tests ===")
        run_command("python -m unittest test_performance.py -v", check=False)

    # Run with pytest for coverage
    print("\n=== Running pytest with Coverage ===")
    run_command("pytest --cov=../app --cov-report=term-missing -v", check=False)

    # Return to original directory
    os.chdir(original_dir)

    print("\n✅ CI setup complete!")

if __name__ == "__main__":
    main()