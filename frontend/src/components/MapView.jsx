import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
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

export default function MapView({ items = [], center = [49.4432, 1.0993] }) {
  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom={true}
      className="h-full w-full"
      data-testid="map-container"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
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
  );
}
