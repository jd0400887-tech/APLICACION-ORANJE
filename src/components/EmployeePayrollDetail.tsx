import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Grid, Card, CardContent, IconButton, Chip, CircularProgress, Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { Hotel, Employee } from '../data/database';
import { Attendance, updateAttendanceRecord } from '../data/attendance';
import { calculateWeeklyHours, WeeklyHours, getWeekStartDate } from '../utils/payroll';
import { PayrollSettings } from './PayrollSettingsDialog';
import EditAttendanceDialog from './EditAttendanceDialog';
import { getWeeklyApproval, approveWeek, WeeklyApproval } from '../data/approvals';

interface EmployeePayrollDetailProps {
  employee: Employee;
  hotel: Hotel;
  allRecordsForEmployee: Attendance[];
  onBack: () => void;
  onRefreshHotelPayroll: () => void; 
  currentUser: any; // New prop
}

function EmployeePayrollDetail({ employee, hotel, allRecordsForEmployee, onBack, onRefreshHotelPayroll, currentUser }: EmployeePayrollDetailProps) {
  const [targetDate, setTargetDate] = useState(new Date());
  const [localRecords, setLocalRecords] = useState(allRecordsForEmployee);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved'>('pending');
  const [isApproving, setIsApproving] = useState(false);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);

  const payrollSettings = useMemo(() => {
    const defaults: PayrollSettings = { week_cutoff_day: 'saturday', overtime_enabled: false, overtime_multiplier: 1.5 };
    return { ...defaults, ...(hotel.payroll_settings as PayrollSettings || {}) };
  }, [hotel]);

  const weekStartDate = useMemo(() => getWeekStartDate(payrollSettings.week_cutoff_day, targetDate), [payrollSettings.week_cutoff_day, targetDate]);

  useEffect(() => {
    const fetchApprovalStatus = async () => {
      const approval = await getWeeklyApproval(employee.id, weekStartDate.toISOString().split('T')[0]);
      setApprovalStatus(approval?.status || 'pending');
    };
    fetchApprovalStatus();
  }, [employee.id, weekStartDate]);

  useEffect(() => {
    setLocalRecords(allRecordsForEmployee);
  }, [allRecordsForEmployee]);

  const weeklyData: WeeklyHours = useMemo(() => {
    return calculateWeeklyHours(localRecords, payrollSettings, targetDate);
  }, [localRecords, payrollSettings, targetDate]);

  useEffect(() => {
    const fetchAdjustments = async () => {
      if (employee) {
        const employeeAdjustments = await getEmployeeAdjustments(parseInt(employee.id));
        setAdjustments(employeeAdjustments);
      }
    };
    fetchAdjustments();
  }, [employee, weekStartDate]);

  const weeklyAdjustments = useMemo(() => {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    const weeklyAdjustments = adjustments.filter(adj => {
      const adjDate = new Date(adj.date);
      return adjDate >= weekStartDate && adjDate <= weekEndDate;
    });

    const totalAdditions = weeklyAdjustments
      .filter(adj => adj.type === 'addition')
      .reduce((acc, adj) => acc + adj.amount, 0);

    const totalDeductions = weeklyAdjustments
      .filter(adj => adj.type === 'deduction')
      .reduce((acc, adj) => acc + adj.amount, 0);

    return { weeklyAdjustments, totalAdditions, totalDeductions };
  }, [adjustments, weekStartDate]);

  const weeklyPay = useMemo(() => {
    const position = employee.position || '';
    const payRate = hotel.hourly_rates_by_position?.[position] || 0;
    const billRate = hotel.billing_rates_by_position?.[position] || 0;
    const overtimeMultiplier = payrollSettings.overtime_multiplier;
    const regularPay = weeklyData.regular * payRate;
    const overtimePay = weeklyData.overtime * payRate * overtimeMultiplier;
    const totalPay = regularPay + overtimePay + weeklyAdjustments.totalAdditions - weeklyAdjustments.totalDeductions;
    const regularBill = weeklyData.regular * billRate;
    const overtimeBill = weeklyData.overtime * billRate * overtimeMultiplier;
    const totalBill = regularBill + overtimeBill;
    return { totalPay, totalBill };
  }, [weeklyData, employee.position, hotel, payrollSettings, weeklyAdjustments]);

  const changeWeek = (direction: 'previous' | 'next') => setTargetDate(current => {
    const newDate = new Date(current);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    return newDate;
  });

  const handleEditClick = (record: Attendance) => {
    setEditingRecord(record);
    setIsEditDialogOpen(true);
  };

  const handleSaveEditedRecord = async (updatedRecord: any) => {
    const saved = await updateAttendanceRecord(updatedRecord.id, { check_in: updatedRecord.check_in_datetime, check_out: updatedRecord.check_out_datetime });
    
    if (saved) {
        const remappedRecord: Attendance = {
            id: saved.id,
            employeeId: saved.employee_id,
            employeeName: employee.name, // Assuming employee context is sufficient
            hotelName: hotel.name, // Assuming hotel context is sufficient
            position: employee.position,
            date: new Date(saved.check_in).toISOString().split('T')[0],
            checkIn: new Date(saved.check_in).toLocaleTimeString(),
            checkOut: saved.check_out ? new Date(saved.check_out).toLocaleTimeString() : null,
            workHours: saved.check_out ? (new Date(saved.check_out).getTime() - new Date(saved.check_in).getTime()) / 3600000 : null,
            status: saved.status,
            correctionRequest: saved.correction_request,
            checkInSelfie: saved.check_in_selfie_url,
        };

        setLocalRecords(prevRecords => 
            prevRecords.map(r => r.id === remappedRecord.id ? remappedRecord : r)
        );
    }
    setIsEditDialogOpen(false);
    setEditingRecord(null);
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const approved = await approveWeek(hotel.id, employee.id, weekStartDate.toISOString().split('T')[0]);
      if (approved) {
        setApprovalStatus('approved');
        console.log('Semana aprobada con éxito!', approved);
        onRefreshHotelPayroll(); // Refresh the hotel-specific payroll view
      } else {
        console.error('Fallo al aprobar la semana: La operación no devolvió un registro aprobado.');
      }
    } catch (error) {
      console.error('Error al intentar aprobar la semana:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const canApproveIndividualEmployeeWeek = useMemo(() => {
    // Add a defensive check for currentUser being undefined
    if (!currentUser) {
      console.warn("currentUser is undefined in EmployeePayrollDetail. Cannot check role.");
      return false;
    }
    return currentUser.role === 'Hotel Manager';
  }, [currentUser]); // Depend on currentUser, not just currentUser.role

  return (
    <Box>
      <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2 }}>Volver</Button>
      <Typography variant="h5" gutterBottom>Detalle Semanal para {employee.name}</Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => changeWeek('previous')}><NavigateBeforeIcon /></IconButton>
        <Typography variant="h6">Semana del {weekStartDate.toLocaleDateString()}</Typography>
        <IconButton onClick={() => changeWeek('next')}><NavigateNextIcon /></IconButton>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Chip 
          icon={approvalStatus === 'approved' ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
          label={approvalStatus === 'approved' ? 'Semana Aprobada' : 'Pendiente de Aprobación'}
          color={approvalStatus === 'approved' ? 'success' : 'warning'}
        />
        {canApproveIndividualEmployeeWeek && (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleApprove}
            disabled={approvalStatus === 'approved' || isApproving}
          >
            {isApproving ? <CircularProgress size={24} /> : `Aprobar Semana para ${employee.name}`}
          </Button>
        )}
      </Box>
      
      <Alert severity="info" sx={{ mb: 2 }}>Recuerde aprobar todas las horas semanales antes del Miércoles.</Alert>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}><Card><CardContent><Typography>Horas Regulares</Typography><Typography variant="h5">{weeklyData.regular.toFixed(2)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} md={4}><Card><CardContent><Typography>Horas Overtime</Typography><Typography variant="h5">{weeklyData.overtime.toFixed(2)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} md={4}><Card><CardContent><Typography>Adiciones</Typography><Typography variant="h5">${weeklyAdjustments.totalAdditions.toFixed(2)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} md={4}><Card><CardContent><Typography>Deducciones</Typography><Typography variant="h5">-${weeklyAdjustments.totalDeductions.toFixed(2)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} md={6}><Card><CardContent><Typography>Pago Total</Typography><Typography variant="h5">${weeklyPay.totalPay.toFixed(2)}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} md={6}><Card><CardContent><Typography>Facturación Total</Typography><Typography variant="h5">${weeklyPay.totalBill.toFixed(2)}</Typography></CardContent></Card></Grid>
      </Grid>

      {weeklyAdjustments.weeklyAdjustments.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Ajustes de la Semana</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Descripción</TableCell><TableCell align="right">Monto</TableCell></TableRow></TableHead>
              <TableBody>
                {weeklyAdjustments.weeklyAdjustments.map(adj => (
                  <TableRow key={adj.id}>
                    <TableCell>{new Date(adj.date).toLocaleDateString()}</TableCell>
                    <TableCell>{adj.description}</TableCell>
                    <TableCell align="right">{adj.type === 'addition' ? '+' : '-'}$${adj.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Horas Trabajadas</Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Entrada</TableCell><TableCell>Salida</TableCell><TableCell align="right">Horas</TableCell><TableCell align="center">Acciones</TableCell></TableRow></TableHead>
          <TableBody>
            {weeklyData.records.map(record => (
              <TableRow key={record.id}>
                <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                <TableCell>{record.checkIn}</TableCell>
                <TableCell>{record.checkOut || 'N/A'}</TableCell>
                <TableCell align="right">{record.workHours?.toFixed(2) || 'N/A'}</TableCell>
                <TableCell align="center"><Button size="small" onClick={() => handleEditClick(record)} disabled={approvalStatus === 'approved'}>Editar</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <EditAttendanceDialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} record={editingRecord} onSave={handleSaveEditedRecord} />
    </Box>
  );
}

export default EmployeePayrollDetail;