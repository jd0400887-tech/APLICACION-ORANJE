import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { RouteStop } from '../data/database';

// This component is a workaround for a common issue in react-leaflet where the map
// may not render correctly if its container size is set dynamically.
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
};

interface RouteMapProps {
  stops: RouteStop[];
}

const RouteMap: React.FC<RouteMapProps> = ({ stops }) => {
  const stopsWithCoords = stops.filter(stop => stop.latitude != null && stop.longitude != null);

  if (stopsWithCoords.length === 0) {
    return <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' }}>
      <p>No hay suficientes datos de coordenadas para mostrar el mapa.</p>
    </div>;
  }

  const positions: LatLngExpression[] = stopsWithCoords.map(stop => [stop.latitude!, stop.longitude!]);

  // Calculate center of the map
  const centerLat = positions.reduce((sum, pos) => sum + pos[0], 0) / positions.length;
  const centerLng = positions.reduce((sum, pos) => sum + pos[1], 0) / positions.length;
  const mapCenter: LatLngExpression = [centerLat, centerLng];

  return (
    <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', minHeight: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {stopsWithCoords.map((stop, index) => (
        <Marker key={stop.id} position={[stop.latitude!, stop.longitude!]}>
          <Popup>
            <strong>{stop.visit_order}. {stop.hotel_name}</strong>
            <br />
            Estado: {stop.status}
          </Popup>
        </Marker>
      ))}
      <Polyline pathOptions={{ color: 'blue' }} positions={positions} />
      <MapResizer />
    </MapContainer>
  );
};

export default RouteMap;
