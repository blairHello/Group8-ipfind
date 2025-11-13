document.getElementById("yr").textContent = new Date().getFullYear();

// --- Map setup ---
const map = L.map('miniMap').setView([14.6, 120.98], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);
let marker = null;

// --- IP Lookup ---
async function getMyIP() {
  const res = await fetch("https://api.ipify.org?format=json");
  const data = await res.json();
  return data.ip;
}

async function lookupIP(ip) {
  document.getElementById("ipOut").textContent = "Loading…";
  try {
    const target = ip || await getMyIP();
    const geo = await fetch(`https://ipapi.co/${target}/json/`).then(r => r.json());
    document.getElementById("ipOut").textContent = geo.ip || target;
    document.getElementById("typeOut").textContent = target.includes(":") ? "IPv6" : "IPv4";
    document.getElementById("cityOut").textContent = geo.city || "—";
    document.getElementById("regionOut").textContent = geo.region || "—";
    document.getElementById("countryOut").textContent = geo.country_name || "—";
    document.getElementById("ispOut").textContent = geo.org || "—";

    if (geo.latitude && geo.longitude) {
      if (marker) marker.remove();
      marker = L.marker([geo.latitude, geo.longitude]).addTo(map);
      map.setView([geo.latitude, geo.longitude], 8);
    }
  } catch (err) {
    alert("Failed to fetch IP data");
  }
}

document.getElementById("lookupBtn").addEventListener("click", () => lookupIP(document.getElementById("ipInput").value));
document.getElementById("myIpBtn").addEventListener("click", () => lookupIP(""));


document.getElementById("calcSubnet").addEventListener("click", () => {
  const cidr = document.getElementById("subnetInput").value.trim();
  try {
    const [ip, prefix] = cidr.split("/");
    const bits = parseInt(prefix);
    if (isNaN(bits) || bits < 0 || bits > 32) throw "Invalid prefix";
    const ipParts = ip.split(".").map(Number);
    const ipNum = (ipParts[0]<<24)|(ipParts[1]<<16)|(ipParts[2]<<8)|ipParts[3];
    const mask = (0xFFFFFFFF << (32 - bits)) >>> 0;
    const netAddr = ipNum & mask;
    const bcastAddr = netAddr | (~mask >>> 0);
    const totalHosts = bits === 32 ? 1 : Math.pow(2, 32 - bits) - 2;
    const toIP = n => [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join(".");
    document.getElementById("netAddr").textContent = toIP(netAddr);
    document.getElementById("bcastAddr").textContent = toIP(bcastAddr);
    document.getElementById("maskAddr").textContent = toIP(mask);
    document.getElementById("hostRange").textContent = bits === 32 ? "Single Host" : `${toIP(netAddr+1)} - ${toIP(bcastAddr-1)}`;
    document.getElementById("totalHosts").textContent = totalHosts;
  } catch (err) {
    alert("Invalid CIDR format (use e.g. 192.168.1.0/24)");
  }
});

// --- Network Diagnostic (client-side simulation) ---

document.getElementById("pingBtn").addEventListener("click", async () => {
  const target = document.getElementById("diagInput").value.trim();
  if (!target) return alert("Enter a valid domain or IP");
  document.getElementById("diagOutput").textContent = `Pinging ${target} ...\n(Simulated client ping)\nSuccess ✓`;
});

document.getElementById("dnsBtn").addEventListener("click", async () => {
  const target = document.getElementById("diagInput").value.trim();
  if (!target) return alert("Enter a valid domain or IP");
  document.getElementById("diagOutput").textContent = "Looking up DNS...";
  try {
    const res = await fetch(`https://dns.google/resolve?name=${target}`);
    const data = await res.json();
    const answers = (data.Answer || []).map(a => `${a.name} → ${a.data}`).join("\n") || "No results";
    document.getElementById("diagOutput").textContent = answers;
  } catch (err) {
    document.getElementById("diagOutput").textContent = "DNS lookup failed.";
  }
});

// IP Validation functions
const reV4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const reV6 = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

function isValidPublicIP(ip) {
  // Check for private IP ranges
  if (reV4.test(ip)) {
    const parts = ip.split('.').map(Number);
    // 10.0.0.0/8
    if (parts[0] === 10) return false;
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return false;
    // 127.0.0.0/8 (loopback)
    if (parts[0] === 127) return false;
    // 169.254.0.0/16 (link-local)
    if (parts[0] === 169 && parts[1] === 254) return false;
  }
  return true;
}

function showError(message) {
  clearError();
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.color = 'red';
  errorDiv.style.fontSize = '0.9em';
  errorDiv.style.marginTop = '5px';
  document.getElementById('ipInput').parentNode.appendChild(errorDiv);
}

function clearError() {
  const existingError = document.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
}

function validateIP(ip) {
  if (!ip.trim()) {
    return 'Please enter an IP address';
  }
  
  if (!reV4.test(ip) && !reV6.test(ip)) {
    return 'Please enter a valid IPv4 or IPv6 address';
  }
  
  if (!isValidPublicIP(ip)) {
    return 'Please enter a public IP address (private/reserved IPs are not allowed)';
  }
  
  return null; // No error
}

// Real-time validation
const ipInput = document.getElementById('ipInput');
ipInput.addEventListener('input', function() {
  const error = validateIP(this.value);
  if (error && this.value.trim() !== '') {
    showError(error);
  } else {
    clearError();
  }
});

// "My IP" button functionality
document.getElementById('myIpBtn').addEventListener('click', function() {
  ipInput.value = '';
  clearError();
});