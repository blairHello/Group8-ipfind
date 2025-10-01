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

      // UI events
      $("#lookup").addEventListener("click", () => lookup(ipIn.value));
      $("#mine").addEventListener("click", async () => {
        ipIn.value = "";
        await lookup("");
      });
      ipIn.addEventListener("keydown", (e) => {
        if (e.key === "Enter") $("#lookup").click();
      });


      
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

  document.getElementById("copyAll").addEventListener("click", () => {
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

      // initial load
      lookup("");