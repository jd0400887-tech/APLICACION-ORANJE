import React, { useMemo } from 'react';
import {
  Container, Typography, Paper, Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Link
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { Hotel, Employee } from '../data/database';
import { Attendance } from '../data/attendance';
import { PayrollSettings } from './PayrollSettingsDialog';

interface ProcessedWeek {
  weekStartDate: string;
  employeeApprovals: Map<number, 'pending' | 'approved'>;
  records: Attendance[];
}

interface WeeklyReportDetailProps {
  hotel: Hotel;
  week: ProcessedWeek;
  employees: Employee[];
  onBack: () => void;
  onGenerateInvoice: () => void;
  onRefreshDashboard: () => void;
  onViewEmployeeHistory: (employeeId: number) => void; // New prop
}

const WeeklyReportDetail: React.FC<WeeklyReportDetailProps> = ({ hotel, week, employees, onBack, onGenerateInvoice, onRefreshDashboard, onViewEmployeeHistory }) => {

  const reportData = useMemo(() => {
    const employeeHoursMap: Map<string, { totalHours: number, employee: Employee | undefined }> = new Map();

    week.records.forEach(record => {
      if (record.workHours) {
        const employee = employees.find(e => e.id === record.employeeId.toString());
        const entry = employeeHoursMap.get(record.employeeName) || { totalHours: 0, employee };
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
        employeeId: employee?.id,
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

  return (
    <Container>
      <Button onClick={onBack} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Volver
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
                const employeeApprovalStatus = row.employeeId ? week.employeeApprovals.get(parseInt(row.employeeId, 10)) : 'pending';
                const isEmployeeApproved = employeeApprovalStatus === 'approved';
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <Link component="button" variant="body2" onClick={() => row.employeeId && onViewEmployeeHistory(parseInt(row.employeeId, 10))}>
                        {row.employeeName}
                      </Link>
                    </TableCell>
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