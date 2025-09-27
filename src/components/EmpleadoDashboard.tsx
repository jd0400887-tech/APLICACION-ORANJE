import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Button, Container, Typography, Paper, Snackbar, Alert, Card, CardContent, Box, Chip, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Avatar, Stack, IconButton, useTheme,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, CircularProgress, useMediaQuery, AppBar, Toolbar,
  Menu, MenuItem, Skeleton, Fade, Fab, Collapse
} from '@mui/material';
import LoginIcon from '@mui/icons-material/LoginOutlined';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';
import WorkIcon from '@mui/icons-material/Work';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PowerOffIcon from '@mui/icons-material/PowerOff';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import { getAttendance, checkIn, checkOut, Attendance, requestCorrection, uploadSelfie } from '../data/attendance';
import { getHotels, Hotel, uploadProfilePicture, updateEmployee, getEmployeeAdjustments, Adjustment } from '../data/database';
import { keyframes } from '@mui/system';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SelfieCamera from './SelfieCamera';
import LocationMap from './LocationMap';
import { generatePayStubPDF } from '../utils/generatePayStubPDF';
import { calculateWeeklyHours, WeeklyHours, getWeekStartDate } from '../utils/payroll';

const StatusCard = ({ status }: { status: 'checked-in' | 'on-break' | 'checked-out' }) => {
  const theme = useTheme();
  const statusConfig = {
    'checked-in': {
      text: 'En Servicio',
      icon: <CheckCircleOutlineIcon sx={{ fontSize: 40, mb: 1 }} />,
      color: theme.palette.success.main,
      bgColor: theme.palette.success.light + '1A',
    },
    'on-break': {
      text: 'En Descanso',
      icon: <PauseCircleOutlineIcon sx={{ fontSize: 40, mb: 1 }} />,
      color: theme.palette.warning.main,
      bgColor: theme.palette.warning.light + '1A',
    },
    'checked-out': {
      text: 'Fuera de Servicio',
      icon: <PowerOffIcon sx={{ fontSize: 40, mb: 1 }} />,
      color: theme.palette.grey[600],
      bgColor: theme.palette.grey[500] + '1A',
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <Paper elevation={1} sx={{ p: 2, mt: 2, borderRadius: '10px', width: '100%', border: `1px solid ${currentStatus.color}`, backgroundColor: currentStatus.bgColor }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: currentStatus.color }}>
        {currentStatus.icon}
        <Typography variant="h6" align="center">{currentStatus.text}</Typography>
      </Box>
    </Paper>
  );
};

// Helper functions
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatDuration = (milliseconds: number) => {
  if (milliseconds < 0) return 'N/A';
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
};

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(255, 140, 0, 0.4);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(255, 140, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 140, 0, 0);
  }
