document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('ipLookupForm');
    const ipInput = document.getElementById('ipIn');
    const errorDiv = document.getElementById('ipError');
    const lookupBtn = document.getElementById('lookup');

    // Regular expressions for IP validation
    const reV4 = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/;
    const reV6 = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3,3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3,3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$/i;

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        ipInput.style.borderColor = '#ff4444';
    }

    function clearError() {
        errorDiv.style.display = 'none';
        ipInput.style.borderColor = '';
    }

    function isValidPublicIP(ip) {
        if (!reV4.test(ip) && !reV6.test(ip)) {
            return false;
        }

        // Check for private, reserved, or special-use IP ranges
        if (reV4.test(ip)) {
            const octets = ip.split('.').map(Number);
            
            // Private ranges
            if (octets[0] === 10) return false; // 10.0.0.0/8
            if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return false; // 172.16.0.0/12
            if (octets[0] === 192 && octets[1] === 168) return false; // 192.168.0.0/16
            if (octets[0] === 169 && octets[1] === 254) return false; // Link-local 169.254.0.0/16
            
            // Reserved and special ranges
            if (octets[0] === 127) return false; // Loopback
            if (octets[0] === 0) return false; // Current network
            if (octets[0] === 255 && octets[1] === 255 && octets[2] === 255 && octets[3] === 255) return false; // Broadcast
            if (octets[0] >= 224 && octets[0] <= 239) return false; // Multicast
            if (octets[0] >= 240 && octets[0] <= 255) return false; // Reserved for future use
        }

        if (reV6.test(ip)) {
            const lowerIP = ip.toLowerCase();
            // IPv6 special addresses
            if (lowerIP === '::1') return false; // IPv6 loopback
            if (lowerIP.startsWith('fe80:')) return false; // Link-local
            if (lowerIP.startsWith('fc00:') || lowerIP.startsWith('fd00:')) return false; // Unique Local Address (ULA)
            if (lowerIP.startsWith('2001:db8:')) return false; // Documentation
            if (lowerIP.startsWith('ff00:')) return false; // Multicast
            if (lowerIP.startsWith('::ffff:')) {
                // IPv4-mapped IPv6 address - validate the embedded IPv4
                const ipv4Part = ip.split(':').pop();
                return isValidPublicIP(ipv4Part);
            }
        }

        return true;
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
    ipInput.addEventListener('input', function() {
        const error = validateIP(this.value);
        if (error && this.value.trim() !== '') {
            showError(error);
        } else {
            clearError();
        }
    });

    // Form submission validation
    form.addEventListener('submit', function(e) {
        const ipValue = ipInput.value.trim();
        const error = validateIP(ipValue);
        
        if (error) {
            e.preventDefault();
            showError(error);
            ipInput.focus();
        }
    });

    // "My IP" button functionality
    document.getElementById('mine').addEventListener('click', function() {
        ipInput.value = '';
        clearError();
        // You can optionally auto-fill with the user's IP if you have it
        // ipInput.value = '{{ ipv4 }}'; // If you want to pre-fill with their IPv4
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const ipInput = document.getElementById('ipIn');
    const errorDiv = document.getElementById('ipError');
    const typeIndicator = document.getElementById('ipType');

    function detectIPType(ip) {
        if (reV4.test(ip)) {
            return 'IPv4';
        } else if (reV6.test(ip)) {
            return 'IPv6';
        } else {
            return 'Unknown';
        }
    }

    function getSpecificErrorMessage(ip) {
        const ipType = detectIPType(ip);
        
        if (ipType === 'IPv4') {
            const octets = ip.split('.').map(Number);
            
            if (octets[0] === 10) return 'IPv4 private range (10.0.0.0/8) not allowed';
            if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return 'IPv4 private range (172.16.0.0/12) not allowed';
            if (octets[0] === 192 && octets[1] === 168) return 'IPv4 private range (192.168.0.0/16) not allowed';
            if (octets[0] === 127) return 'IPv4 loopback address (127.0.0.1) not allowed';
            if (octets[0] === 169 && octets[1] === 254) return 'IPv4 link-local address not allowed';
            if (octets[0] >= 224 && octets[0] <= 239) return 'IPv4 multicast address not allowed';
            
            return 'IPv4 address is not valid for lookup';
            
        } else if (ipType === 'IPv6') {
            const lowerIP = ip.toLowerCase();
            
            if (lowerIP === '::1') return 'IPv6 loopback address not allowed';
            if (lowerIP.startsWith('fe80:')) return 'IPv6 link-local address not allowed';
            if (lowerIP.startsWith('fc00:') || lowerIP.startsWith('fd00:')) return 'IPv6 unique local address (ULA) not allowed';
            if (lowerIP.startsWith('2001:db8:')) return 'IPv6 documentation address not allowed';
            if (lowerIP.startsWith('ff00:')) return 'IPv6 multicast address not allowed';
            
            return 'IPv6 address is not valid for lookup';
        }
        
        return 'Please enter a valid IPv4 or IPv6 address';
    }

    // Real-time type detection
    ipInput.addEventListener('input', function() {
        const ip = this.value.trim();
        
        if (ip === '') {
            typeIndicator.textContent = 'Enter an IPv4 or IPv6 address';
            typeIndicator.style.color = '#666';
            clearError();
            return;
        }
        
        const ipType = detectIPType(ip);
        
        if (ipType === 'IPv4') {
            typeIndicator.textContent = '✓ Valid IPv4 address';
            typeIndicator.style.color = '#4CAF50';
        } else if (ipType === 'IPv6') {
            typeIndicator.textContent = '✓ Valid IPv6 address';
            typeIndicator.style.color = '#4CAF50';
        } else {
            typeIndicator.textContent = '✗ Invalid IP format';
            typeIndicator.style.color = '#ff4444';
        }
        
        // Validate for errors
        const error = validateIP(ip);
        if (error && ip !== '') {
            showError(getSpecificErrorMessage(ip));
        } else {
            clearError();
        }
    });

    // Enhanced validation function
    function validateIP(ip) {
        if (!ip.trim()) return 'Please enter an IP address';
        
        const ipType = detectIPType(ip);
        if (ipType === 'Unknown') return 'Please enter a valid IPv4 or IPv6 address';
        
        if (!isValidPublicIP(ip)) return getSpecificErrorMessage(ip);
        
        return null; // No error
    }

    // Your existing showError and clearError functions...
    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        ipInput.style.borderColor = '#ff4444';
    }

    function clearError() {
        errorDiv.style.display = 'none';
        ipInput.style.borderColor = '';
    }
});

