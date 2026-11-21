import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "./leafletSetup";

export interface MapPoint {
  id: number;
  position: [number, number];
  label: string;
  sublabel?: string;
}

const FitBounds = ({ points }: { points: MapPoint[] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0].position, 15);
    } else {
      map.fitBounds(L.latLngBounds(points.map((p) => p.position)), {
        padding: [30, 30],
      });
    }
  }, [points, map]);
  return null;
};

interface Props {
  points: MapPoint[];
  height?: number | string;
  onSelect?: (id: number) => void;
  selectLabel?: string;
}

const IncidentMap = ({ points, height = 260, onSelect, selectLabel }: Props) => (
  <MapContainer
    center={points[0]?.position ?? [28.0339, 1.6596]}
    zoom={points.length ? 13 : 5}
    style={{ height, width: "100%" }}
    className="rounded-md z-0"
  >
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
    <FitBounds points={points} />
    {points.map((p) => (
      <Marker key={p.id} position={p.position}>
        <Popup>
          <div className="text-sm">
            <div className="font-semibold">{p.label}</div>
            {p.sublabel && <div>{p.sublabel}</div>}
            {onSelect && (
              <button
                type="button"
                className="mt-1 text-blue-600 underline"
                onClick={() => onSelect(p.id)}
              >
                {selectLabel}
              </button>
            )}
          </div>
        </Popup>
      </Marker>
    ))}
  </MapContainer>
);

export default IncidentMap;
