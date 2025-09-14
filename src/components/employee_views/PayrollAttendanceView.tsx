import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Snackbar, Alert, Card, CardContent, Chip, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, IconButton,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTimeOutlined';
import EditIcon from '@mui/icons-material/Edit';
import { Attendance } from '../../data/database';
import { getAttendance, requestCorrection } from '../../data/attendance';
import { useAuth } from '../../context/AuthContext';

interface PayrollAttendanceViewProps {
  // Props from EmpleadoDashboard
  attendanceRecords: Attendance[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<Attendance[]>>;
  snackbar: { open: boolean, message: string, severity: 'success' | 'error' | 'warning' };
  setSnackbar: React.Dispatch<React.SetStateAction<{ open: boolean, message: string, severity: 'success' | 'error' | 'warning' }>>;
  handleCloseSnackbar: () => void;
  fetchAttendance: () => void;
}

// Helper function to format duration
const formatDuration = (milliseconds: number) => {
  if (milliseconds < 0) return 'N/A';
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
};

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

const PayrollAttendanceView: React.FC<PayrollAttendanceViewProps> = ({
  attendanceRecords,
  setAttendanceRecords,
  snackbar,
  setSnackbar,
  handleCloseSnackbar,
  fetchAttendance,
}) => {
  const { currentUser } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
  const [correctionMessage, setCorrectionMessage] = useState("");

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

  return (
    <Box sx={{ p: 2 }}>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
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
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
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
    </Box>
  );
};

export default PayrollAttendanceView;