`;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
};

const EmpleadoDashboardSkeleton = () => {
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  return (
    <Container disableGutters sx={{ py: isMobile ? 2 : 3, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ mb: 2, bgcolor: 'grey.200' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Skeleton width="40%" />
          </Typography>
          <Skeleton variant="circular" width={40} height={40} />
        </Toolbar>
      </AppBar>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4, mb: 2 }}>
        <Skeleton variant="circular" width={isMobile ? 120 : 180} height={isMobile ? 120 : 180} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="60%" sx={{ mb: 1 }} />
        <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="80%" height={100} sx={{ borderRadius: '10px' }} />
      </Box>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pb: 4, mt: 4 }}>
        <Skeleton variant="rectangular" width={200} height={60} sx={{ borderRadius: '10px', mb: 2 }} />
        <Skeleton variant="circular" width={120} height={120} />
      </Box>
    </Container>
  );
};

const EmpleadoDashboard: React.FC = () => {
  const { currentUser: authUser, refreshCurrentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { setIsSyncing, setLastSyncTime } = useSync();
  
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
  const [isCheckInDisabled, setIsCheckInDisabled] = useState(true);
  const [isCheckOutDisabled, setIsCheckOutDisabled] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expandedPayStub, setExpandedPayStub] = useState<string | null>(null);
  const [isBreaking, setIsBreaking] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);
  const [accumulatedBreakTime, setAccumulatedBreakTime] = useState(0);
  const [employeeAdjustments, setEmployeeAdjustments] = useState<Adjustment[]>([]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleNavClick = (tabIndex: number) => {
    setSelectedTab(tabIndex);
    handleMenuClose();
  };

  const handleStartBreak = () => {
    setIsBreaking(true);
    setBreakStartTime(new Date());
    setSnackbar({ open: true, message: 'Descanso iniciado.', severity: 'info' });
  };

  const handleEndBreak = () => {
    if (breakStartTime) {
      const breakDuration = new Date().getTime() - breakStartTime.getTime();
      setAccumulatedBreakTime(prev => prev + breakDuration);
      setIsBreaking(false);
      setBreakStartTime(null);
      setSnackbar({ open: true, message: 'Descanso finalizado.', severity: 'info' });
    }
  };

  useEffect(() => {
    setIsCheckInDisabled(!!lastCheckInId || !authUser || !isInRange || isBreaking);
    setIsCheckOutDisabled(!lastCheckInId || !authUser || !isInRange || isBreaking);
  }, [lastCheckInId, authUser, isInRange, isBreaking]);

  const GEOFENCE_RADIUS = 50;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendance = useCallback(async () => {
    if (!authUser) return;
    setIsSyncing(true);
    try {
      const allRecords = await getAttendance();
      const userRecords = allRecords.filter(rec => rec.employeeId.toString() === authUser.id);
      setAttendanceRecords(userRecords);
      const lastRecord = userRecords.find(rec => !rec.checkOut);
      setLastCheckInId(lastRecord ? lastRecord.id : null);
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    } finally {
      setIsSyncing(false);
      setLastSyncTime(new Date());
    }
  }, [authUser, setIsSyncing, setLastSyncTime]);

  useEffect(() => {
    if(authUser) {
      const fetchHotels = async () => {
        const hotelsData = await getHotels();
        setAllHotels(hotelsData);
      };
      const fetchAdjustments = async () => {
        const adjustmentsData = await getEmployeeAdjustments(authUser.id);
        setEmployeeAdjustments(adjustmentsData);
      };
      fetchHotels();
      fetchAttendance();
      fetchAdjustments();
    }
  }, [authUser, fetchAttendance]);

  const assignedHotel = useMemo(() => {
    if (!authUser || !authUser.hotel) return null;
    return allHotels.find(hotel => hotel.name === authUser.hotel);
  }, [authUser, allHotels]);

  useEffect(() => {
    if (assignedHotel) {
      if (assignedHotel.latitude !== undefined && assignedHotel.longitude !== undefined) {
        setHotelLocation({ latitude: assignedHotel.latitude, longitude: assignedHotel.longitude });
        setLocationError(null);
      } else {
        setLocationError('Ubicación del hotel no configurada.');
        setHotelLocation(null);
      }
    }
  }, [assignedHotel]);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocationError('Geolocalización no soportada.');
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationLoading(false);
      },
      (error) => {
        setLocationError(`Error de ubicación: ${error.message}`);
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
    if (!authUser || authUser.role !== 'Trabajador' || !authUser.hotel) {
      setSnackbar({ open: true, message: 'No cumples los requisitos para hacer check-in.', severity: 'error' });
      return;
    }
    setIsCameraOpen(true);
  };

  const handlePictureTaken = async (selfie: string) => {
    setIsCameraOpen(false);
    if (!authUser || !assignedHotel) return;
    const selfieUrl = await uploadSelfie(selfie);
    if (!selfieUrl) {
      setSnackbar({ open: true, message: 'Error al subir la selfie.', severity: 'error' });
      return;
    }
    const result = await checkIn(authUser.id, assignedHotel.id, selfieUrl);
    if (result.success && result.data) {
      setLastCheckInId(result.data.id);
      setSnackbar({ open: true, message: result.message, severity: 'success' });
      fetchAttendance();
    } else {
      setSnackbar({ open: true, message: result.message, severity: 'warning' });
    }
  };

  const handleCheckOut = async () => {
    if (!authUser) return;
    if (isBreaking && breakStartTime) {
      const breakDuration = new Date().getTime() - breakStartTime.getTime();
      setAccumulatedBreakTime(prev => prev + breakDuration);
      setIsBreaking(false);
      setBreakStartTime(null);
    }

    const result = await checkOut(authUser.id);
    if (result.success) {
      setSnackbar({ open: true, message: result.message, severity: 'success' });
      fetchAttendance();
      setAccumulatedBreakTime(0);
    } else {
      setSnackbar({ open: true, message: result.message, severity: 'error' });
    }
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
    if (!file || !authUser) return;
    try {
      const newImageUrl = await uploadProfilePicture(file);
      if (newImageUrl) {
        const updatedEmployee = { ...authUser, image_url: newImageUrl };
        await updateEmployee(updatedEmployee);
        await refreshCurrentUser();
        setSnackbar({ open: true, message: 'Foto de perfil actualizada', severity: 'success' });
      } else {
        throw new Error("La URL de la imagen no fue devuelta.");
      }
    } catch (error) {
      console.error("Error al actualizar la foto de perfil:", error);
      setSnackbar({ open: true, message: 'Error al subir la imagen', severity: 'error' });
    }
  };

  const filteredRecords = useMemo(() => attendanceRecords.filter(rec => rec.date >= startDate && rec.date <= endDate), [attendanceRecords, startDate, endDate]);

  const payHistoryData = useMemo(() => {
    if (!authUser || !assignedHotel) return [];

    const payrollSettings = { 
      week_cutoff_day: 'saturday', 
      overtime_enabled: false, 
      overtime_multiplier: 1.5, 
      ...(assignedHotel.payroll_settings as any || {}) 
    };
    const rates = (assignedHotel.payroll_settings as any)?.rates || {};
    const rateForPosition = rates[authUser.position] || 0;

    // Group records and adjustments by week start date
    const weeklyDataMap = new Map<string, { records: Attendance[], adjustments: Adjustment[] }>();

    [...attendanceRecords, ...employeeAdjustments].forEach(item => {
      const weekStartDate = getWeekStartDate(payrollSettings.week_cutoff_day, new Date(item.date)).toISOString().split('T')[0];
      if (!weeklyDataMap.has(weekStartDate)) {
        weeklyDataMap.set(weekStartDate, { records: [], adjustments: [] });
      }
      if ('workHours' in item) { // It's an Attendance record
        weeklyDataMap.get(weekStartDate)!.records.push(item as Attendance);
      } else { // It's an Adjustment
        weeklyDataMap.get(weekStartDate)!.adjustments.push(item as Adjustment);
      }
    });

    // Calculate pay for each week
    return Array.from(weeklyDataMap.entries()).map(([weekStartDate, { records, adjustments }]) => {
      const totalHours = records.reduce((acc, rec) => acc + (rec.workHours || 0), 0);
      
      let regularHours = totalHours;
      let overtimeHours = 0;
      if (payrollSettings.overtime_enabled && totalHours > 40) {
        regularHours = 40;
        overtimeHours = totalHours - 40;
      }

      const regularPay = regularHours * rateForPosition;
      const overtimePay = overtimeHours * rateForPosition * payrollSettings.overtime_multiplier;
      const basePay = regularPay + overtimePay;

      const adjustmentsTotal = adjustments.reduce((acc, adj) => {
        return adj.type === 'addition' ? acc + adj.amount : acc - adj.amount;
      }, 0);

      const totalPay = basePay + adjustmentsTotal;

      return {
        weekStartDate,
        totalHours,
        regularHours,
        overtimeHours,
        basePay,
        totalPay,
        adjustments,
        records,
      };
    }).sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate));

  }, [attendanceRecords, employeeAdjustments, assignedHotel, authUser]);

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
    const avgCheckIn = (records.length > 0) ? (() => { const avgMinutes = totalMinutes / records.length; const hours = Math.floor(avgMinutes / 60); const minutes = Math.round(avgMinutes % 60); return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`; })() : 'N/A';
    const avgDuration = (days > 0) ? (() => { const avgMilliseconds = totalMs / days; return formatDuration(avgMilliseconds); })() : 'N/A';
    return { totalHours: totalMs, daysWorked: days, averageCheckInTime: avgCheckIn, averageWorkDuration: avgDuration };
  }, [filteredRecords]);

  if (!authUser) {
    return <EmpleadoDashboardSkeleton />;
  }

  const renderContent = () => {
    const chartData = useMemo(() => {
      const dailyHours = filteredRecords.reduce((acc, record) => {
        const day = new Date(record.date).toLocaleDateString('es-ES', { weekday: 'short' });
        const hours = record.workHours || 0;
        acc[day] = (acc[day] || 0) + hours;
        return acc;
      }, {} as { [key: string]: number });

      return Object.entries(dailyHours).map(([day, hours]) => ({ day, hours }));
    }, [filteredRecords]);
    const currentStatus = !lastCheckInId ? 'checked-out' : isBreaking ? 'on-break' : 'checked-in';

    switch (selectedTab) {
      case 0: // Home
        return (
          <Fade in={true} timeout={1000}>
            <Box sx={{ width: '100%', flexGrow: 1, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundImage: `linear-gradient(to bottom, rgba(255,140,0,0.2), rgba(255,140,0,0.6)), url(https://source.unsplash.com/1600x900/?hotel,modern)`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'white' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, pt: 4, px: 2 }}>
                {authUser && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    <Avatar key={authUser.image_url} src={authUser.image_url} sx={{ width: isMobile ? 120 : 180, height: isMobile ? 120 : 180, mb: 1, border: `4px solid ${isInRange ? theme.palette.success.main : theme.palette.error.main}` }} />
                    <Button variant="contained" component="label" size="small" startIcon={<EditIcon />}>
                      Cambiar Foto
                      <input hidden accept="image/*" type="file" onChange={handleProfilePictureChange} />
                    </Button>
                  </Box>
                )}
                <StatusCard status={currentStatus} />
                <Paper elevation={1} sx={{ p: 2, mt: 2, borderRadius: '10px', width: '100%', border: '1px solid #e0e0e0' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1 }}>
                    {locationLoading && <LocationSearchingIcon color="info" sx={{ fontSize: 40, mb: 1 }} />}
                    {locationError && <CancelOutlinedIcon color="error" sx={{ fontSize: 40, mb: 1 }} />}
                    {distance !== null && isInRange && <CheckCircleOutlineIcon color="success" sx={{ fontSize: 40, mb: 1 }} />}
                    {distance !== null && !isInRange && <CancelOutlinedIcon color="error" sx={{ fontSize: 40, mb: 1 }} />}
                    <Typography variant="h6" align="center">Estado de Ubicación</Typography>
                  </Box>
                  {locationLoading && <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress size={24} sx={{ mr: 1 }} /> Obteniendo ubicación...</Box>}
                  {locationError && <Typography color="error" align="center">{locationError}</Typography>}
                  {userLocation && hotelLocation && (
                    <Box sx={{ textAlign: 'center' }}>
                      <LocationMap userLocation={[userLocation.latitude, userLocation.longitude]} hotelLocation={[hotelLocation.latitude, hotelLocation.longitude]} geofenceRadius={GEOFENCE_RADIUS} />
                      <Typography sx={{ mt: 1 }}>Estás a {distance?.toFixed(0)} metros del hotel.</Typography>
                      <Typography color={isInRange ? 'success.main' : 'error.main'}>
                        {isInRange ? 'En rango para Check-in/Check-out.' : 'Fuera de rango para Check-in/Check-out.'}
                      </Typography>
                    </Box>
                  )}
                </Paper>
                {assignedHotel && (
                  <Chip icon={<LocationOnIcon sx={{ color: 'white !important' }} />} label={assignedHotel.name} variant="outlined" sx={{ mt: 2, fontSize: isMobile ? '0.8rem' : '1rem', color: 'white', borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(0,0,0,0.2)', '& .MuiChip-label': { textShadow: '1px 1px 2px rgba(0,0,0,0.7)' } }} />
                )}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative', zIndex: 1, pb: 4, mt: 4 }}>
                <Box sx={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.2)', mb: 2 }}>
                  <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 'bold', fontFamily: 'monospace', color: 'white' }}>
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={2} sx={{ mb: 2, height: 120 }}>
                  {currentStatus === 'checked-out' && (
                    <Fab color="default" aria-label="check-in" onClick={handleCheckIn} disabled={isCheckInDisabled} sx={{ width: 120, height: 120, backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.25)' } }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <LoginIcon sx={{ color: 'white' }} />
                        <Typography variant="caption" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>Check-in</Typography>
                      </Box>
                    </Fab>
                  )}
                  {currentStatus === 'checked-in' && (
                    <>
                      <Fab color="default" aria-label="check-out" onClick={handleCheckOut} disabled={isCheckOutDisabled} sx={{ width: 120, height: 120, backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.25)' } }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <LogoutIcon sx={{ color: 'white' }} />
                          <Typography variant="caption" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>Check-out</Typography>
                        </Box>
                      </Fab>
                      <Fab color="default" aria-label="start-break" onClick={handleStartBreak} sx={{ width: 120, height: 120, backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white', '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.25)' } }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <PauseCircleOutlineIcon sx={{ color: 'white' }} />
                          <Typography variant="caption" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>Descanso</Typography>
                        </Box>
                      </Fab>
                    </>
                  )}
                  {currentStatus === 'on-break' && (
                    <Fab color="warning" aria-label="end-break" onClick={handleEndBreak} sx={{ width: 120, height: 120, backgroundColor: 'rgba(255, 140, 0, 0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white', '&:hover': { backgroundColor: 'rgba(255, 140, 0, 0.8)' } }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <PlayCircleOutlineIcon sx={{ color: 'white' }} />
                        <Typography variant="caption" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>Fin Descanso</Typography>
                      </Box>
                    </Fab>
                  )}
                </Stack>
              </Box>
            </Box>
          </Fade>
        );
      case 1: // Registros
        return (
          <Fade in={true} timeout={1000}>
            <Box>
              <AppBar position="static" sx={{ mb: 2 }}>
                <Toolbar>
                  <IconButton edge="start" color="inherit" onClick={() => handleNavClick(0)} aria-label="back"><ArrowBackIcon /></IconButton>
                  <Typography variant="h6" component="div">Mis Registros</Typography>
                </Toolbar>
              </AppBar>
              <Box sx={{ p: 2 }}>
                <Paper elevation={1} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0' }}>
                  <Typography variant="h6" gutterBottom>Horas Trabajadas esta Semana</Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="hours" fill={theme.palette.primary.main} />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
                <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
                  <Typography variant="h6">Historial de Registros</Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField type="date" label="Fecha de inicio" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
                    <TextField type="date" label="Fecha de fin" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
                  </Box>
                </Box>
                {filteredRecords.map((rec) => (
                  <Card key={rec.id} elevation={1} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={8}>
                          <Typography variant="h6">{new Date(rec.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</Typography>
                          <Typography color="text.secondary">
                            {rec.checkIn} - {rec.checkOut || 'En curso'}
                          </Typography>
                        </Grid>
                        <Grid item xs={3} sx={{ textAlign: 'right' }}>
                          <Typography variant="h5" component="div">
                            {rec.workHours ? `${rec.workHours.toFixed(2)}h` : '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={1} sx={{ textAlign: 'right' }}>
                          <IconButton size="small" onClick={() => handleOpenCorrectionModal(rec)} disabled={rec.status === 'pending_review'}>
                            <EditIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          </Fade>
        );
      case 2: // Soporte
        return (
          <Fade in={true} timeout={1000}>
            <Box>
              <AppBar position="static" sx={{ mb: 2 }}>
                <Toolbar>
                  <IconButton edge="start" color="inherit" onClick={() => handleNavClick(0)} aria-label="back"><ArrowBackIcon /></IconButton>
                  <Typography variant="h6" component="div">Soporte Técnico</Typography>
                </Toolbar>
              </AppBar>
              <Paper elevation={1} sx={{ p: 2, mx: 2, border: '1px solid #e0e0e0' }}>
                <Typography variant="h6" gutterBottom>Soporte Técnico</Typography>
                <TextField label="Describe tu problema" multiline rows={6} fullWidth variant="outlined" sx={{ mb: 2 }} value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} />
                <Button variant="contained" color="primary" onClick={handleSubmitSupport}>Enviar Solicitud</Button>
              </Paper>
            </Box>
          </Fade>
        );
      case 3: // Mis Desprendibles
        return (
          <Fade in={true} timeout={1000}>
            <Box>
              <AppBar position="static" sx={{ mb: 2 }}>
                <Toolbar>
                  <IconButton edge="start" color="inherit" onClick={() => handleNavClick(0)} aria-label="back"><ArrowBackIcon /></IconButton>
                  <Typography variant="h6" component="div">Mis Desprendibles de Pago</Typography>
                </Toolbar>
              </AppBar>
              <Box sx={{ p: 2 }}>
                <TableContainer component={Paper}>
                  <Table aria-label="collapsible table">
                    <TableHead>
                      <TableRow>
                        <TableCell />
                        <TableCell>Semana</TableCell>
                        <TableCell align="right">Horas Totales</TableCell>
                        <TableCell align="right">Pago Neto</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payHistoryData.map((weekData) => {
                        const isExpanded = expandedPayStub === weekData.weekStartDate;
                        return (
                          <React.Fragment key={weekData.weekStartDate}>
                            <TableRow sx={{ '& > *': { borderBottom: 'unset' }, cursor: 'pointer' }} onClick={() => setExpandedPayStub(isExpanded ? null : weekData.weekStartDate)}>
                              <TableCell>
                                <IconButton aria-label="expand row" size="small">
                                  {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                </IconButton>
                              </TableCell>
                              <TableCell component="th" scope="row">
                                {new Date(weekData.weekStartDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell align="right">{weekData.totalHours.toFixed(2)}</TableCell>
                              <TableCell align="right">{weekData.totalPay.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                  <Box sx={{ margin: 1, p: 2, backgroundColor: '#f9f9f9', borderRadius: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Typography variant="h6" gutterBottom component="div">
                                        Desglose del Pago
                                      </Typography>
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!authUser || !assignedHotel) return;
                                          const payStubData = {
                                            employee: { id: authUser.id, name: authUser.name, position: authUser.position },
                                            weekStartDate: weekData.weekStartDate,
                                            ...weekData
                                          };
                                          generatePayStubPDF(payStubData, assignedHotel, weekData.weekStartDate);
                                        }}
                                      >
                                        Descargar PDF
                                      </Button>
                                    </Box>
                                    <Table size="small" aria-label="details">
                                      <TableBody>
                                        <TableRow>
                                          <TableCell>Pago Base (Horas)</TableCell>
                                          <TableCell align="right">{weekData.basePay.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                          <TableCell>({weekData.regularHours.toFixed(2)}h Reg. + {weekData.overtimeHours.toFixed(2)}h OT)</TableCell>
                                        </TableRow>
                                        {weekData.adjustments.length > 0 && (
                                          <TableRow>
                                            <TableCell colSpan={3} style={{ fontWeight: 'bold', borderBottom: 'none', paddingTop: '16px' }}>Ajustes</TableCell>
                                          </TableRow>
                                        )}
                                        {weekData.adjustments.map((adj) => (
                                          <TableRow key={adj.id}>
                                            <TableCell style={{ paddingLeft: '32px' }}>{adj.description}</TableCell>
                                            <TableCell align="right" style={{ color: adj.type === 'addition' ? 'green' : 'red' }}>
                                              {`${adj.type === 'addition' ? '+' : '-'}${adj.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`}
                                            </TableCell>
                                            <TableCell>{new Date(adj.date).toLocaleDateString()}</TableCell>
                                          </TableRow>
                                        ))}
                                        <TableRow>
                                          <TableCell style={{ fontWeight: 'bold', borderTop: '2px solid black' }}>Pago Neto</TableCell>
                                          <TableCell align="right" style={{ fontWeight: 'bold', borderTop: '2px solid black' }}>{weekData.totalPay.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                          <TableCell style={{ borderTop: '2px solid black' }}></TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </Box>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          </Fade>
        );
      default: return null;
    }
  };

  return (
    <Container disableGutters sx={{ py: isMobile ? 2 : 3, display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
      <AppBar position="static" sx={{ mb: 2 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ¡{getGreeting()}, {authUser?.name}!
          </Typography>
          <IconButton size="large" edge="end" color="inherit" aria-label="menu" onClick={handleMenuOpen}>
            <MenuIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={() => handleNavClick(1)}>Mis Registros</MenuItem>
            <MenuItem onClick={() => handleNavClick(3)}>Mis Desprendibles</MenuItem>
            <MenuItem onClick={() => handleNavClick(2)}>Soporte Técnico</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box sx={{ width: '100%', flexGrow: 1, position: 'relative' }}>
        {renderContent()}
      </Box>
      <Dialog open={correctionModalOpen} onClose={handleCloseCorrectionModal}><DialogTitle>Solicitar Corrección</DialogTitle><DialogContent><DialogContentText>Describe el problema con este registro de asistencia. Tu supervisor revisará tu solicitud.</DialogContentText><TextField autoFocus margin="dense" id="correction-message" label="Mensaje" type="text" fullWidth variant="standard" value={correctionMessage} onChange={(e) => setCorrectionMessage(e.target.value)} multiline rows={4} /></DialogContent><DialogActions><Button onClick={handleCloseCorrectionModal}>Cancelar</Button><Button onClick={handleSubmitCorrection}>Enviar Solicitud</Button></DialogActions></Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}><Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert></Snackbar>
      <SelfieCamera open={isCameraOpen} onClose={useCallback(() => setIsCameraOpen(false), [])} onPictureTaken={handlePictureTaken} />
    </Container>
  );
};

export default EmpleadoDashboard;
