from flask import Flask, jsonify, render_template, send_from_directory, request
import socket
import requests
import subprocess
import platform
import dns.resolver

app = Flask(__name__, static_folder=".", template_folder=".")

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

    user_ip = None
    user_details = {}

    if request.method == "POST":
        user_ip = request.form.get("ip_input")
        if user_ip:
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
        ipv4=ipv4,
        ipv6=ipv6,
        city=details.get("city", "Rate Limited"),
        region=details.get("region", "Rate Limited"),
        country=details.get("country_name", "Rate Limited"),
        isp=details.get("org", "Rate Limited"),
        asn=details.get("asn", "Rate Limited"),
        ccode=details.get("country_code", "Rate Limited"),
        user_ip=user_ip,
        user_details=user_details,
        details=details
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
