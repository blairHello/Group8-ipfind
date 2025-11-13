from flask import Flask, jsonify, render_template, send_from_directory, request
import socket
import requests
import re
import ipaddress
import subprocess
import platform
import dns.resolver

app = Flask(__name__, static_folder=".", template_folder=".")

def is_valid_public_ip(ip):
    """Validate IP address and ensure it's public"""
    re_v4 = re.compile(
        r'^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$')
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
# ---------- FRONTEND ROUTES ----------
@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/proj6.css')
def serve_css():
    return send_from_directory('.', 'proj6.css')

@app.route('/proj6.js')
def serve_js():
    return send_from_directory('.', 'proj6.js')

# ---------- API ROUTES ----------
@app.route('/myip')
def my_ip():
    """Return the client’s public IP."""
    ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    return jsonify({"ip": ip})

@app.route('/lookup/<ip>')
def lookup_ip(ip):
    """Get geolocation info for an IP using ipapi.co"""
    try:
        response = requests.get(f"https://ipapi.co/{ip}/json/")
        return jsonify(response.json())
    except Exception as e:
        print(f"Unexpected error: {e}")
        details = {}

    client_ip = request.remote_addr
    ip_version = None
    user_details = {}

    if request.method == "POST":
        user_ip = request.form.get("IpIn")
        print(f"📨 Received POST request with IP: {user_ip}")

        if user_ip:
            print("🔄 Fetching details from IP API...")
            user_details = requests.get(f"https://ipapi.co/{user_ip}/json/").json()
            print("Inputted IP:", user_ip)
            print(f"📋 API Response: {user_details}")
            details = user_details

            try:
                ip_obj = ipaddress.ip_address(user_ip)
                ip_version = ip_obj.version
            except ValueError:
                print("Invalid IP address provided")
                ip_version = None

    if not ip_version:
        try:
            ip_obj = ipaddress.ip_address(ipv4)
            ip_version = ip_obj.version
        except ValueError:
            ip_version = None

    print("Client IP (Flask):", client_ip)
    print("Public IPv4 (ipify):", ipv4)
    print("Public IPv6 (ipify):", ipv6)
    print("IP Details (ipapi):", details)
            try:
                user_response = requests.get(
                    f"https://ipapi.co/{user_ip}/json/", timeout=5)
                if user_response.status_code == 200 and user_response.text.strip():
                    user_details = user_response.json()
                else:
                    print(
                        f"User IP API returned status {user_response.status_code}")
                    user_details = {}
            except requests.exceptions.JSONDecodeError as e:
                print(f"User IP JSON decode error: {e}")
                user_details = {}
            except Exception as e:
                print(f"User IP error: {e}")
                user_details = {}

    # Use user_details if available and valid, otherwise use default details
    display_details = user_details if user_details and isinstance(
        user_details, dict) else details

    print("Final display_details:", display_details)  # Debug

    return render_template(
        "index.html",
        ip=details.get("ip", "—"),
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
        ip_version=ip_version
    )


def get_ip_details_fallback(ip_address):
    try:
        response = requests.get(
            f"http://ip-api.com/json/{ip_address}", timeout=5)
        if response.status_code == 200:
            data = response.json()
            return {
                "city": data.get("city", "—"),
                "region": data.get("regionName", "—"),
                "country_name": data.get("country", "—"),
                "org": data.get("isp", "—"),
                "asn": data.get("as", "—").split()[0] if data.get("as") else "—",
                "country_code": data.get("countryCode", "—")
            }
        return {}
    except:
        return {}
    

  


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)