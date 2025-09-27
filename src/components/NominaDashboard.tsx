
import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Typography, Paper, Box, CircularProgress, Accordion, AccordionSummary, AccordionDetails, Button, Chip, TextField, ToggleButtonGroup, ToggleButton, Tabs, Tab, Card, CardActionArea, CardContent
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getAttendance, Attendance } from '../data/attendance';
import { getEmployees, Hotel, Employee, getAllAdjustments, Adjustment } from '../data/database';
import { getAllWeeklyApprovals } from '../data/approvals';
import { getWeekStartDate } from '../utils/payroll';
import InvoiceView from './InvoiceView';
import WeeklyReportDetail from './WeeklyReportDetail';
import EmployeePayrollHistory from './EmployeePayrollHistory';
import EmployeeAdjustmentsView from './EmployeeAdjustmentsView';
import { useSync } from '../context/SyncContext';
import * as XLSX from 'xlsx';

interface ProcessedWeek {
  weekStartDate: string;
  employeeApprovals: Map<number, 'pending' | 'approved'>;
  records: Attendance[];
  totalHours: number;
  employeeCount: number;
  approvalStatus: 'pending' | 'partially_approved' | 'approved';
  totalPay: number;
}

interface NominaDashboardProps {
  currentUser: any;
  hotels: Hotel[];
}

type ProcessedData = Map<number, { hotelName: string; weeks: Map<string, ProcessedWeek> }>;

