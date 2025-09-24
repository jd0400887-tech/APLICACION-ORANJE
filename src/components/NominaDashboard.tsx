
import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Box, CircularProgress, Accordion, AccordionSummary, AccordionDetails, Button, Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getAttendance, Attendance } from '../data/attendance';
import { getEmployees, Hotel, Employee } from '../data/database';
import { getAllWeeklyApprovals } from '../data/approvals';
import { getWeekStartDate } from '../utils/payroll';
import InvoiceView from './InvoiceView';
import WeeklyReportDetail from './WeeklyReportDetail';

interface ProcessedWeek {
  weekStartDate: string;
  employeeApprovals: Map<number, 'pending' | 'approved'>; // Map<employeeId, status>
  records: Attendance[];
}

interface NominaDashboardProps {
  currentUser: any; // Assuming currentUser has a 'role' property
  hotels: Hotel[]; // New prop
}

type ProcessedData = Map<number, { hotelName: string; weeks: Map<string, ProcessedWeek> }>;

const NominaDashboard: React.FC<NominaDashboardProps> = ({ currentUser, hotels }) => {
  const [loading, setLoading] = useState(true);
  const [processedData, setProcessedData] = useState<ProcessedData>(new Map());
  const [viewingInvoiceFor, setViewingInvoiceFor] = useState<{ hotel: Hotel, week: ProcessedWeek } | null>(null);
  const [viewingWeekDetailFor, setViewingWeekDetailFor] = useState<{ hotel: Hotel, week: ProcessedWeek } | null>(null);
  // const [allHotels, setAllHotels] = useState<Hotel[]>([]); // No longer needed as a state, use prop directly
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);

  const fetchAndProcessData = async () => {
    setLoading(true);
    const [approvals, records, employees] = await Promise.all([
      getAllWeeklyApprovals(),
      getAttendance(),
      getEmployees()
    ]);

    // setAllHotels(hotels); // No longer needed
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
    setLoading(false);
  };

  useEffect(() => {
    if (hotels.length > 0) { // Only fetch and process data if hotels prop is available
      fetchAndProcessData();
    }
  }, [hotels]); // Depend on hotels prop

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

  if (loading) {
    return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Container>;
  }

  if (viewingInvoiceFor) {
    return <InvoiceView hotel={viewingInvoiceFor.hotel} records={viewingInvoiceFor.week.records} employees={allEmployees} onBack={() => setViewingInvoiceFor(null)} />;
  }

  if (viewingWeekDetailFor) {
    return <WeeklyReportDetail hotel={viewingWeekDetailFor.hotel} week={viewingWeekDetailFor.week} employees={allEmployees} onBack={() => setViewingWeekDetailFor(null)} onGenerateInvoice={handleGenerateInvoice} onRefreshDashboard={fetchAndProcessData} currentUser={currentUser} />;
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Nómina Global</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Supervisa las aprobaciones de nómina de todos los hoteles. Haz clic en una semana para ver el detalle.
      </Typography>

      {Array.from(processedData.entries()).map(([hotelId, { hotelName, weeks }]) => {
        const totalPendingWeeks = Array.from(weeks.values()).filter(week => 
          Array.from(week.employeeApprovals.values()).some(status => status === 'pending')
        ).length;
        if (weeks.size === 0) return null;

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
              {Array.from(weeks.values()).sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate)).map(week => {
                const isWeekFullyApproved = Array.from(week.employeeApprovals.values()).every(status => status === 'approved');
                return (
                  <Paper key={week.weekStartDate} variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleWeekClick(hotelId, week)}>
                    <Typography>Semana del {new Date(week.weekStartDate).toLocaleDateString()}</Typography>
                    <Chip label={isWeekFullyApproved ? 'Aprobado' : 'Pendiente'} color={isWeekFullyApproved ? 'success' : 'default'} />
                  </Paper>
                );
              })}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Container>
  );
};

export default NominaDashboard;
