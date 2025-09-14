import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';
import EditIcon from '@mui/icons-material/Edit';
import PersonnelRequestForm from './PersonnelRequestForm';
import IncidentAlertForm from './IncidentAlertForm';
import PayrollView from './PayrollView';
import EditHotelForm from './EditHotelForm';
import { Employee, Hotel, updateHotel } from '../data/database';

interface HotelDashboardProps {
  hotel: Hotel;
  onBack: () => void;
  onAddNewRequest: (newRequestData: any) => void;
  onHotelUpdated: (updatedHotel: Hotel) => void;
  employees: Employee[];
}

function HotelDashboard({ hotel, onBack, onAddNewRequest, onHotelUpdated, employees }: HotelDashboardProps) {
  const theme = useTheme();
  const [openPersonnelRequest, setOpenPersonnelRequest] = useState(false);
  const [openIncidentAlert, setOpenIncidentAlert] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [view, setView] = useState('main');

  const assignedPersonnel = useMemo(() => {
    return employees.filter(emp => emp.hotel === hotel.name && emp.status === 'Assigned');
  }, [employees, hotel.name]);

  const handleSaveHotel = (updatedHotelData: Hotel) => {
    updateHotel(updatedHotelData);
    onHotelUpdated(updatedHotelData);
    setIsEditOpen(false);
  };

  const mainButtonStyles = {
    minHeight: '56px',
    transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
    '&:hover': {
      transform: 'scale(1.02)',
      boxShadow: theme.shadows[6],
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
  };

  const renderMainDashboard = () => (
    <>
      {/* Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => setOpenPersonnelRequest(true)}
            sx={mainButtonStyles}
          >
            Solicitud de Personal
          </Button>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            color="error"
            fullWidth
            size="large"
            onClick={() => setOpenIncidentAlert(true)}
            sx={mainButtonStyles}
          >
            Reportar Incidente
          </Button>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            color="success"
            fullWidth
            size="large"
            onClick={() => setView('payroll')}
            sx={mainButtonStyles}
          >
            Nómina / Horarios
          </Button>
        </Grid>
      </Grid>

      {/* Active Personnel List */}
      <Typography variant="h5" gutterBottom>
        Personal Activo
      </Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Cargo</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignedPersonnel.length > 0 ? (
              assignedPersonnel.map((person) => (
                <TableRow
                  key={person.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {person.name}
                  </TableCell>
                  <TableCell>{person.position}</TableCell>
                  <TableCell>{person.status}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} sx={{ textAlign: 'center' }}>
                  No hay personal asignado a este hotel.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialogs for the forms */}
      <PersonnelRequestForm
        open={openPersonnelRequest}
        onClose={() => setOpenPersonnelRequest(false)}
        hotelName={hotel.name}
        onAddNewRequest={onAddNewRequest}
      />
      <IncidentAlertForm
        open={openIncidentAlert}
        onClose={() => setOpenIncidentAlert(false)}
        hotelName={hotel.name}
      />
    </>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
        >
          Volver a la lista de Hoteles
        </Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => setIsEditOpen(true)}
        >
          Editar Hotel
        </Button>
      </Box>
      <Typography variant="h4" gutterBottom>
        Dashboard para: {hotel.name}
      </Typography>

      {view === 'main' ? renderMainDashboard() : <PayrollView onBack={() => setView('main')} />}

      <EditHotelForm
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSaveHotel}
        hotel={hotel}
      />
    </Box>
  );
}

export default HotelDashboard;
