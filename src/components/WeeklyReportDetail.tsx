import React, { useMemo, useState } from 'react';
import {
  Container, Typography, Paper, Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Link, Collapse, IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Hotel, Employee, Adjustment } from '../data/database';
import { Attendance } from '../data/attendance';
import { PayrollSettings } from './PayrollSettingsDialog';
import { generatePayStubPDF } from '../utils/generatePayStubPDF';

interface ProcessedWeek {
  weekStartDate: string;
  employeeApprovals: Map<number, 'pending' | 'approved'>;
  records: Attendance[];
}

interface WeeklyReportDetailProps {
  hotel: Hotel;
  week: ProcessedWeek;
  employees: Employee[];
  allAdjustments: Adjustment[];
  onBack: () => void;
  onGenerateInvoice: () => void;
  onRefreshDashboard: () => void;
  onViewEmployeeHistory: (employeeId: number) => void;
}

const WeeklyReportDetail: React.FC<WeeklyReportDetailProps> = ({ hotel, week, employees, allAdjustments, onBack, onGenerateInvoice, onRefreshDashboard, onViewEmployeeHistory }) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);


  const reportData = useMemo(() => {
    const employeeDataMap: Map<number, {
      employee: Employee;
      totalHours: number;
      basePay: number;
      adjustments: Adjustment[];
      totalPay: number;
      regularHours: number;
      overtimeHours: number;
    }> = new Map();

    const payrollSettings: PayrollSettings = {
      week_cutoff_day: 'saturday',
      overtime_enabled: false,
      overtime_multiplier: 1.5,
      ...(hotel.payroll_settings as any || {})
    };
    const rates = (hotel.payroll_settings as any)?.rates || {};

    // Initialize map with all employees in the week
    week.employeeApprovals.forEach((_, employeeId) => {
        const employee = employees.find(e => e.id === employeeId.toString());
        if (employee) {
            employeeDataMap.set(employeeId, {
                employee,
                totalHours: 0,
                basePay: 0,
                adjustments: [],
                totalPay: 0,
                regularHours: 0,
                overtimeHours: 0,
            });
        }
    });

    // Calculate hours
    week.records.forEach(record => {
      const entry = employeeDataMap.get(record.employeeId);
      if (entry && record.workHours) {
        entry.totalHours += record.workHours;
      }
    });

    // Find adjustments for the week
    const weekStart = new Date(week.weekStartDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    allAdjustments.forEach(adj => {
        const entry = employeeDataMap.get(adj.employee_id);
        if (entry) {
            const adjDate = new Date(adj.date);
            if (adjDate >= weekStart && adjDate <= weekEnd) {
                entry.adjustments.push(adj);
            }
        }
    });

    // Calculate pay
    employeeDataMap.forEach(data => {
        let regularHours = data.totalHours;
        let overtimeHours = 0;

        if (payrollSettings.overtime_enabled && data.totalHours > 40) {
            regularHours = 40;
            overtimeHours = data.totalHours - 40;
        }
        data.regularHours = regularHours;
        data.overtimeHours = overtimeHours;

        const rateForPosition = rates[data.employee.position] || 0;
        const regularPay = regularHours * rateForPosition;
        const overtimePay = overtimeHours * rateForPosition * (payrollSettings.overtime_multiplier || 1.5);
        data.basePay = regularPay + overtimePay;

        const adjustmentsTotal = data.adjustments.reduce((acc, adj) => {
            return adj.type === 'addition' ? acc + adj.amount : acc - adj.amount;
        }, 0);

        data.totalPay = data.basePay + adjustmentsTotal;
    });

    return Array.from(employeeDataMap.values());
  }, [week, employees, hotel, allAdjustments]);

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
          <Table aria-label="collapsible table">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Empleado</TableCell>
                <TableCell>Posición</TableCell>
                <TableCell align="right">H. Totales</TableCell>
                <TableCell align="right">Pago Total</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.map((row) => {
                const isExpanded = expandedRowId === row.employee.id;
                const employeeApprovalStatus = week.employeeApprovals.get(parseInt(row.employee.id, 10)) || 'pending';
                const isEmployeeApproved = employeeApprovalStatus === 'approved';
                return (
                  <React.Fragment key={row.employee.id}>
                    <TableRow sx={{ '& > *': { borderBottom: 'unset' }, cursor: 'pointer' }} onClick={() => setExpandedRowId(isExpanded ? null : row.employee.id)}>
                      <TableCell>
                        <IconButton aria-label="expand row" size="small">
                          {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell component="th" scope="row">
                        <Link component="button" variant="body2" onClick={(e) => { e.stopPropagation(); onViewEmployeeHistory(parseInt(row.employee.id, 10)); }}>
                          {row.employee.name}
                        </Link>
                      </TableCell>
                      <TableCell>{row.employee.position}</TableCell>
                      <TableCell align="right">{row.totalHours.toFixed(2)}</TableCell>
                      <TableCell align="right">{row.totalPay.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                      <TableCell>
                        <Chip 
                          icon={isEmployeeApproved ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
                          label={isEmployeeApproved ? 'Aprobado' : 'Pendiente'}
                          color={isEmployeeApproved ? 'success' : 'warning'}
                          size="small"
                        />
                    </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
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
                                generatePayStubPDF(row, hotel, week.weekStartDate);
                              }}
                            >
                              Descargar PDF
                            </Button>
                          </Box>
                            <Table size="small" aria-label="purchases">
                              <TableBody>
                                <TableRow>
                                  <TableCell>Pago Base (Horas)</TableCell>
                                  <TableCell align="right">{row.basePay.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                  <TableCell>({row.regularHours.toFixed(2)}h Reg. + {row.overtimeHours.toFixed(2)}h OT)</TableCell>
                                </TableRow>
                                {row.adjustments.length > 0 && (
                                  <TableRow>
                                    <TableCell colSpan={3} style={{ fontWeight: 'bold', borderBottom: 'none', paddingTop: '16px' }}>Ajustes</TableCell>
                                  </TableRow>
                                )}
                                {row.adjustments.map((adj) => (
                                  <TableRow key={adj.id}>
                                    <TableCell style={{ paddingLeft: '32px' }}>{adj.description}</TableCell>
                                    <TableCell align="right" style={{ color: adj.type === 'addition' ? 'green' : 'red' }}>
                                      {`${adj.type === 'addition' ? '+' : '-'}${adj.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`}
                                    </TableCell>
                                    <TableCell>{adj.date}</TableCell>
                                  </TableRow>
                                ))}
                                <TableRow>
                                  <TableCell style={{ fontWeight: 'bold', borderTop: '2px solid black' }}>Pago Total Final</TableCell>
                                  <TableCell align="right" style={{ fontWeight: 'bold', borderTop: '2px solid black' }}>{row.totalPay.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
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
      </Paper>
    </Container>
  );
};

export default WeeklyReportDetail;