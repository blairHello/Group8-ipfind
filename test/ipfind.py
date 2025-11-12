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
        return jsonify({"error": str(e)}), 500

@app.route('/ping/<target>')
def ping_host(target):
    """Ping a target safely and return the output."""
    try:
        param = "-n" if platform.system().lower() == "windows" else "-c"
        cmd = ["ping", param, "1", target]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=3)
        output = result.stdout or result.stderr
        return jsonify({"result": output})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/dns/<domain>')
def dns_lookup(domain):
    """Perform DNS lookup using dnspython."""
    try:
        resolver = dns.resolver.Resolver()
        answers = resolver.resolve(domain, "A")
        records = [r.to_text() for r in answers]
        return jsonify({"domain": domain, "records": records})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- MAIN ----------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
