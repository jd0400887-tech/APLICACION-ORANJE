import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Hotel, Employee, PersonnelRequest, Candidate } from '../data/database';

// Fix for default icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface DashboardContentProps {
  hotels: Hotel[];
  employees: Employee[];
  personnelRequests: PersonnelRequest[];
  candidates: Candidate[];
}

interface HotelWithLocation extends Hotel {
  latitude: number;
  longitude: number;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ hotels }) => {
  const [hotelLocations, setHotelLocations] = useState<Hotel[]>([]);

  useEffect(() => {
    // Filter hotels that have latitude and longitude directly
    const hotelsWithCoords = hotels.filter(hotel => 
      hotel.latitude !== undefined && hotel.latitude !== null &&
      hotel.longitude !== undefined && hotel.longitude !== null
    );
    setHotelLocations(hotelsWithCoords);
  }, [hotels]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>
      <Paper elevation={3} sx={{ height: '400px', width: '100%' }}>
        {hotelLocations.length > 0 && hotelLocations[0].latitude !== undefined && hotelLocations[0].longitude !== undefined ? (
          <MapContainer center={[hotelLocations[0].latitude, hotelLocations[0].longitude]} zoom={10} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {hotelLocations.map(hotel => (
              <Marker key={hotel.id} position={[hotel.latitude!, hotel.longitude!]}>
                <Popup>
                  {hotel.name}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <Typography sx={{ textAlign: 'center', pt: 4 }}>
            No hay hoteles con coordenadas disponibles para mostrar en el mapa.
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default DashboardContent;