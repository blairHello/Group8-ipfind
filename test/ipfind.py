import requests
from flask import Flask, render_template, request

app = Flask(__name__)


@app.route("/", methods=["GET", "POST"])
def home():
    # Private IP (LAN)
    client_ip = request.remote_addr

    # Public IPs
    ipv4 = requests.get("https://api.ipify.org").text
    ipv6 = requests.get("https://api64.ipify.org").text
    details = requests.get(f"https://ipapi.co/{ipv4}/json/").json()

    user_ip = None
    user_details = None

    if request.method == "POST":
        user_ip = request.form.get("ip_input")
        if user_ip:
            user_details = requests.get(
                f"https://ipapi.co/{user_ip}/json/").json()

    #  Debug
    print("Client IP (Flask):", client_ip)
    print("Public IPv4 (ipify):", ipv4)
    print("Public IPv6 (ipify):", ipv6)
    print("IP Details (ipapi):", details)

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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
