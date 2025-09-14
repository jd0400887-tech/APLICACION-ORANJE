import React from 'react';
import { Box, Typography, Card, CardContent, Avatar, useTheme } from '@mui/material';
import { Employee, Hotel } from '../../data/database';
import { getDisplayImage } from '../../utils/imageUtils';

interface HomeViewProps {
  currentUser: Employee | null;
  assignedHotel: Hotel | null;
}

const HomeView: React.FC<HomeViewProps> = ({ currentUser, assignedHotel }) => {
  const theme = useTheme();

  return (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom sx={{ color: theme.palette.primary.main, mb: 3 }}>
        ¡Bienvenido al Portal del Empleado!
      </Typography>

      {currentUser && (
        <Card elevation={3} sx={{ mb: 3, bgcolor: theme.palette.primary.light }}>
          <CardContent>
            <Avatar
              src={getDisplayImage(currentUser.imageUrl, 'person')}
              sx={{ width: 100, height: 100, margin: '0 auto 16px' }}
            />
            <Typography variant="h5" component="div" sx={{ color: 'white' }}>
              Hola, {currentUser.name}!
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'white' }}>
              {currentUser.role} - {currentUser.position}
            </Typography>
          </CardContent>
        </Card>
      )}

      {assignedHotel && (
        <Card elevation={3} sx={{ mb: 3 }}>
          <Box
            sx={{
              height: 200,
              backgroundImage: `url(${assignedHotel.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderTopLeftRadius: theme.shape.borderRadius,
              borderTopRightRadius: theme.shape.borderRadius,
            }}
          />
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
              Tu Hotel Asignado: {assignedHotel.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {assignedHotel.address}, {assignedHotel.city}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gerente: {assignedHotel.generalManager}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Typography variant="body1" color="text.secondary" sx={{ mt: 3 }}>
        Aquí encontrarás toda la información relevante para tu jornada laboral.
      </Typography>
    </Box>
  );
};

export default HomeView;