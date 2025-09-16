import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Button, Container, Typography, Paper, Snackbar, Alert, Card, CardContent, Box, Chip, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Avatar, Stack, IconButton, useTheme,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, CircularProgress, useMediaQuery, AppBar, Toolbar,
  BottomNavigation, BottomNavigationAction, CardMedia, Fab
} from '@mui/material';
import LoginIcon from '@mui/icons-material/LoginOutlined';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTimeOutlined';
import HomeIcon from '@mui/icons-material/Home';
import WorkIcon from '@mui/icons-material/Work';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../context/AuthContext';
import { getAttendance, checkIn, checkOut, Attendance, requestCorrection, uploadSelfie } from '../data/attendance';
import { getHotels, Hotel, uploadProfilePicture, updateEmployee } from '../data/database';
import SelfieCamera from './SelfieCamera';

// Helper functions (getDistance, formatDuration) remain the same
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // in metres
};

const formatDuration = (milliseconds: number) => {
  if (milliseconds < 0) return 'N/A';
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
};

const EmpleadoDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentUser: authUser, updateCurrentUser } = useAuth();
  const [currentUser, setCurrentUser] = useState(authUser);

  useEffect(() => {
    setCurrentUser(authUser);
  }, [authUser]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastCheckInId, setLastCheckInId] = useState<number | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'warning' }>({ open: false, message: '', severity: 'success' });
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [allHotels, setAllHotels] = useState<Hotel[]>([]);

  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
  const [correctionMessage, setCorrectionMessage] = useState("");

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [hotelLocation, setHotelLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isInRange, setIsInRange] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [selectedTab, setSelectedTab] = useState(0);

  const GEOFENCE_RADIUS = 200; // meters

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchHotels = async () => {
      const hotelsData = await getHotels();
      setAllHotels(hotelsData);
    };
    fetchHotels();
  }, []);

  const fetchAttendance = async () => {
    if (!currentUser) return;
    const allRecords = await getAttendance();
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
    return allHotels.find(hotel => hotel.name === currentUser.hotel);
  }, [currentUser, allHotels]);

  useEffect(() => {
    if (assignedHotel) {
      if (assignedHotel.latitude !== undefined && assignedHotel.longitude !== undefined) {
        setHotelLocation({ latitude: assignedHotel.latitude, longitude: assignedHotel.longitude });
        setLocationError(null);
      } else {
        // Fallback to geocoding if coordinates are not directly available
        const geocodeHotel = async () => {
          const address = `${assignedHotel.address}, ${assignedHotel.city}`;
          try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data && data.length > 0) {
              setHotelLocation({ latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) });
              setLocationError(null);
            } else {
              setLocationError('No se pudo encontrar la ubicación del hotel.');
              setHotelLocation(null);
            }
          } catch (error) {
            console.error("Error geocoding hotel address:", error);
            setLocationError(`Error al geocodificar: ${error instanceof Error ? error.message : String(error)}`);
            setHotelLocation(null);
          }
        };
        geocodeHotel();
      }
    }
  }, [assignedHotel]);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation not supported.');
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationLoading(false);
      },
      (error) => {
        setLocationError(`Error getting location: ${error.message}`);
        setLocationLoading(false);
      },
      { enableHighAccuracy: false, timeout: 60000, maximumAge: 10000 }
    );
  }, []);

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
    console.log('handleCheckIn: Setting isCameraOpen to true'); // Added for debugging
    setIsCameraOpen(true);
  };

  const handlePictureTaken = async (selfie: string) => {
    setIsCameraOpen(false);
    if (!currentUser || !assignedHotel) return;

    const selfieUrl = await uploadSelfie(selfie);

    if (!selfieUrl) {
      setSnackbar({ open: true, message: 'Error al subir la selfie.', severity: 'error' });
      return;
    }

    const newCheckInId = await checkIn(currentUser.id, assignedHotel.id, selfieUrl);
    if (newCheckInId) {
      setLastCheckInId(newCheckInId);
      setSnackbar({ open: true, message: 'Check-in registrado con éxito', severity: 'success' });
      
      // Manually update the attendance records to provide immediate feedback
      const newRecord: Attendance = {
        id: newCheckInId,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        hotelName: assignedHotel.name,
        position: currentUser.position,
        date: new Date().toISOString().split('T')[0],
        checkIn: new Date().toLocaleTimeString(),
        checkOut: null,
        workHours: null,
        status: 'ok',
        correctionRequest: null,
        checkInSelfie: selfieUrl,
      };
      setAttendanceRecords([newRecord, ...attendanceRecords]);

    } else {
      setSnackbar({ open: true, message: 'Ya tienes un check-in abierto hoy.', severity: 'warning' });
    }
  };

  const handleCheckOut = async () => {
    if (!currentUser) return;
    await checkOut(currentUser.id);
    setSnackbar({ open: true, message: 'Check-out registrado con éxito', severity: 'success' });
    fetchAttendance();
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleOpenCorrectionModal = (record: Attendance) => {
    setSelectedRecord(record);
    setCorrectionMessage('');
    setCorrectionModalOpen(true);
  };

  const handleCloseCorrectionModal = () => {
    setCorrectionModalOpen(false);
    setSelectedRecord(null);
  };

  const handleSubmitCorrection = async () => {
    if (selectedRecord && correctionMessage) {
      await requestCorrection(selectedRecord.id, correctionMessage);
      handleCloseCorrectionModal();
      setSnackbar({ open: true, message: 'Solicitud de corrección enviada.', severity: 'success' });
      fetchAttendance();
    } else {
      setSnackbar({ open: true, message: 'Por favor, escribe un mensaje para la corrección.', severity: 'warning' });
    }
  };

  const handleSubmitSupport = () => {
    console.log("Mensaje de soporte enviado:", supportMessage);
    setSnackbar({ open: true, message: 'Solicitud de soporte enviada con éxito.', severity: 'success' });
    setSupportMessage("");
  };

  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    const newImageUrl = await uploadProfilePicture(file);

    if (newImageUrl) {
      const updatedEmployee = { ...currentUser, imageUrl: newImageUrl };
      await updateEmployee(updatedEmployee);
      updateCurrentUser(updatedEmployee);
      setCurrentUser(updatedEmployee);
      setSnackbar({ open: true, message: 'Foto de perfil actualizada', severity: 'success' });
    } else {
      setSnackbar({ open: true, message: 'Error al subir la imagen', severity: 'error' });
    }
  };

  const filteredRecords = attendanceRecords.filter(rec => rec.date >= startDate && rec.date <= endDate);

  const { totalHours, daysWorked, averageCheckInTime, averageWorkDuration } = useMemo(() => {
    // This calculation logic remains the same
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
    const avgCheckIn = (records.length > 0) ? (() => { const avgMinutes = totalMinutes / records.length; const hours = Math.floor(avgMinutes / 60); const minutes = Math.round(avgMinutes % 60); return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`; })() : 'N/A';
    const avgDuration = (days > 0) ? (() => { const avgMilliseconds = totalMs / days; return formatDuration(avgMilliseconds); })() : 'N/A';
    return { totalHours: totalMs, daysWorked: days, averageCheckInTime: avgCheckIn, averageWorkDuration: avgDuration };
  }, [filteredRecords]);

  // renderLocationStatus, getStatusChip, renderContent, etc. remain the same as they are UI logic
  const renderLocationStatus = () => {
    if (locationLoading) return <Chip icon={<CircularProgress size={16} />} label="Obteniendo ubicación..." variant="outlined" color="primary" />;
    if (locationError) return <Chip label={locationError} variant="outlined" color="error" />;
    if (distance !== null) {
      const distanceInKm = (distance / 1000).toFixed(2);
      if (isInRange) return <Chip label={`En rango (${distance.toFixed(0)}m del hotel)`} variant="outlined" color="success" />;
      else return <Chip label={`Fuera de rango (${distanceInKm}km del hotel)`} variant="outlined" color="error" />;
    }
    return <Chip label="Verificando ubicación..." variant="outlined" />;
  };

  const renderContent = () => {
    switch (selectedTab) {
      case 0: // Home
        return (
          <Box sx={{
            width: '100%',
            flexGrow: 1,
            position: 'relative',
            overflow: 'hidden',
            bgcolor: '#f0f0f0', // Gray background
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '150%',
              height: '50%',
              bgcolor: 'primary.main', // Orange background
              borderRadius: '0 0 50% 50%',
              zIndex: 0,
            }} />
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1,
              pt: 4,
            }}>
              {currentUser && (
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    key={currentUser.imageUrl}
                    src={currentUser.imageUrl}
                    sx={{
                      width: isMobile ? 80 : 120,
                      height: isMobile ? 80 : 120,
                      mb: 1,
                      border: '4px solid white'
                    }}
                  />
                  <IconButton
                    aria-label="upload picture"
                    component="label"
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      backgroundColor: 'white',
                      '&:hover': {
                        backgroundColor: 'white',
                      },
                    }}
                  >
                    <EditIcon />
                    <input hidden accept="image/*" type="file" onChange={handleProfilePictureChange} />
                  </IconButton>
                </Box>
              )}
              {assignedHotel && (
                <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ color: 'white', fontWeight: 'bold' }}>
                  {assignedHotel.name}
                </Typography>
              )}
            </Box>

            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              width: '100%',
              position: 'relative',
              zIndex: 1,
              pb: 4,
            }}>
              <Fab
                color="primary"
                aria-label="check-in"
                onClick={handleCheckIn}
                disabled={!!lastCheckInId || !currentUser || !isInRange}
                sx={{ width: isMobile ? 80 : 100, height: isMobile ? 80 : 100 }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <LoginIcon />
                  <Typography variant="caption">Check-in</Typography>
                </Box>
              </Fab>

              <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 'bold' }}>
                {currentTime.toLocaleTimeString()}
              </Typography>

              <Fab
                color="secondary"
                aria-label="check-out"
                onClick={handleCheckOut}
                disabled={!lastCheckInId || !currentUser || !isInRange}
                sx={{ width: isMobile ? 80 : 100, height: isMobile ? 80 : 100 }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <LogoutIcon />
                  <Typography variant="caption">Check-out</Typography>
                </Box>
              </Fab>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, pb: 4, position: 'relative', zIndex: 1 }}>
              <Fab
                color="primary"
                aria-label="mis-registros"
                onClick={() => setSelectedTab(1)}
                sx={{ width: isMobile ? 80 : 100, height: isMobile ? 80 : 100 }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <WorkIcon />
                  <Typography variant="caption">Registros</Typography>
                </Box>
              </Fab>
              <Fab
                color="primary"
                aria-label="soporte"
                onClick={() => setSelectedTab(2)}
                sx={{ width: isMobile ? 80 : 100, height: isMobile ? 80 : 100 }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <SupportAgentIcon />
                  <Typography variant="caption">Soporte</Typography>
                </Box>
              </Fab>
            </Box>
          </Box>
        );
      case 1: // Registros
        return (
          <>
            <Fab color="primary" aria-label="back" onClick={() => setSelectedTab(0)} sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
              <ArrowBackIcon />
            </Fab>
            <Grid container spacing={2}><Grid item xs={12} md={6}><Card elevation={3} sx={{ height: '100%', borderRadius: '20px' }}><CardContent><Typography variant="h6">Resumen de Horas</Typography><Typography variant="h4">{formatDuration(totalHours)}</Typography></CardContent></Card></Grid><Grid item xs={12} md={6}><Card elevation={3} sx={{ height: '100%', borderRadius: '20px' }}><CardContent><Typography variant="h6">Estadísticas</Typography><Typography variant="body1" sx={{ mt: 2 }}><strong>Días trabajados:</strong> {daysWorked}</Typography><Typography variant="body1"><strong>Entrada promedio:</strong> {averageCheckInTime}</Typography><Typography variant="body1"><strong>Jornada promedio:</strong> {averageWorkDuration}</Typography></CardContent></Card></Grid></Grid>
            <Paper elevation={3} sx={{ p: 2, mt: 3, borderRadius: '20px' }}>
              <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}><Typography variant="h6">Historial de Registros</Typography><Box sx={{ display: 'flex', gap: 2 }}><TextField type="date" label="Fecha de inicio" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" /><TextField type="date" label="Fecha de fin" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" /></Box></Box>
              <TableContainer sx={{ overflowX: 'auto' }}><Table size="small"><TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Entrada</TableCell><TableCell>Salida</TableCell><TableCell>Acciones</TableCell></TableRow></TableHead><TableBody>{filteredRecords.map((rec) => (<TableRow key={rec.id}><TableCell>{new Date(rec.date).toLocaleDateString()}</TableCell><TableCell>{rec.checkIn}</TableCell><TableCell>{rec.checkOut || 'En curso'}</TableCell><TableCell><IconButton size="small" onClick={() => handleOpenCorrectionModal(rec)} disabled={rec.status === 'pending_review'}><EditIcon /></IconButton></TableCell></TableRow>))}</TableBody></Table></TableContainer>
            </Paper>
          </>
        );
      case 2: // Soporte
        return (
          <>
            <Fab color="primary" aria-label="back" onClick={() => setSelectedTab(0)} sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
              <ArrowBackIcon />
            </Fab>
            <Paper elevation={3} sx={{ p: 2, borderRadius: '20px' }}>
              <Typography variant="h6" gutterBottom>Soporte Técnico</Typography>
              <TextField label="Describe tu problema" multiline rows={6} fullWidth variant="outlined" sx={{ mb: 2 }} value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} />
              <Button variant="contained" color="primary" onClick={handleSubmitSupport}>Enviar Solicitud</Button>
            </Paper>
          </>
        );
      default: return null;
    }
  };

  return (
    <Container
      disableGutters
      sx={{
        py: isMobile ? 2 : 3,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom align="center" sx={{ mb: 2 }}>Portal del Empleado</Typography>
      
      <Box sx={{ width: '100%', flexGrow: 1, mt: 2, position: 'relative' }}>
        {renderContent()}
      </Box>
      
      <Dialog open={correctionModalOpen} onClose={handleCloseCorrectionModal}><DialogTitle>Solicitar Corrección</DialogTitle><DialogContent><DialogContentText>Describe el problema con este registro de asistencia. Tu supervisor revisará tu solicitud.</DialogContentText><TextField autoFocus margin="dense" id="correction-message" label="Mensaje" type="text" fullWidth variant="standard" value={correctionMessage} onChange={(e) => setCorrectionMessage(e.target.value)} multiline rows={4} /></DialogContent><DialogActions><Button onClick={handleCloseCorrectionModal}>Cancelar</Button><Button onClick={handleSubmitCorrection}>Enviar Solicitud</Button></DialogActions></Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}><Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert></Snackbar>
      <SelfieCamera open={isCameraOpen} onClose={useCallback(() => setIsCameraOpen(false), [])} onPictureTaken={handlePictureTaken} />
    </Container>
  );
};

export default EmpleadoDashboard;