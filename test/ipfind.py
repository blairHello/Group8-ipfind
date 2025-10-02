import requests
from flask import Flask, render_template, request

app = Flask(__name__)


@app.route("/", methods=["GET", "POST"])
def home():
    # Private IP (LAN)
    client_ip = request.remote_addr

    # Initialize with default values
    ipv4 = "—"
    ipv6 = "—"
    details = {}

    try:
        # Public IPs with timeout and error handling
        ipv4 = requests.get("https://api.ipify.org", timeout=5).text
        ipv6 = requests.get("https://api64.ipify.org", timeout=5).text

        # Get details with proper error checking
        details_response = requests.get(
            f"https://ipapi.co/{ipv4}/json/", timeout=5)

        # Check if response is valid JSON before parsing
        if details_response.status_code == 200 and details_response.text.strip():
            details = details_response.json()
        else:
            print(
                f"ipapi.co returned status {details_response.status_code} or empty response")
            details = {}

    except requests.exceptions.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        # Debug first 200 chars
        print(f"Response content: {details_response.text[:200]}")
        details = {}
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        details = {}
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
                "asn": data.get("asn", "—").split()[0] if data.get("as") else "—",
                "country_code": data.get("country_code", "—")
            }
        return {}
    except:
        return {}
    

  


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
