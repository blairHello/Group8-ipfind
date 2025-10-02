// === proj6.js (Leaflet + OSM home pin) ======================================

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

// You can change this to any OpenStreetMap permalink with #map=Z/LAT/LON.
// Use the map box in the right card
const MAP_ID = "miniMap";

// Your OSM permalink (zoom/lat/lon)
const OSM_PERMALINK = "https://www.openstreetmap.org/#map=19/14.610017/120.988424";
function extractFromPermalink(url) {
  const m = url.match(/#map=(\d+)\/([-\d.]+)\/([-\d.]+)/);
  return m ? { zoom:+m[1], lat:+m[2], lon:+m[3] } : { zoom:13, lat:14.610017, lon:120.988424 };
}
const OSM_HOME = extractFromPermalink(OSM_PERMALINK);


// ── Settings drawer (optional MapTiler; you can ignore if using OSM only) ───
const drawer = $("#drawer");
$("#openSettings")?.addEventListener("click", () => drawer.classList.add("show"));
$("#closeSettings")?.addEventListener("click", () => drawer.classList.remove("show"));

const providerSel = $("#provider");
const apiKeyIn = $("#apiKey");
const savedProvider = localStorage.getItem("tilesProvider") || "osm";
const savedKey = localStorage.getItem("tilesKey") || "";
if (providerSel) providerSel.value = savedProvider;
if (apiKeyIn) apiKeyIn.value = savedKey;

$("#saveKey")?.addEventListener("click", () => {
  localStorage.setItem("tilesProvider", providerSel.value);
  localStorage.setItem("tilesKey", (apiKeyIn.value || "").trim());
  drawer.classList.remove("show");
  reloadTiles();
});
$("#resetKey")?.addEventListener("click", () => {
  if (providerSel) providerSel.value = "osm";
  if (apiKeyIn) apiKeyIn.value = "";
  localStorage.removeItem("tilesProvider");
  localStorage.removeItem("tilesKey");
  reloadTiles();
});

//Map init 
let map, ipMarker, homeMarker, tileLayer;

function makeTileLayer() {
  const provider = localStorage.getItem("tilesProvider") || "osm";
  const key = localStorage.getItem("tilesKey") || "";
  if (provider === "maptiler" && key) {
    const url = `https://api.maptiler.com/maps/basic-v2/256/{z}/{x}/{y}.png?key=${encodeURIComponent(key)}`;
    return L.tileLayer(url, { maxZoom: 19, attribution: "&copy; MapTiler &copy; OpenStreetMap" });
  }
  return L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" });
}

function initMap() {
  map = L.map(MAP_ID, { zoomControl:true, attributionControl:false })
        .setView([OSM_HOME.lat, OSM_HOME.lon], OSM_HOME.zoom);
  tileLayer = makeTileLayer().addTo(map);

  // Show a small permanent “home” pin (optional)
  homeMarker = L.marker([OSM_HOME.lat, OSM_HOME.lon], { title: "OSM Pin" })
                .addTo(map).bindPopup("OSM Pin");
}
initMap();


// Button to jump back to your OSM pin
$("#gotoOSM")?.addEventListener("click", () => {
  map.setView([OSM_HOME.lat, OSM_HOME.lon], OSM_HOME.zoom);
  homeMarker && homeMarker.openPopup();
});

// Validators ito
const reV4 = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)(\.(25[0-5]|2[0-4]\d|[01]?\d\d?)){3}$/;
const reV6 = /^(([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,7}:|([0-9a-f]{1,4}:){1,6}:[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,5}(:[0-9a-f]{1,4}){1,2}|([0-9a-f]{1,4}:){1,4}(:[0-9a-f]{1,4}){1,3}|([0-9a-f]{1,4}:){1,3}(:[0-9a-f]{1,4}){1,4}|([0-9a-f]{1,4}:){1,2}(:[0-9a-f]{1,4}){1,5}|[0-9a-f]{1,4}:((:[0-9a-f]{1,4}){1,6})|:((:[0-9a-f]{1,4}){1,7})|fe80:(:[0-9a-f]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3,3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)|([0-9a-f]{1,4}:){1,4}:((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3,3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?))$/i;

function kind(ip) {
  if (!ip) return "Unknown";
  if (reV4.test(ip)) {
    const oct = ip.split(".").map((n) => +n);
    const priv = oct[0] === 10 || (oct[0] === 172 && oct[1] >= 16 && oct[1] <= 31) || (oct[0] === 192 && oct[1] === 168);
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
    if (lc.startsWith("fc") || lc.startsWith("fd")) return "IPv6 • unique local (ULA)";
    if (lc === "::1") return "IPv6 • loopback";
    return "IPv6 • global (public)";
  }
  return "Unrecognized";
}

// ── IP detection & lookup ───────────────────────────────────────────────────
async function detectMyIP() {
  const [v4, v6] = await Promise.allSettled([
    fetch("https://api.ipify.org?format=json").then((r) => r.json()),
    fetch("https://api64.ipify.org?format=json").then((r) => r.json()),
  ]);
  const ip = (v6.status === "fulfilled" && v6.value.ip) || (v4.status === "fulfilled" && v4.value.ip) || "";
  return ip;
}

async function lookup(ip) {
  const targetIP = (ip || "").trim() || (await detectMyIP());
  if (!targetIP) { paint({ ip:"Unavailable", type:"—" }); return; }
  paint({ ip:"Loading…", type:"…" });

  try {
    const geo = await fetch(`https://ipapi.co/${encodeURIComponent(targetIP)}/json/`).then(r=>r.json());
    const out = {
      ip: geo.ip || targetIP,
      type: kind(targetIP),
      city: geo.city || "—",
      region: geo.region || "—",
      country: geo.country_name || geo.country || "—",
      isp: geo.org || geo.asn || "—",
      lat: parseFloat(geo.latitude),
      lon: parseFloat(geo.longitude),
    };
    paint(out);

    if (!isNaN(out.lat) && !isNaN(out.lon)) {
      map.setView([out.lat, out.lon], 9);
      if (ipMarker) ipMarker.remove();
      ipMarker = L.marker([out.lat, out.lon]).addTo(map)
                  .bindPopup(`${out.city ? out.city + ", " : ""}${out.country}`)
                  .openPopup();
    }
  } catch (e) {
    console.error(e);
    paint({ ip: targetIP, type: kind(targetIP), city:"—", region:"—", country:"—", isp:"—" });
  }
}


function paint(d) {
  fields.ip && (fields.ip.textContent = d.ip ?? "—");
  fields.type && (fields.type.textContent = d.type ?? "—");
  fields.city && (fields.city.textContent = d.city ?? "—");
  fields.region && (fields.region.textContent = d.region ?? "—");
  fields.country && (fields.country.textContent = d.country ?? "—");
  fields.isp && (fields.isp.textContent = d.isp ?? "—");
}

// UI events
$("#lookup")?.addEventListener("click", () => lookup(ipIn.value));
$("#mine")?.addEventListener("click", async () => {
  ipIn.value = "";
  await lookup("");
});
ipIn?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("#lookup").click();
});

// Copy all (toast)
document.getElementById("copyAll")?.addEventListener("click", () => {
  const text = `IP: ${fields.ip?.textContent || "—"}
Type: ${fields.type?.textContent || "—"}
City: ${fields.city?.textContent || "—"}
Region: ${fields.region?.textContent || "—"}
Country: ${fields.country?.textContent || "—"}
ISP: ${fields.isp?.textContent || "—"}`;
  navigator.clipboard.writeText(text).then(() => {
    const t = document.getElementById("toast");
    if (!t) return;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1200);
  });
});

// initial load: try user's public IP, keep OSM home as default view/pin
lookup("").catch(() => {/* ignore */});
