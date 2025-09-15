import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  ButtonGroup,
  useTheme,
  CardActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/AddOutlined';
import { Hotel } from '../data/database';
import { getDisplayImage } from '../utils/imageUtils';
import { useAuth } from '../context/AuthContext';

interface HotelManagementProps {
  hotels: Hotel[];
  onSelectHotel: (hotel: Hotel) => void;
  onAddNewHotel: (newHotelData: Omit<Hotel, 'id' | 'user_id'>) => void;
  onDeleteHotel: (hotelId: number) => void;
  onUpdateStatus: (hotelId: number, status: 'Client' | 'Prospect') => void;
}

const HotelGrid = ({ hotels, onSelectHotel, currentUser, handleDeleteHotel, onUpdateStatus, mainButtonStyles }) => (
    <Grid container spacing={3} sx={{ mt: 2 }}>
      {hotels.map((hotel) => (
        <Grid key={hotel.id} item xs={12} sm={6} md={4}>
          <Card>
            <CardActionArea onClick={() => onSelectHotel(hotel)}>
              <CardMedia
                component="img"
                height="160"
                image={getDisplayImage(hotel.imageUrl, 'hotel')}
                alt={`Imagen de ${hotel.name}`}
              />
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" component="div">
                  {hotel.name}
                </Typography>
              </CardContent>
            </CardActionArea>
            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
              {hotel.status === 'Prospect' && (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  onClick={() => onUpdateStatus(hotel.id, 'Client')}
                  sx={mainButtonStyles}
                >
                  Convertir a Cliente
                </Button>
              )}
              {currentUser && currentUser.role === 'Admin' && (
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={() => handleDeleteHotel(hotel.id)}
                  sx={mainButtonStyles}
                >
                  Eliminar
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
);

function HotelManagement({ hotels = [], onSelectHotel, onAddNewHotel, onDeleteHotel, onUpdateStatus }: HotelManagementProps) {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [newHotel, setNewHotel] = useState<Omit<Hotel, 'id'>>({
    name: '',
    imageUrl: '',
    status: 'Prospect',
    address: '',
    city: '',
    generalManager: '',
    contact: '',
    email: '',
  });
  const [view, setView] = useState<'Client' | 'Prospect'>('Client');

  const { clientHotels, prospectHotels } = useMemo(() => {
    const clients = hotels.filter(h => h.status === 'Client');
    const prospects = hotels.filter(h => h.status === 'Prospect');
    return { clientHotels: clients, prospectHotels: prospects };
  }, [hotels]);

  const mainButtonStyles = {
    minHeight: '48px',
    transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
    '&:hover': {
      transform: 'scale(1.02)',
      boxShadow: theme.shadows[6],
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setNewHotel({
      name: '',
      imageUrl: '',
      status: 'Prospect',
      address: '',
      city: '',
      generalManager: '',
      contact: '',
      email: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewHotel((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeleteHotel = (hotelId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este hotel?')) {
      onDeleteHotel(hotelId); // Call the prop function
    }
  };

  const handleAddHotel = () => {
    if (
      newHotel.name &&
      newHotel.address &&
      newHotel.city &&
      newHotel.generalManager &&
      newHotel.contact &&
      newHotel.email
    ) {
      onAddNewHotel(newHotel);
      handleClose();
    } else {
      alert('Por favor, rellena todos los campos.');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom component="div">
          Gestión de Hoteles
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleClickOpen}
          sx={mainButtonStyles}
        >
          Añadir Hotel
        </Button>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <ButtonGroup variant="outlined" aria-label="outlined button group">
          <Button variant={view === 'Client' ? 'contained' : 'outlined'} onClick={() => setView('Client')}>Clientes</Button>
          <Button variant={view === 'Prospect' ? 'contained' : 'outlined'} onClick={() => setView('Prospect')}>Prospectos</Button>
        </ButtonGroup>
      </Box>

      {view === 'Client' ? (
        <HotelGrid hotels={clientHotels} onSelectHotel={onSelectHotel} currentUser={currentUser} handleDeleteHotel={handleDeleteHotel} onUpdateStatus={onUpdateStatus} mainButtonStyles={mainButtonStyles} />
      ) : (
        <HotelGrid hotels={prospectHotels} onSelectHotel={onSelectHotel} currentUser={currentUser} handleDeleteHotel={handleDeleteHotel} onUpdateStatus={onUpdateStatus} mainButtonStyles={mainButtonStyles} />
      )}

      {/* Add Hotel Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Añadir Nuevo Hotel</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Nombre del Hotel"
            type="text"
            fullWidth
            variant="standard"
            value={newHotel.name}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="imageUrl"
            label="URL de la Imagen"
            type="text"
            fullWidth
            variant="standard"
            value={newHotel.imageUrl}
            onChange={handleChange}
          />
          <TextField
            select
            margin="dense"
            name="status"
            label="Estado"
            fullWidth
            variant="standard"
            value={newHotel.status}
            onChange={handleChange}
          >
            <MenuItem value="Client">Cliente</MenuItem>
            <MenuItem value="Prospect">Prospecto</MenuItem>
          </TextField>
          <TextField
            margin="dense"
            name="address"
            label="Dirección"
            type="text"
            fullWidth
            variant="standard"
            value={newHotel.address}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="city"
            label="Ciudad"
            type="text"
            fullWidth
            variant="standard"
            value={newHotel.city}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="generalManager"
            label="Gerente General"
            type="text"
            fullWidth
            variant="standard"
            value={newHotel.generalManager}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="contact"
            label="Contacto"
            type="text"
            fullWidth
            variant="standard"
            value={newHotel.contact}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="email"
            label="Email de Contacto"
            type="email"
            fullWidth
            variant="standard"
            value={newHotel.email}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleAddHotel} sx={mainButtonStyles}>Añadir</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default HotelManagement;