const NominaDashboard: React.FC<NominaDashboardProps> = ({ currentUser, hotels }) => {
  const [loading, setLoading] = useState(true);
  const [processedData, setProcessedData] = useState<ProcessedData>(new Map());
  const [viewingInvoiceFor, setViewingInvoiceFor] = useState<{ hotel: Hotel, week: ProcessedWeek } | null>(null);
  const [viewingWeekDetailFor, setViewingWeekDetailFor] = useState<{ hotel: Hotel, week: ProcessedWeek } | null>(null);
  const [viewingEmployeeHistory, setViewingEmployeeHistory] = useState<number | null>(null);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [allAdjustments, setAllAdjustments] = useState<Adjustment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentView, setCurrentView] = useState<'dashboard' | 'global_payroll' | 'employee_adjustments'>('dashboard');

  const { setIsSyncing, setLastSyncTime } = useSync();

  const clientHotels = useMemo(() => hotels.filter(h => h.status === 'Client'), [hotels]);

  const fetchAndProcessData = async () => {
    setLoading(true);
    setIsSyncing(true);
    try {
      const [approvals, records, employees, adjustments] = await Promise.all([
        getAllWeeklyApprovals(),
        getAttendance(),
        getEmployees(),
        getAllAdjustments()
      ]);

      setAllEmployees(employees);
      setAllAdjustments(adjustments);

      const newProcessedData: ProcessedData = new Map();
      clientHotels.forEach(h => newProcessedData.set(h.id, { hotelName: h.name, weeks: new Map() }));

      records.forEach(record => {
        const hotel = clientHotels.find(h => h.name === record.hotelName);
        if (!hotel) return;
        const payrollSettings = { week_cutoff_day: 'saturday', ...(hotel.payroll_settings as any || {}) };
        const weekStartDate = getWeekStartDate(payrollSettings.week_cutoff_day, new Date(record.date)).toISOString().split('T')[0];
        let hotelData = newProcessedData.get(hotel.id);
        if (!hotelData) return;
        let weekData = hotelData.weeks.get(weekStartDate);
        if (!weekData) {
          weekData = { 
            weekStartDate, 
            employeeApprovals: new Map(), 
            records: [],
            totalHours: 0,
            employeeCount: 0,
            approvalStatus: 'pending',
            totalPay: 0
          };
          hotelData.weeks.set(weekStartDate, weekData);
        }
        weekData.records.push(record);
      });

      newProcessedData.forEach(hotelData => {
        hotelData.weeks.forEach(weekData => {
          weekData.records.forEach(record => {
            if (!weekData.employeeApprovals.has(record.employeeId)) {
              weekData.employeeApprovals.set(record.employeeId, 'pending');
            }
          });
        });
      });

      approvals.forEach(approval => {
        const hotelData = newProcessedData.get(approval.hotel_id);
        if (hotelData) {
          const weekData = hotelData.weeks.get(approval.week_start_date);
          if (weekData) {
            weekData.employeeApprovals.set(approval.employee_id, approval.status);
          }
        }
      });

      newProcessedData.forEach((hotelData, hotelId) => {
        const hotel = clientHotels.find(h => h.id === hotelId);
        const rates = (hotel?.payroll_settings as any)?.rates || {};

        hotelData.weeks.forEach(weekData => {
          // Calculate base pay from hours
          let basePay = 0;
          weekData.records.forEach(record => {
            const rateForPosition = rates[record.position] || 0;
            basePay += (record.workHours || 0) * rateForPosition;
          });

          // Find and apply adjustments for the week
          const weekStart = new Date(weekData.weekStartDate);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);

          let totalAdjustments = 0;
          const employeeIdsInWeek = Array.from(weekData.employeeApprovals.keys());

          allAdjustments
            .filter(adj => employeeIdsInWeek.includes(adj.employee_id))
            .forEach(adj => {
              const adjDate = new Date(adj.date);
              if (adjDate >= weekStart && adjDate <= weekEnd) {
                if (adj.type === 'addition') {
                  totalAdjustments += adj.amount;
                } else {
                  totalAdjustments -= adj.amount;
                }
              }
            });

          // Calculate totals
          const statuses = Array.from(weekData.employeeApprovals.values());
          const totalHours = weekData.records.reduce((acc, rec) => acc + (rec.workHours || 0), 0);
          const employeeCount = weekData.employeeApprovals.size;
          
          weekData.totalHours = totalHours;
          weekData.employeeCount = employeeCount;
          weekData.totalPay = basePay + totalAdjustments;

          // Determine approval status
          if (statuses.length === 0) {
              weekData.approvalStatus = 'pending';
          } else if (statuses.every(s => s === 'approved')) {
              weekData.approvalStatus = 'approved';
          } else if (statuses.some(s => s === 'approved')) {
              weekData.approvalStatus = 'partially_approved';
          } else {
              weekData.approvalStatus = 'pending';
          }
        });
      });

      setProcessedData(newProcessedData);
    } catch (error) {
      console.error("Failed to fetch or process payroll data:", error);
    } finally {
      setLoading(false);
      setIsSyncing(false);
      setLastSyncTime(new Date());
    }
  };

  useEffect(() => {
    if (clientHotels.length > 0) {
      fetchAndProcessData();
    }
  }, [clientHotels]);

  const handleExport = () => {
    const detailExportData: any[] = [];
    const summaryExportData: any[] = [];
    
    const statusLabels: { [key: string]: string } = {
      approved: 'Aprobado',
      partially_approved: 'Parcial Aprobado',
      pending: 'Pendiente',
    };

    Array.from(processedData.entries())
      .filter(([_, { hotelName }]) => hotelName.toLowerCase().includes(searchQuery.toLowerCase()))
      .forEach(([_, { hotelName, weeks }]) => {
        const filteredWeeks = Array.from(weeks.values()).filter(week => {
          if (filterStatus === 'all') return true;
          if (filterStatus === 'pending') return week.approvalStatus === 'pending';
          if (filterStatus === 'partially_approved') return week.approvalStatus === 'partially_approved';
          if (filterStatus === 'approved') return week.approvalStatus === 'approved';
          return true;
        });

        filteredWeeks.forEach(week => {
          const weekStatusLabel = statusLabels[week.approvalStatus] || 'Pendiente';
          
          // Add to summary data
          summaryExportData.push({
            'Hotel': hotelName,
            'Semana de Inicio': week.weekStartDate,
            'Estado': weekStatusLabel,
            'Total Horas': week.totalHours.toFixed(2),
            'Nº Empleados': week.employeeCount,
            'Total Pago': week.totalPay.toFixed(2),
          });

          // Add to detail data
          week.records.forEach(record => {
            detailExportData.push({
              'Hotel': hotelName,
              'Semana de Inicio': week.weekStartDate,
              'Empleado': record.employeeName,
              'Cargo': record.position,
              'Fecha': record.date,
              'Entrada': record.checkIn,
              'Salida': record.checkOut,
              'Horas Trabajadas': record.workHours?.toFixed(2),
              'Estado Aprobación Semanal': weekStatusLabel,
            });
          });
        });
      });

    const detailWorksheet = XLSX.utils.json_to_sheet(detailExportData);
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryExportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Resumen Semanal");
    XLSX.utils.book_append_sheet(workbook, detailWorksheet, "Detalle Nómina");
    XLSX.writeFile(workbook, "nomina_export.xlsx");
  };

  const handleWeekClick = (hotelId: number, week: ProcessedWeek) => {
    const hotel = clientHotels.find(h => h.id === hotelId);
    if (hotel) {
      setViewingWeekDetailFor({ hotel, week });
    }
  };

  const handleGenerateInvoice = () => {
    if (viewingWeekDetailFor) {
      setViewingInvoiceFor(viewingWeekDetailFor);
      setViewingWeekDetailFor(null);
    }
  };

  const handleViewEmployeeHistory = (employeeId: number) => {
    setViewingWeekDetailFor(null);
    setViewingEmployeeHistory(employeeId);
  };

  const handleBackToDashboard = () => {
    setViewingInvoiceFor(null);
    setViewingWeekDetailFor(null);
    setViewingEmployeeHistory(null);
  };

  if (loading) {
    return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Container>;
  }

  if (viewingEmployeeHistory) {
    return <EmployeePayrollHistory employeeId={viewingEmployeeHistory} onBack={handleBackToDashboard} />;
  }

  if (viewingInvoiceFor) {
    return <InvoiceView hotel={viewingInvoiceFor.hotel} records={viewingInvoiceFor.week.records} employees={allEmployees} allAdjustments={allAdjustments} onBack={handleBackToDashboard} />;
  }

  if (viewingWeekDetailFor) {
    return <WeeklyReportDetail 
      hotel={viewingWeekDetailFor.hotel} 
      week={viewingWeekDetailFor.week} 
      employees={allEmployees} 
      allAdjustments={allAdjustments} // Pass adjustments down
      onBack={handleBackToDashboard} 
      onGenerateInvoice={handleGenerateInvoice} 
      onRefreshDashboard={fetchAndProcessData} 
      onViewEmployeeHistory={handleViewEmployeeHistory}
    />;
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Nómina</Typography>

      {currentView === 'dashboard' && (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mt: 4, justifyContent: 'center', alignItems: 'center' }}>
          <Card sx={{ minWidth: 275, maxWidth: 345 }}>
            <CardActionArea onClick={() => setCurrentView('global_payroll')} sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Typography variant="h5" component="div">
                  Nómina Global
                </Typography>
                <Typography sx={{ mt: 1.5 }} color="text.secondary">
                  Supervisa y aprueba la nómina semanal de todos los hoteles.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
          <Card sx={{ minWidth: 275, maxWidth: 345 }}>
            <CardActionArea onClick={() => setCurrentView('employee_adjustments')} sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Typography variant="h5" component="div">
                  Ajustes de Empleados
                </Typography>
                <Typography sx={{ mt: 1.5 }} color="text.secondary">
                  Añade bonos, deducciones o corrige las horas de empleados individuales.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Box>
      )}

      {currentView === 'global_payroll' && (
        <>
          <Button onClick={() => setCurrentView('dashboard')} sx={{ mb: 2 }} startIcon={<ExpandMoreIcon sx={{ transform: 'rotate(90deg)' }} />}>
            Volver al Menú
          </Button>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Supervisa las aprobaciones de nómina de todos los hoteles. Haz clic en una semana para ver el detalle.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="Buscar Hotel"
              variant="outlined"
              size="small"
              sx={{ flexGrow: 1, minWidth: '200px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <ToggleButtonGroup
              value={filterStatus}
              exclusive
              onChange={(e, newValue) => newValue && setFilterStatus(newValue)}
              aria-label="filter status"
              size="small"
            >
              <ToggleButton value="all" aria-label="all">Todos</ToggleButton>
              <ToggleButton value="pending" aria-label="pending">Pendientes</ToggleButton>
              <ToggleButton value="partially_approved" aria-label="partially_approved">Parciales</ToggleButton>
              <ToggleButton value="approved" aria-label="approved">Aprobados</ToggleButton>
            </ToggleButtonGroup>
            <Button variant="contained" onClick={handleExport}>Exportar</Button>
          </Box>

          {Array.from(processedData.entries())
            .filter(([hotelId, { hotelName }]) => {
                const hotel = clientHotels.find(h => h.id === hotelId);
                return hotel && hotelName.toLowerCase().includes(searchQuery.toLowerCase());
            })
            .map(([hotelId, { hotelName, weeks }]) => {
              
              const filteredWeeks = Array.from(weeks.values()).filter(week => {
                if (filterStatus === 'all') return true;
                if (filterStatus === 'pending') return week.approvalStatus === 'pending';
                if (filterStatus === 'partially_approved') return week.approvalStatus === 'partially_approved';
                if (filterStatus === 'approved') return week.approvalStatus === 'approved';
                return true;
              }).sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate));

              if (filteredWeeks.length === 0 && (searchQuery || filterStatus !== 'all')) return null;

              const pendingCount = Array.from(weeks.values()).filter(w => w.approvalStatus === 'pending').length;
              const partialCount = Array.from(weeks.values()).filter(w => w.approvalStatus === 'partially_approved').length;
              const totalNeedingAction = pendingCount + partialCount;

              let summaryChip = <Chip label="Todo Aprobado" color="success" size="small" />;
              if (totalNeedingAction > 0) {
                  const label = [
                      pendingCount > 0 ? `${pendingCount} Pend.` : '',
                      partialCount > 0 ? `${partialCount} Parc.` : ''
                  ].filter(Boolean).join(', ');
                  summaryChip = <Chip label={label} color="warning" size="small" />;
              }

              return (
                <Accordion key={hotelId} defaultExpanded={totalNeedingAction > 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <Typography variant="h6">{hotelName}</Typography>
                      {summaryChip}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {filteredWeeks.length > 0 ? filteredWeeks.map(week => {
                      return (
                        <Paper key={week.weekStartDate} variant="outlined" sx={{ p: 2, cursor: 'pointer' }} onClick={() => handleWeekClick(hotelId, week)}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography>Semana del {new Date(week.weekStartDate).toLocaleDateString()}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {`${week.employeeCount} Empleados, ${week.totalHours.toFixed(2)} Horas | Total: ${week.totalPay.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`}
                              </Typography>
                            </Box>
                            <Chip 
                              label={
                                week.approvalStatus === 'approved' ? 'Aprobado' :
                                week.approvalStatus === 'partially_approved' ? 'Parcial Aprobado' : 'Pendiente'
                              } 
                              color={
                                week.approvalStatus === 'approved' ? 'success' :
                                week.approvalStatus === 'partially_approved' ? 'warning' : 'default'
                              } 
                            />
                          </Box>
                        </Paper>
                      );
                    }) : <Typography>No hay semanas que coincidan con el filtro.</Typography>}
                  </AccordionDetails>
                </Accordion>
              );
          })}
        </>
      )}

      {currentView === 'employee_adjustments' && (
        <>
          <Button onClick={() => setCurrentView('dashboard')} sx={{ mb: 2 }} startIcon={<ExpandMoreIcon sx={{ transform: 'rotate(90deg)' }} />}>
            Volver al Menú
          </Button>
          <EmployeeAdjustmentsView />
        </>
      )}
    </Container>
  );
};

export default NominaDashboard;
