
import React, { useMemo, useState } from 'react';
import {
  Container, Typography, Paper, Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { Hotel, Employee } from '../data/database';
import { Attendance } from '../data/attendance';
import { PayrollSettings } from './PayrollSettingsDialog';
import { approveWeek } from '../data/approvals';

interface ProcessedWeek {
  weekStartDate: string;
  employeeApprovals: Map<number, 'pending' | 'approved'>; // Map<employeeId, status>
  records: Attendance[];
}

interface WeeklyReportDetailProps {
  hotel: Hotel;
  week: ProcessedWeek;
  employees: Employee[];
  onBack: () => void;
  onGenerateInvoice: () => void;
  onRefreshDashboard: () => void; // New prop
  // currentUser: any; // Removed currentUser prop
}

const WeeklyReportDetail: React.FC<WeeklyReportDetailProps> = ({ hotel, week, employees, onBack, onGenerateInvoice, onRefreshDashboard }) => {
  // const [isApprovingAll, setIsApprovingAll] = useState(false); // Removed state

  const reportData = useMemo(() => {
    const employeeHoursMap: Map<string, { totalHours: number, employee: Employee | undefined }> = new Map();

    week.records.forEach(record => {
      if (record.workHours) {
        const entry = employeeHoursMap.get(record.employeeName) || { totalHours: 0, employee: employees.find(e => e.name === record.employeeName) };
        entry.totalHours += record.workHours;
        employeeHoursMap.set(record.employeeName, entry);
      }
    });

    const payrollSettings: PayrollSettings = { 
      week_cutoff_day: 'saturday', 
      overtime_enabled: false, 
      overtime_multiplier: 1.5, 
      ...(hotel.payroll_settings as any || {}) 
    };

    return Array.from(employeeHoursMap.entries()).map(([employeeName, { totalHours, employee }]) => {
      let regularHours = totalHours;
      let overtimeHours = 0;

      if (payrollSettings.overtime_enabled && totalHours > 40) {
        regularHours = 40;
        overtimeHours = totalHours - 40;
      }

      return {
        employeeName,
        employeeId: employee?.id, // Include employeeId for approval status lookup
        position: employee?.position || 'N/A',
        totalHours: totalHours.toFixed(2),
        regularHours: regularHours.toFixed(2),
        overtimeHours: overtimeHours.toFixed(2),
      };
    });
  }, [week, employees, hotel]);

  const isWeekFullyApproved = useMemo(() => {
    return Array.from(week.employeeApprovals.values()).every(status => status === 'approved');
  }, [week.employeeApprovals]);

  // Removed handleApproveAll function

  // Removed canApproveAll memoized value

  return (
    <Container>
      <Button onClick={onBack} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Volver a la Lista de Hoteles
      </Button>
      <Paper elevation={3} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
                <Typography variant="h5" gutterBottom>Reporte Semanal: {hotel.name}</Typography>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Semana del {new Date(week.weekStartDate).toLocaleDateString()}</Typography>
                <Chip 
                    icon={isWeekFullyApproved ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
                    label={isWeekFullyApproved ? 'Aprobado' : 'Pendiente'}
                    color={isWeekFullyApproved ? 'success' : 'warning'}
                />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
                {/* Removed Approve All Button */}
                <Button 
                    variant="contained"
                    disabled={!isWeekFullyApproved}
                    onClick={onGenerateInvoice}
                >
                    Generar Factura
                </Button>
            </Box>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Empleado</TableCell>
                <TableCell>Posición</TableCell>
                <TableCell align="right">H. Reg.</TableCell>
                <TableCell align="right">H. OT.</TableCell>
                <TableCell align="right">H. Totales</TableCell>
                <TableCell>Estado Aprobación</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.map((row, index) => {
                const employeeApprovalStatus = row.employeeId ? week.employeeApprovals.get(row.employeeId) : 'pending';
                const isEmployeeApproved = employeeApprovalStatus === 'approved';
                return (
                  <TableRow key={index}>
                    <TableCell>{row.employeeName}</TableCell>
                    <TableCell>{row.position}</TableCell>
                    <TableCell align="right">{row.regularHours}</TableCell>
                    <TableCell align="right">{row.overtimeHours}</TableCell>
                    <TableCell align="right">{row.totalHours}</TableCell>
                    <TableCell>
                      <Chip 
                        icon={isEmployeeApproved ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
                        label={isEmployeeApproved ? 'Aprobado' : 'Pendiente'}
                        color={isEmployeeApproved ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default WeeklyReportDetail;
