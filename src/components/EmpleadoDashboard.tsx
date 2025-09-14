import React, { useState, useEffect, useMemo } from 'react';
import {
  Button, Container, Typography, Paper, Snackbar, Alert, Card, CardContent, Box, Chip, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Avatar, Stack, IconButton, useTheme,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, CircularProgress, useMediaQuery, AppBar, Toolbar,
  BottomNavigation, BottomNavigationAction, CardMedia // Añadido CardMedia
} from '@mui/material';
import LoginIcon from '@mui/icons-material/LoginOutlined';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTimeOutlined';
import LocationOnIcon from '@mui/icons-material/LocationOnOutlined';
import EditIcon from '@mui/icons-material/Edit';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HomeIcon from '@mui/icons-material/Home';
import WorkIcon from '@mui/icons-material/Work'; // Para nómina/registros
import SupportAgentIcon from '@mui/icons-material/SupportAgent'; // Para soporte
import { useAuth } from '../context/AuthContext';
import { getAttendance, checkIn, checkOut, Attendance, requestCorrection } from '../data/attendance';
import { getHotels, Hotel } from '../data/database';
import { subscribeToPush } from '../utils/pushNotifications';

import SelfieCamera from './SelfieCamera';

// Helper function to calculate distance between two coordinates (Haversine formula)
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
};

// Helper function to format duration
const formatDuration = (milliseconds: number) => {
  if (milliseconds < 0) return 'N/A';
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
};

const EmpleadoDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentUser } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastCheckInId, setLastCheckInId] = useState<number | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'warning' }>({ open: false, message: '', severity: 'success' });
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
  const [correctionMessage, setCorrectionMessage] = useState("");

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notificationsSupported, setNotificationsSupported] = useState(false);

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [hotelLocation, setHotelLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isInRange, setIsInRange] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [selectedTab, setSelectedTab] = useState(0); // 0: Home, 1: Registros, 2: Soporte

  const GEOFENCE_RADIUS = 200; // meters

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        setNotificationsSupported(true);
        navigator.serviceWorker.ready.then(reg => {
            reg.pushManager.getSubscription().then(sub => {
                if (sub) {
                    setIsSubscribed(true);
                }
            });
        });
    }
  }, []);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendance = () => {
    if (!currentUser) return;
    const allRecords = getAttendance();
    const userRecords = allRecords.filter(rec => rec.employeeId === currentUser.id);
    setAttendanceRecords(userRecords);
    const lastRecord = userRecords.find(rec => !rec.checkOut);
    if (lastRecord) {
      setLastCheckInId(lastRecord.id);
    } else {
      setLastCheckInId(null);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [currentUser]);

  const assignedHotel = useMemo(() => {
    if (!currentUser || !currentUser.hotel) return null;
    const allHotels = getHotels();
    return allHotels.find(hotel => hotel.name === currentUser.hotel);
  }, [currentUser]);

  // Geocode hotel address
  useEffect(() => {
    if (assignedHotel) {
      const geocodeHotel = async () => {
        const address = `${assignedHotel.address}, ${assignedHotel.city}`;
        console.log("Geocodificando dirección:", address); // Añadir este console.log
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          console.log("Respuesta de Nominatim:", data); // Añadir este console.log
          if (data && data.length > 0) {
            setHotelLocation({
              latitude: parseFloat(data[0].lat),
              longitude: parseFloat(data[0].lon),
            });
            setLocationError(null); // Clear any previous location errors
          } else {
            setLocationError('No se pudo encontrar la ubicación del hotel. Verifique la dirección.');
            setHotelLocation(null); // Ensure hotelLocation is null if not found
          }
        } catch (error) {
          console.error("Error geocoding hotel address:", error);
          setLocationError(`Error al geocodificar la dirección del hotel: ${error instanceof Error ? error.message : String(error)}`);
          setHotelLocation(null); // Ensure hotelLocation is null on error
        }
      };
      geocodeHotel();
    }
  }, [assignedHotel]);

  // Get user's location
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by your browser.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationLoading(false);
        setLocationError(null);
      },
      (error) => {
        setLocationError(`Error getting location: ${error.message}`);
        setLocationLoading(false);
      },
      { enableHighAccuracy: false, timeout: 60000, maximumAge: 10000 }
    );
  }, []);

  // Calculate distance and check if in range
  useEffect(() => {
    if (userLocation && hotelLocation) {
      const dist = getDistance(userLocation.latitude, userLocation.longitude, hotelLocation.latitude, hotelLocation.longitude);
      setDistance(dist);
      setIsInRange(dist <= GEOFENCE_RADIUS);
    }
  }, [userLocation, hotelLocation]);

  const handleCheckIn = () => {
    if (!currentUser || currentUser.role !== 'Trabajador' || !currentUser.hotel) {
      setSnackbar({ open: true, message: 'No cumples los requisitos para hacer check-in.', severity: 'error' });
      return;
    }
    setIsCameraOpen(true);
  };

  const handlePictureTaken = (selfie: string) => {
    setIsCameraOpen(false);
    if (!currentUser || !currentUser.hotel) return; // Should not happen if check-in button was enabled

    const newCheckInId = checkIn(currentUser.id, currentUser.name, currentUser.hotel, currentUser.position, selfie);
    if (newCheckInId) {
      setLastCheckInId(newCheckInId);
      setSnackbar({ open: true, message: 'Check-in registrado con éxito', severity: 'success' });
      fetchAttendance();
    } else {
      setSnackbar({ open: true, message: 'Ya has hecho check-in hoy.', severity: 'warning' });
    }
  };

  const handleCheckOut = () => {
    if (!currentUser) {
        setSnackbar({ open: true, message: 'No estás autenticado.', severity: 'error' });
        return;
    }
    if (currentUser.role !== 'Trabajador') {
        setSnackbar({ open: true, message: 'Solo los trabajadores pueden registrar su jornada.', severity: 'error' });
        return;
    }
    if (!currentUser.hotel) {
        setSnackbar({ open: true, message: 'Debes estar asignado a un hotel para registrar tu jornada.', severity: 'error' });
        return;
    }

    checkOut(currentUser.id);
    setSnackbar({ open: true, message: 'Check-out registrado con éxito', severity: 'success' });
    fetchAttendance();
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenCorrectionModal = (record: Attendance) => {
    setSelectedRecord(record);
    setCorrectionMessage('');
    setCorrectionModalOpen(true);
  };

  const handleCloseCorrectionModal = () => {
    setCorrectionModalOpen(false);
    setSelectedRecord(null);
  };

  const handleSubmitCorrection = () => {
    if (selectedRecord && correctionMessage) {
      requestCorrection(selectedRecord.id, correctionMessage);
      handleCloseCorrectionModal();
      setSnackbar({ open: true, message: 'Solicitud de corrección enviada.', severity: 'success' });
      fetchAttendance();
    } else {
      setSnackbar({ open: true, message: 'Por favor, escribe un mensaje para la corrección.', severity: 'warning' });
    }
  };

  const handleSubmitSupport = () => {
    // Aquí se podría integrar una llamada a una API para enviar el mensaje de soporte
    console.log("Mensaje de soporte enviado:", supportMessage);
    setSnackbar({ open: true, message: 'Solicitud de soporte enviada con éxito.', severity: 'success' });
    setSupportMessage(""); // Limpiar el mensaje después de enviar
  };

  const handleSubscribeClick = async () => {
    const subscription = await subscribeToPush();
    if (subscription) {
        setIsSubscribed(true);
    }
  };

  const filteredRecords = attendanceRecords.filter(rec => {
    return rec.date >= startDate && rec.date <= endDate;
  });

  const { totalHours, daysWorked, averageCheckInTime, averageWorkDuration } = useMemo(() => {
    const records = filteredRecords;
    const totalMs = records.reduce((acc, rec) => {
      if (rec.checkIn && rec.checkOut) {
        const checkInTime = new Date(`${rec.date}T${rec.checkIn}`);
        const checkOutTime = new Date(`${rec.date}T${rec.checkOut}`);
        return acc + (checkOutTime.getTime() - checkInTime.getTime());
      }
      return acc;
    }, 0);

    const days = new Set(records.map(r => r.date)).size;

    const totalMinutes = records.reduce((acc, rec) => {
      if (rec.checkIn) {
        const [hours, minutes] = rec.checkIn.split(':').map(Number);
        return acc + hours * 60 + minutes;
      }
      return acc;
    }, 0);
    
    const avgCheckIn = (records.length > 0)
      ? (() => {
          const avgMinutes = totalMinutes / records.length;
          const hours = Math.floor(avgMinutes / 60);
          const minutes = Math.round(avgMinutes % 60);
          return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        })()
      : 'N/A';

  const avgDuration = (days > 0)
      ? (() => {
          const avgMilliseconds = totalMs / days;
          return formatDuration(avgMilliseconds);
        })()
      : 'N/A';

    return {
      totalHours: totalMs,
      daysWorked: days,
      averageCheckInTime: avgCheckIn,
      averageWorkDuration: avgDuration,
    };
  }, [filteredRecords]);

  const getStatusChip = (status: Attendance['status']) => {
    switch (status) {
      case 'pending_review':
        return <Chip label="En Revisión" color="warning" size="small" />;
      case 'approved':
        return <Chip label="Aprobado" color="success" size="small" />;
      case 'rejected':
        return <Chip label="Rechazado" color="error" size="small" />;
      default:
        return <Chip label="OK" color="primary" size="small" />;
    }
  };

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

  const renderContent = () => {
    switch (selectedTab) {
      case 0: // Home
        return (
          <>
            {/* Imagen del hotel */}
            {assignedHotel && (
              <Card elevation={3} sx={{ mb: 3 }}>
                <CardMedia
                  component="img"
                  height="140"
                  image="https://via.placeholder.com/400x140?text=Imagen+del+Hotel" // Placeholder
                  alt="Imagen del Hotel"
                />
                <CardContent sx={{ backgroundColor: theme.palette.primary.main, color: 'white' }}>
                  <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                    {assignedHotel.name}
                  </Typography>
                  <Typography variant="body2">
                    {assignedHotel.address}, {assignedHotel.city}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Personal Information Card */}
            {currentUser && (
              <Card elevation={3} sx={{ mb: 3, borderColor: theme.palette.primary.main, borderWidth: 2, borderStyle: 'solid' }}>
                <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar src={currentUser.imageUrl} sx={{ width: 60, height: 60, mr: 2 }} />
                    <Box>
                      <Typography variant="h6" component="div">{currentUser.name}</Typography>
                      <Typography variant="body1" color="text.secondary">{currentUser.role} - {currentUser.position}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Journal Entry Section */}
            <Paper elevation={3} sx={{ p: 2, borderColor: theme.palette.primary.main, borderWidth: 2, borderStyle: 'solid' }}>
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>Registro de Jornada</Typography>
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
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCheckIn}
                  disabled={!!lastCheckInId || !currentUser || !isInRange}
                  startIcon={<LoginIcon />}
                  sx={{ mr: 1 }}
                >
                  Check-in
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleCheckOut}
                  disabled={!lastCheckInId || !currentUser || !isInRange}
                  startIcon={<LogoutIcon />}
                >
                  Check-out
                </Button>
              </Box>
            </Paper>
          </>
        );
      case 1: // Registros de Marcación / Nómina
        return (
          <>
            {/* Summary Cards */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card elevation={3} sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6">Resumen de Horas</Typography>
                    <Typography variant="h4">{formatDuration(totalHours)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card elevation={3} sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6">Estadísticas</Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                      <strong>Días trabajados:</strong> {daysWorked}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Entrada promedio:</strong> {averageCheckInTime}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Jornada promedio:</strong> {averageWorkDuration}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Attendance History Table */}
            <Paper elevation={3} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
                <Typography variant="h6">Historial de Registros</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    type="date"
                    label="Fecha de inicio"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                  <TextField
                    type="date"
                    label="Fecha de fin"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Box>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Entrada</TableCell>
                      <TableCell>Salida</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRecords.map((rec) => (
                      <TableRow key={rec.id}>
                        <TableCell>{new Date(rec.date).toLocaleDateString()}</TableCell>
                        <TableCell>{rec.checkIn}</TableCell>
                        <TableCell>{rec.checkOut || 'En curso'}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenCorrectionModal(rec)}
                            disabled={rec.status === 'pending_review'}
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        );
      case 2: // Soporte
        return (
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Soporte Técnico</Typography>
            <TextField
              label="Describe tu problema"
              multiline
              rows={6}
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
            />
            <Button variant="contained" color="primary" onClick={handleSubmitSupport}>Enviar Solicitud</Button>
          </Paper>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: isMobile ? 2 : 3, pb: isMobile ? '80px' : 3 }}>
      <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom align="center" sx={{ mb: 4 }}>
        Portal del Empleado
      </Typography>
      <Box>
        <Stack spacing={isMobile ? 2 : 3}>
          {renderContent()}
        </Stack>
      </Box>

      {/* Correction Request Dialog */}
      <Dialog open={correctionModalOpen} onClose={handleCloseCorrectionModal}>
        <DialogTitle>Solicitar Corrección</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Describe el problema con este registro de asistencia. Tu supervisor revisará tu solicitud.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="correction-message"
            label="Mensaje"
            type="text"
            fullWidth
            variant="standard"
            value={correctionMessage}
            onChange={(e) => setCorrectionMessage(e.target.value)}
            multiline
            rows={4}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCorrectionModal}>Cancelar</Button>
          <Button onClick={handleSubmitCorrection}>Enviar Solicitud</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <SelfieCamera
        open={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPictureTaken={handlePictureTaken}
      />

      {/* Barra de navegación inferior */}
      <AppBar position="fixed" color="primary" sx={{ top: 'auto', bottom: 0 }}>
        <BottomNavigation
          showLabels
          value={selectedTab}
          onChange={(event, newValue) => {
            setSelectedTab(newValue);
          }}
          sx={{ backgroundColor: theme.palette.primary.main }} // Color naranja
        >
          <BottomNavigationAction label="Home" icon={<HomeIcon />} sx={{ color: 'white' }} />
          <BottomNavigationAction label="Registros" icon={<WorkIcon />} sx={{ color: 'white' }} />
          <BottomNavigationAction label="Soporte" icon={<SupportAgentIcon />} sx={{ color: 'white' }} />
        </BottomNavigation>
      </AppBar>
    </Container>
  );
};

export default EmpleadoDashboard;
