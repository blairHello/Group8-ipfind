from flask import Flask, request
import socket
import requests

app = Flask(__name__)

@app.route("/")
def home():

    ipv4 = requests.get("https://api.ipify.org").text
    ipv6 = requests.get("https://api64.ipify.org").text
    details = requests.get(f"https://ipapi.co/{ipv4}/json/").json()
    
    # Client IP (direct from request headers / socket)
    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Get public IP (your machine’s IP as seen by ipapi)
    try:
        public_ip = requests.get("https://ipapi.co/ip/").text.strip()
        ip_details = requests.get(f"https://ipapi.co/{public_ip}/json/").json()
    except Exception as e:
        public_ip = "Error fetching public IP"
        ip_details = {"error": str(e)}

    # Get the device's hostname
    hostname = socket.gethostname()

    # Get the LAN IP of your machine
    lan_ip = socket.gethostbyname(hostname)

    print(f"My device hostname: {hostname}")
    print(f"My device LAN IP: {lan_ip}")

    # Debug prints in terminal
    print("Client IP (Flask):", client_ip)
    print("Public IP (ipapi):", public_ip)
    print("IP Details:", ip_details)

    # Response in browser
    return f"""
        <h2>Debugging IPs</h2>
        <p><b>Client IP (Flask):</b> {client_ip}</p>
        <p><b>Public IP (ipapi):</b> {public_ip}</p>
        <p><b>Hostname (ipapi):</b> {hostname}</p>
        <p><b>Private IP (ipapi):</b> {lan_ip}</p>
        <pre>{ip_details}</pre>
    """

if __name__ == "__main__":
    app.run(debug=True)
