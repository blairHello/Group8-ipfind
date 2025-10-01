import requests
import re
import ipaddress
from flask import Flask, render_template, request

app = Flask(__name__)

def is_valid_public_ip(ip):
    """Validate IP address and ensure it's public"""
    
    re_v4 = re.compile(r'^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$')

    re_v6 = re.compile(r'^[0-9a-fA-F:]+$')  
    
    if not ip:
        return False, "No IP address provided"

    is_ipv4 = bool(re_v4.match(ip))
    is_ipv6 = bool(re_v6.match(ip) and ':' in ip)

    if not is_ipv4 and not is_ipv6:
        return False, "Invalid IP address format"
    
    # Check for private/reserved ranges
    if is_ipv4:
        octets = [int(x) for x in ip.split('.')]
        # Private ranges
        if (octets[0] == 10 or
            (octets[0] == 172 and 16 <= octets[1] <= 31) or
            (octets[0] == 192 and octets[1] == 168) or
            (octets[0] == 169 and octets[1] == 254) or  # Link-local
            (octets[0] == 127) or  # Loopback
            (octets[0] == 0) or  # Current network
            (224 <= octets[0] <= 239) or  # Multicast
            (240 <= octets[0] <= 255)):  # Reserved
            return False, "Private, reserved, or special-use IP addresses are not allowed"
    
    return True, "Valid public IP"

@app.route("/", methods=["GET", "POST"])
def home():

    # Public IPs
    ipv4 = requests.get("https://api.ipify.org").text
    ipv6 = requests.get("https://api64.ipify.org").text
    details = requests.get(f"https://ipapi.co/{ipv4}/json/").json()

    client_ip = request.remote_addr
    user_ip = None
    user_details = None

    if request.method == "POST":
        user_ip = request.form.get("IpIn")
        print(f"📨 Received POST request with IP: {user_ip}")  # Log received IP

        if user_ip:
            print("🔄 Fetching details from IP API...")
            user_details = requests.get(
                f"https://ipapi.co/{user_ip}/json/").json()
            print("Inputted IP:", user_ip)
            print(f"📋 API Response: {user_details}")
            details = user_details
    
    ip_version = None  # This will hold '4', '6', or None

    if request.method == "POST":
        user_ip = request.form.get("IpIn")
        if user_ip:
            try:
                # Use ipaddress to check the version of the inputted IP
                ip_obj = ipaddress.ip_address(user_ip)
                ip_version = ip_obj.version  # This will be 4 or 6
                # Fetch details for the looked-up IP
                details = requests.get(f"https://ipapi.co/{user_ip}/json/").json()
            except ValueError:
                # Handle invalid IP address
                print("Invalid IP address provided")
                ip_version = None

    # If it's a GET request or no user lookup, check the version of the public IPv4
    # You might want to adjust this logic depending on your needs.
    if not ip_version:
        try:
            ip_obj = ipaddress.ip_address(ipv4)
            ip_version = ip_obj.version
        except ValueError:
            ip_version = None
         #  Debug

    print("Client IP (Flask):", client_ip)
    print("Public IPv4 (ipify):", ipv4)
    print("Public IPv6 (ipify):", ipv6)
    print("IP Details (ipapi):", details)

    return render_template(
        "index.html",

        # for searched
        ip=details.get("ip", "—"),
        
        # for local
        ipv4=ipv4,
        ipv6=ipv6,
        city=details.get("city", "—"),
        region=details.get("region", "—"),
        country=details.get("country_name", "—"),
        isp=details.get("org", "—"),
        asn=details.get("asn", "—"),
        ccode=details.get("country_code", "—"),
        user_ip=user_ip,
        details=details,
        ip_versio=ip_version 
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
