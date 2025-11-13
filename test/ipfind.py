import requests
import re
import ipaddress
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://127.0.0.1:5000"]}})


def is_valid_public_ip(ip):                         
    re_v4 = re.compile(
        r'^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$')
    re_v6 = re.compile(r'^[0-9a-fA-F:]+$')

    if not ip:
        return False, "No IP address provided"

    is_ipv4 = bool(re_v4.match(ip))
    is_ipv6 = bool(re_v6.match(ip) and ':' in ip)

    if not is_ipv4 and not is_ipv6:
        return False, "Invalid IP address format"

    if is_ipv4:
        octets = [int(x) for x in ip.split('.')]
        if (octets[0] == 10 or
            (octets[0] == 172 and 16 <= octets[1] <= 31) or
            (octets[0] == 192 and octets[1] == 168) or
            (octets[0] == 169 and octets[1] == 254) or
            (octets[0] == 127) or
            (octets[0] == 0) or
            (224 <= octets[0] <= 239) or
                (240 <= octets[0] <= 255)):
            return False, "Private, reserved, or special-use IP addresses are not allowed"

    return True, "Valid public IP"


@app.route("/", methods=["GET", "POST"])
def home():
    # Public IPs
    ipv4 = requests.get("https://api.ipify.org").text
    ipv6 = requests.get("https://api64.ipify.org").text

    # --- Safely handle initial IPAPI request ---
    try:
        r = requests.get(f"https://ipapi.co/{ipv4}/json/")
        if r.headers.get("Content-Type", "").startswith("application/json"):
            details = r.json()
        else:
            details = {}
    except requests.exceptions.JSONDecodeError:
        details = {}
    except requests.exceptions.RequestException as e:
        print("⚠️ Network error while fetching IP details:", e)
        details = {}

    client_ip = request.remote_addr
    user_ip = None
    user_details = None
    ip_version = None

    if request.method == "POST":
        user_ip = request.form.get("IpIn")
        print(f"📨 Received POST request with IP: {user_ip}")

        if user_ip:
            print("🔄 Fetching details from IP API...")
            try:
                resp = requests.get(f"https://ipapi.co/{user_ip}/json/")
                if resp.headers.get("Content-Type", "").startswith("application/json"):
                    user_details = resp.json()
                else:
                    user_details = {"error": "Non-JSON response from API"}
            except requests.exceptions.JSONDecodeError:
                user_details = {"error": "Failed to parse JSON from API"}
            except requests.exceptions.RequestException as e:
                user_details = {"error": str(e)}

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


# 🧩 New Route: CORS-safe proxy for frontend requests
@app.route("/get_ipinfo/<ip>")
def get_ipinfo(ip):
    """Proxy request to ipapi.co to bypass CORS restrictions"""
    try:
        resp = requests.get(f"https://ipapi.co/{ip}/json/")
        if resp.headers.get("Content-Type", "").startswith("application/json"):
            data = resp.json()
            return jsonify(data)
        else:
            return jsonify({"error": "Non-JSON response from API"}), 502
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
