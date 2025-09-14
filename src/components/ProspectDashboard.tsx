import React from 'react';
import { 
  Box,
  Typography,
  Button,
  Paper,
  Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';
import { Hotel } from '../data/database';

interface ProspectDashboardProps {
  hotel: Hotel;
  onBack: () => void;
  onUpdateStatus: (hotelId: number) => void;
}

function ProspectDashboard({ hotel, onBack, onUpdateStatus }: ProspectDashboardProps) {
  const handleConvert = () => {
    onUpdateStatus(hotel.id);
    onBack(); // Go back to hotel list after conversion
  };

  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{ mb: 2 }}
      >
        Volver a la lista de Hoteles
      </Button>
      <Typography variant="h4" gutterBottom>
        Detalles del Hotel Prospecto: {hotel.name}
      </Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}>
            <Typography variant="subtitle1">Dirección:</Typography>
            <Typography variant="body1">{hotel.address}, {hotel.city}</Typography>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}>
            <Typography variant="subtitle1">Gerente General:</Typography>
            <Typography variant="body1">{hotel.generalManager}</Typography>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}>
            <Typography variant="subtitle1">Contacto:</Typography>
            <Typography variant="body1">{hotel.contact}</Typography>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}>
            <Typography variant="subtitle1">Email:</Typography>
            <Typography variant="body1">{hotel.email}</Typography>
          </Grid>
        </Grid>
      </Paper>
      <Button
        variant="contained"
        color="success"
        onClick={handleConvert}
      >
        Convertir en Cliente
      </Button>
    </Box>
  );
}

export default ProspectDashboard;
