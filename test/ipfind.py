import requests
from flask import Flask, render_template_string
import json
import re

app = Flask(__name__)

TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Device Info</title>
</head>
<body>
    <h1>Public IP Info</h1>
    <h2>IPv4:</h2> <p>{{ ipv4 }}</p>
    <h2>IPv6:</h2> <p>{{ ipv6 }}</p>
    <h2>Full Info:</h2>
    <pre>{{ info }}</pre>
</body>
</html>
"""

def get_ip_info():
    res = requests.get("https://ipapi.co/json/")
    return res.json()

def get_ipv4():
    res = requests.get("https://ipapi.co/ip/")
    return res.text.strip()

def get_ipv6():
    res = requests.get("https://ipapi.co/ipv6/")
    text = res.text.strip()

   
    if re.match(r"^([0-9a-fA-F:]+)$", text):
        return text
    else:
        return "No IPv6 detected"

@app.route("/")
def index():
    ipv4 = get_ipv4()
    ipv6 = get_ipv6()
    info = json.dumps(get_ip_info(), indent=4)  
    return render_template_string(TEMPLATE, ipv4=ipv4, ipv6=ipv6, info=info)

if __name__ == "__main__":
    app.run(debug=True)
