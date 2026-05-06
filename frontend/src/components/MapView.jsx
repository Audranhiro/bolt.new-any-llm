import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

// Custom green marker
const greenIcon = new L.DivIcon({
  html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;background:#2D6A4F;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const accentIcon = new L.DivIcon({
  html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;background:#B85042;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function Recenter({ items }) {
  const map = useMap();
  useEffect(() => {
    const withCoords = items.filter((i) => i.lat && i.lng);
    if (withCoords.length === 0) return;
    if (withCoords.length === 1) {
      map.setView([withCoords[0].lat, withCoords[0].lng], 13);
    } else {
      const bounds = L.latLngBounds(withCoords.map((i) => [i.lat, i.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [items, map]);
  return null;
}

/**
 * Forces Leaflet to recompute its internal dimensions whenever:
 * - the map mounts,
 * - its container is resized (flex settling, mobile list↔map toggle, viewport change),
 * - or the items list changes (async fetch resizing the layout).
 */
function ResizeFix({ items }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();

    // 1) Initial invalidate after paint (handles hidden-on-mount + late layout)
    const raf1 = requestAnimationFrame(() => map.invalidateSize());
    const t1 = setTimeout(() => map.invalidateSize(), 200);
    const t2 = setTimeout(() => map.invalidateSize(), 600);

    // 2) Invalidate whenever the container itself changes size
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(container);

    // 3) Invalidate on window resize / orientation change
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(t1);
      clearTimeout(t2);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [map]);

  // Also invalidate when items change (list reflow may shrink/grow the map column)
  useEffect(() => {
    if (!map) return;
    const t = setTimeout(() => map.invalidateSize(), 50);
    return () => clearTimeout(t);
  }, [map, items]);

  return null;
}

export default function MapView({ items = [], center = [49.4432, 1.0993] }) {
  const wrapperRef = useRef(null);

  return (
    // Explicit full-size wrapper guarantees the MapContainer always has width & height.
    <div ref={wrapperRef} style={{ width: "100%", height: "100%", minHeight: "300px" }}>
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
        data-testid="map-container"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ResizeFix items={items} />
        <Recenter items={items} />
        {items.filter((i) => i.lat && i.lng).map((i) => (
          <Marker
            key={i.id}
            position={[i.lat, i.lng]}
            icon={i.available_today ? accentIcon : greenIcon}
          >
            <Popup>
              <div className="min-w-[180px]">
                <div className="font-heading font-bold text-base">{i.first_name} {i.last_name}</div>
                <div className="text-sm text-gray-600">{i.city}</div>
                {i.available_today && <div className="mt-1 text-sm font-semibold text-[#B85042]">Disponible aujourd'hui</div>}
                <Link
                  to={`/patient/intervenant/${i.id}`}
                  className="inline-block mt-2 text-sm font-semibold text-[#2D6A4F] underline"
                >
                  Voir la fiche
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
