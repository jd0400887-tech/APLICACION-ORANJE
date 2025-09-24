
import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Box, CircularProgress, Accordion, AccordionSummary, AccordionDetails, Button, Chip, TextField, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getAttendance, Attendance } from '../data/attendance';
import { getEmployees, Hotel, Employee } from '../data/database';
import { getAllWeeklyApprovals } from '../data/approvals';
import { getWeekStartDate } from '../utils/payroll';
import InvoiceView from './InvoiceView';
import WeeklyReportDetail from './WeeklyReportDetail';
import EmployeePayrollHistory from './EmployeePayrollHistory';
import * as XLSX from 'xlsx';

interface ProcessedWeek {
  weekStartDate: string;
  employeeApprovals: Map<number, 'pending' | 'approved'>;
  records: Attendance[];
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchAndProcessData = async () => {
    setLoading(true);
    try {
      const [approvals, records, employees] = await Promise.all([
        getAllWeeklyApprovals(),
        getAttendance(),
        getEmployees()
      ]);

      setAllEmployees(employees);

      const newProcessedData: ProcessedData = new Map();
      hotels.forEach(h => newProcessedData.set(h.id, { hotelName: h.name, weeks: new Map() }));

      records.forEach(record => {
        const hotel = hotels.find(h => h.name === record.hotelName);
        if (!hotel) return;
        const payrollSettings = { week_cutoff_day: 'saturday', ...(hotel.payroll_settings as any || {}) };
        const weekStartDate = getWeekStartDate(payrollSettings.week_cutoff_day, new Date(record.date)).toISOString().split('T')[0];
        let hotelData = newProcessedData.get(hotel.id);
        if (!hotelData) return;
        let weekData = hotelData.weeks.get(weekStartDate);
        if (!weekData) {
          weekData = { weekStartDate, employeeApprovals: new Map(), records: [] };
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

      setProcessedData(newProcessedData);
    } catch (error) {
      console.error("Failed to fetch or process payroll data:", error);
      // Here you could set an error state to show a message to the user
    }
    setLoading(false);
  };

  useEffect(() => {
    if (hotels.length > 0) {
      fetchAndProcessData();
    }
  }, [hotels]);

  const handleExport = () => {
    const exportData: any[] = [];
    Array.from(processedData.entries())
      .filter(([_, { hotelName }]) => hotelName.toLowerCase().includes(searchQuery.toLowerCase()))
      .forEach(([_, { hotelName, weeks }]) => {
        const filteredWeeks = Array.from(weeks.values()).filter(week => {
          if (filterStatus === 'all') return true;
          const isWeekFullyApproved = Array.from(week.employeeApprovals.values()).every(status => status === 'approved');
          return filterStatus === 'pending' ? !isWeekFullyApproved : isWeekFullyApproved;
        });

        filteredWeeks.forEach(week => {
          const isWeekFullyApproved = Array.from(week.employeeApprovals.values()).every(status => status === 'approved');
          week.records.forEach(record => {
            exportData.push({
              'Hotel': hotelName,
              'Empleado': record.employeeName,
              'Cargo': record.position,
              'Fecha': record.date,
              'Entrada': record.checkIn,
              'Salida': record.checkOut,
              'Horas Trabajadas': record.workHours?.toFixed(2),
              'Estado Aprobación Semanal': isWeekFullyApproved ? 'Aprobado' : 'Pendiente',
            });
          });
        });
      });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Nómina");
    XLSX.writeFile(workbook, "nomina_export.xlsx");
  };

  const handleWeekClick = (hotelId: number, week: ProcessedWeek) => {
    const hotel = hotels.find(h => h.id === hotelId);
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
    return <InvoiceView hotel={viewingInvoiceFor.hotel} records={viewingInvoiceFor.week.records} employees={allEmployees} onBack={handleBackToDashboard} />;
  }

  if (viewingWeekDetailFor) {
    return <WeeklyReportDetail 
      hotel={viewingWeekDetailFor.hotel} 
      week={viewingWeekDetailFor.week} 
      employees={allEmployees} 
      onBack={handleBackToDashboard} 
      onGenerateInvoice={handleGenerateInvoice} 
      onRefreshDashboard={fetchAndProcessData} 
      onViewEmployeeHistory={handleViewEmployeeHistory}
    />;
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Nómina Global</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Supervisa las aprobaciones de nómina de todos los hoteles. Haz clic en una semana para ver el detalle.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          label="Buscar Hotel"
          variant="outlined"
          size="small"
          fullWidth
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
          <ToggleButton value="approved" aria-label="approved">Aprobados</ToggleButton>
        </ToggleButtonGroup>
        <Button variant="contained" onClick={handleExport}>Exportar</Button>
      </Box>

      {Array.from(processedData.entries())
        .filter(([_, { hotelName }]) => hotelName.toLowerCase().includes(searchQuery.toLowerCase()))
        .map(([hotelId, { hotelName, weeks }]) => {
          
          const filteredWeeks = Array.from(weeks.values()).filter(week => {
            if (filterStatus === 'all') return true;
            const hasPending = Array.from(week.employeeApprovals.values()).some(status => status === 'pending');
            if (filterStatus === 'pending') return hasPending;
            if (filterStatus === 'approved') return !hasPending;
            return true;
          }).sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate));

          if (filteredWeeks.length === 0 && searchQuery) return null;

          const totalPendingWeeks = Array.from(weeks.values()).filter(week => 
            Array.from(week.employeeApprovals.values()).some(status => status === 'pending')
          ).length;

          return (
            <Accordion key={hotelId} defaultExpanded={totalPendingWeeks > 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <Typography variant="h6">{hotelName}</Typography>
                  {totalPendingWeeks > 0 ? (
                    <Chip label={`${totalPendingWeeks} semana(s) pendiente(s)`} color="warning" size="small" />
                  ) : (
                    <Chip label="Todo aprobado" color="success" size="small" />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredWeeks.length > 0 ? filteredWeeks.map(week => {
                  const isWeekFullyApproved = Array.from(week.employeeApprovals.values()).every(status => status === 'approved');
                  return (
                    <Paper key={week.weekStartDate} variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleWeekClick(hotelId, week)}>
                      <Typography>Semana del {new Date(week.weekStartDate).toLocaleDateString()}</Typography>
                      <Chip label={isWeekFullyApproved ? 'Aprobado' : 'Pendiente'} color={isWeekFullyApproved ? 'success' : 'default'} />
                    </Paper>
                  );
                }) : <Typography>No hay semanas que coincidan con el filtro.</Typography>}
              </AccordionDetails>
            </Accordion>
          );
      })}
    </Container>
  );
};

export default NominaDashboard;