const $ = (s) => document.querySelector(s);
      const ipIn = $("#ip");
      const fields = {
        ip: $("#ipOut"),
        type: $("#typeOut"),
        city: $("#cityOut"),
        region: $("#regionOut"),
        country: $("#countryOut"),
        isp: $("#ispOut"),
      };
      $("#yr").textContent = new Date().getFullYear();

      // ── Settings drawer (Map API place) ──────────────────────────────────────────
      const drawer = $("#drawer");
      $("#openSettings").addEventListener("click", () =>
        drawer.classList.add("show")
      );
      $("#closeSettings").addEventListener("click", () =>
        drawer.classList.remove("show")
      );

      const providerSel = $("#provider");
      const apiKeyIn = $("#apiKey");

      // load saved
      const savedProvider = localStorage.getItem("tilesProvider") || "osm";
      const savedKey = localStorage.getItem("tilesKey") || "";
      providerSel.value = savedProvider;
      apiKeyIn.value = savedKey;

      $("#saveKey").addEventListener("click", () => {
        localStorage.setItem("tilesProvider", providerSel.value);
        localStorage.setItem("tilesKey", apiKeyIn.value.trim());
        drawer.classList.remove("show");
        reloadTiles();
      });
      $("#resetKey").addEventListener("click", () => {
        providerSel.value = "osm";
        apiKeyIn.value = "";
        localStorage.removeItem("tilesProvider");
        localStorage.removeItem("tilesKey");
        reloadTiles();
      });

      // ── Map init ────────────────────────────────────────────────────────────────
      let map, marker, tileLayer;
      function makeTileLayer() {
        const provider = localStorage.getItem("tilesProvider") || "osm";
        const key = localStorage.getItem("tilesKey") || "";

        if (provider === "maptiler" && key) {
          // MapTiler basic tiles (works nicely with Leaflet)
          const url = `https://api.maptiler.com/maps/basic-v2/256/{z}/{x}/{y}.png?key=${encodeURIComponent(
            key
          )}`;
          return L.tileLayer(url, {
            maxZoom: 19,
            attribution: "&copy; MapTiler &copy; OpenStreetMap",
          });
        }
        // Default: OSM
        return L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          { maxZoom: 19, attribution: "&copy; OpenStreetMap" }
        );
      }

      function initMap() {
        map = L.map("map", {
          zoomControl: true,
          attributionControl: false,
        }).setView([20, 0], 2);
        tileLayer = makeTileLayer().addTo(map);
      }

      function reloadTiles() {
        if (!map) return;
        if (tileLayer) tileLayer.remove();
        tileLayer = makeTileLayer().addTo(map);
      }

      initMap();

      // ── Validators ──────────────────────────────────────────────────────────────
      const reV4 =
        /^(25[0-5]|2[0-4]\d|[01]?\d\d?)(\.(25[0-5]|2[0-4]\d|[01]?\d\d?)){3}$/;
      const reV6 =
        /^(([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,7}:|([0-9a-f]{1,4}:){1,6}:[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,5}(:[0-9a-f]{1,4}){1,2}|([0-9a-f]{1,4}:){1,4}(:[0-9a-f]{1,4}){1,3}|([0-9a-f]{1,4}:){1,3}(:[0-9a-f]{1,4}){1,4}|([0-9a-f]{1,4}:){1,2}(:[0-9a-f]{1,4}){1,5}|[0-9a-f]{1,4}:((:[0-9a-f]{1,4}){1,6})|:((:[0-9a-f]{1,4}){1,7})|fe80:(:[0-9a-f]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3,3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)|([0-9a-f]{1,4}:){1,4}:((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3,3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?))$/i;

      function kind(ip) {
        if (!ip) return "Unknown";
        if (reV4.test(ip)) {
          const oct = ip.split(".").map((n) => +n);
          const priv =
            oct[0] === 10 ||
            (oct[0] === 172 && oct[1] >= 16 && oct[1] <= 31) ||
            (oct[0] === 192 && oct[1] === 168);
          const loop = oct[0] === 127;
          const link = oct[0] === 169 && oct[1] === 254;
          if (loop) return "IPv4 • loopback";
          if (priv) return "IPv4 • private";
          if (link) return "IPv4 • link-local";
          return "IPv4 • public";
        }
        if (reV6.test(ip)) {
          const lc = ip.toLowerCase();
          if (lc.startsWith("fe80")) return "IPv6 • link-local";
          if (lc.startsWith("fc") || lc.startsWith("fd"))
            return "IPv6 • unique local (ULA)";
          if (lc === "::1") return "IPv6 • loopback";
          return "IPv6 • global (public)";
        }
        return "Unrecognized";
      }

      // ── IP detection & lookup ───────────────────────────────────────────────────


      function paint(d) {
        fields.ip.textContent = d.ip ?? "—";
        fields.type.textContent = d.type ?? "—";
        fields.city.textContent = d.city ?? "—";
        fields.region.textContent = d.region ?? "—";
        fields.country.textContent = d.country ?? "—";
        fields.isp.textContent = d.isp ?? "—";
      }

      const mine = document.getElementById("mine"); // Or use querySelector

      if (mine) {
          mine.addEventListener("click", function() {
              window.location.reload(); // Standard reload is sufficient
          });
      } else {
          console.error("The 'mine' element was not found.");
      }

     document.addEventListener("DOMContentLoaded", () => {
    const ipIn = document.getElementById("ipIn");
    const lookupBtn = document.getElementById("lookup");

    lookupBtn.addEventListener("click", async () => {
        // If keeping async, ensure consistency with backend
        const formData = new FormData();
        formData.append('ip', ipIn.value);
        
        const response = await fetch("/", {
            method: "POST",
            body: formData
        });
        // Handle response
    });
});

      async function lookup(ip) {
  try {
    const res = await fetch("/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip })
    });

    if (!res.ok) throw new Error("Server error: " + res.status);

    const data = await res.json();
    console.log("Lookup result:", data);
    // update DOM with details here
  } catch (err) {
    console.error("Lookup failed:", err);
  }
}



      
      // Copy all
const field = {
    ip: document.getElementById("ip"),
    type: document.getElementById("type"),
    city: document.getElementById("city"),
    region: document.getElementById("region"),
    country: document.getElementById("country"),
    isp: document.getElementById("isp"),
    asn: document.getElementById("asn"),
    ccode: document.getElementById("ccode")
  };

  /*document.getElementById("copyAll").addEventListener("click", () => {
    const text = `IP: ${fields.ip.textContent}
        Type: ${fields.type.textContent}
        City: ${fields.city.textContent}
        Region: ${fields.region.textContent}
        Country: ${fields.country.textContent}
        ISP: ${fields.isp.textContent}`;

    navigator.clipboard.writeText(text).then(() => {
      const t = document.getElementById("toast");
      t.classList.add("show");
      setTimeout(() => t.classList.remove("show"), 1200);
    });
  });
*/
      