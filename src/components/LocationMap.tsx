
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';

interface LocationMapProps {
  userLocation: LatLngExpression;
  hotelLocation: LatLngExpression;
  geofenceRadius: number;
}

const LocationMap: React.FC<LocationMapProps> = ({ userLocation, hotelLocation, geofenceRadius }) => {
  return (
    <MapContainer center={hotelLocation} zoom={15} style={{ height: '300px', width: '100%', borderRadius: '10px' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={userLocation}>
        <Popup>Tu ubicación</Popup>
      </Marker>
      <Marker position={hotelLocation}>
        <Popup>Ubicación del hotel</Popup>
      </Marker>
      <Circle center={hotelLocation} radius={geofenceRadius} pathOptions={{ color: 'blue', fillColor: 'blue' }} />
    </MapContainer>
  );
};

export default LocationMap;
