// src/lib/leafletIcon.ts
// NOTE: jangan require('leaflet') di top-level. Kembalikan fungsi yang membuat icon saat dipanggil di client.

export function createMarkerIcon() {
  if (typeof window === "undefined") return null; // server: kembalikan null

  // require hanya dijalankan di client
  const L = require("leaflet");
  return L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}
const customIcon = createMarkerIcon();