import React from 'react';
import {
  Box, Typography, Paper, Card, CardContent, Chip, IconButton, CircularProgress, Button, Stack
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOnOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTimeOutlined';
import LoginIcon from '@mui/icons-material/LoginOutlined';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import { Hotel, Employee } from '../../data/database';

interface HotelCheckinViewProps {
  assignedHotel: Hotel | null;
  currentUser: Employee | null;
  lastCheckInId: number | null;
  currentTime: Date;
  locationLoading: boolean;
  locationError: string | null;
  distance: number | null;
  isInRange: boolean;
  handleCheckIn: () => void;
  handleCheckOut: () => void;
}

const HotelCheckinView: React.FC<HotelCheckinViewProps> = ({
  assignedHotel,
  currentUser,
  lastCheckInId,
  currentTime,
  locationLoading,
  locationError,
  distance,
  isInRange,
  handleCheckIn,
  handleCheckOut,
}) => {

  const renderLocationStatus = () => {
    if (locationLoading) {
      return <Chip icon={<CircularProgress size={16} />} label="Obteniendo ubicación..." variant="outlined" color="primary" />;
    }
    if (locationError) {
      return <Chip label={locationError} variant="outlined" color="error" />;
    }
    if (distance !== null) {
      const distanceInKm = (distance / 1000).toFixed(2);
      if (isInRange) {
        return <Chip label={`En rango (${distance.toFixed(0)}m del hotel)`} variant="outlined" color="success" />;
      } else {
        return <Chip label={`Fuera de rango (${distanceInKm}km del hotel)`} variant="outlined" color="error" />;
      }
    }
    return <Chip label="Verificando ubicación..." variant="outlined" />;
  };

  return (
    <Box sx={{ p: 2, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ maxWidth: 600, width: '100%', margin: '0 auto' }}> {/* Centered wrapper */}
        {/* Assigned Hotel Information Card */}
        {assignedHotel && (
          <Card elevation={3} sx={{ mb: 3, width: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hotel Asignado
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{assignedHotel.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                <IconButton size="small" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${assignedHotel.address},${assignedHotel.city}`, '_blank')}>
                  <LocationOnIcon fontSize="small" />
                </IconButton>
                {assignedHotel.address}, {assignedHotel.city}
              </Typography>
              <Typography variant="body2" color="text.secondary">Gerente General: {assignedHotel.generalManager}</Typography>
              <Typography variant="body2" color="text.secondary">Contacto: {assignedHotel.contact}</Typography>
              <Typography variant="body2" color="text.secondary">Email: {assignedHotel.email}</Typography>
            </CardContent>
          </Card>
        )}

        {/* Journal Entry Section */}
        <Paper elevation={3} sx={{ p: 2, width: '100%' }}>
          <Typography variant="h6" gutterBottom>Registro de Jornada</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Chip
              icon={<AccessTimeIcon />}
              label={lastCheckInId ? 'Activo' : 'Inactivo'}
              color={lastCheckInId ? 'success' : 'default'}
            />
            <Typography variant="h6">{currentTime.toLocaleTimeString()}</Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            {renderLocationStatus()}
          </Box>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCheckIn}
              disabled={!!lastCheckInId || !currentUser || !isInRange}
              startIcon={<LoginIcon />}
              fullWidth
            >
              Check-in
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleCheckOut}
              disabled={!lastCheckInId || !currentUser || !isInRange}
              startIcon={<LogoutIcon />}
              fullWidth
            >
              Check-out
            </Button>
          </Stack>
          {lastCheckInId && (
            <Typography variant="body1" sx={{ mt: 1 }}>
              Check-in activo
            </Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default HotelCheckinView;