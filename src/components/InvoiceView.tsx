import React, { useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import {
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Box, Button
} from '@mui/material';
import jsPDF from 'jspdf';
import * as jspdfAutotable from 'jspdf-autotable';
import { Hotel, Employee, Adjustment } from '../data/database';
import { Attendance } from '../data/attendance';
import { PayrollSettings } from './PayrollSettingsDialog';
import { generateInvoicePDF } from '../utils/generateInvoicePDF';

interface InvoiceViewProps {
  hotel: Hotel;
  records: Attendance[];
  employees: Employee[];
  allAdjustments: Adjustment[];
  onBack: () => void;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ hotel, records, employees, allAdjustments, onBack }) => {

  const invoiceData = useMemo(() => {
    const employeeMap: Map<string, { 
        totalHours: number, 
        employee: Employee | undefined,
        adjustments: Adjustment[]
    }> = new Map();

    // Initialize map with all employees from records
    records.forEach(record => {
        if (!employeeMap.has(record.employeeName)) {
            employeeMap.set(record.employeeName, {
                totalHours: 0,
                employee: employees.find(e => e.name === record.employeeName),
                adjustments: []
            });
        }
        if(record.workHours) {
            const entry = employeeMap.get(record.employeeName)!;
            entry.totalHours += record.workHours;
        }
    });

    // Find and assign adjustments for the week
    const weekStart = records.length > 0 ? new Date(records[0].date) : new Date();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    allAdjustments.forEach(adj => {
        const employee = employees.find(e => e.id === adj.employee_id.toString());
        if (employee && employeeMap.has(employee.name)) {
            const adjDate = new Date(adj.date);
            if (adjDate >= weekStart && adjDate <= weekEnd) {
                employeeMap.get(employee.name)!.adjustments.push(adj);
            }
        }
    });

    const payrollSettings: PayrollSettings = { 
      week_cutoff_day: 'saturday', 
      overtime_enabled: false, 
      overtime_multiplier: 1.5, 
      ...(hotel.payroll_settings as any || {}) 
    };

    let totalCompanyCharge = 0;
    let grandTotalEmployeePay = 0;

    const invoiceDetails = Array.from(employeeMap.entries()).map(([employeeName, { totalHours, employee, adjustments }]) => {
      const position = employee?.position || '';
      const payRate = (hotel as any).hourly_rates_by_position?.[position] || 0;
      const billRate = (hotel as any).billing_rates_by_position?.[position] || 0;

      let regularHours = totalHours;
      let overtimeHours = 0;

      if (payrollSettings.overtime_enabled && totalHours > 40) {
        regularHours = 40;
        overtimeHours = totalHours - 40;
      }

      const employeePayForHours = (regularHours * payRate) + (overtimeHours * payRate * payrollSettings.overtime_multiplier);
      const chargeToHotelForHours = (regularHours * billRate) + (overtimeHours * billRate * payrollSettings.overtime_multiplier);
      
      const employeeAdjustmentsTotal = adjustments.reduce((acc, adj) => adj.type === 'addition' ? acc + adj.amount : acc - adj.amount, 0);
      // Assumption: Adjustments are billed 1-to-1 to the hotel.
      const chargeToHotelForAdjustments = adjustments.reduce((acc, adj) => acc + adj.amount, 0);

      const totalEmployeePay = employeePayForHours + employeeAdjustmentsTotal;
      const totalChargeToHotel = chargeToHotelForHours + chargeToHotelForAdjustments;

      totalCompanyCharge += totalChargeToHotel;
      grandTotalEmployeePay += totalEmployeePay;

      return {
        employeeName,
        position,
        totalHours: totalHours.toFixed(2),
        regularHours: regularHours.toFixed(2),
        overtimeHours: overtimeHours.toFixed(2),
        totalEmployeePay: totalEmployeePay.toFixed(2),
        totalChargeToHotel: totalChargeToHotel.toFixed(2),
        adjustments, // Pass adjustments for potential UI display
      };
    });

    return { invoiceDetails, grandTotalEmployeePay: grandTotalEmployeePay.toFixed(2), totalCompanyCharge: totalCompanyCharge.toFixed(2) };
  }, [records, employees, hotel, allAdjustments]);

  const handleDownloadPdf = () => {
    const weekStartDate = records.length > 0 ? records[0].date : new Date().toISOString().split('T')[0];
    generateInvoicePDF(invoiceData, hotel, weekStartDate);
  };

  return (
    <Container>
      <Button onClick={onBack} sx={{ mb: 2 }}>Volver al Dashboard de Nómina</Button>
      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="h4" gutterBottom>Factura para {hotel.name}</Typography>
        <Typography variant="subtitle1" gutterBottom>Semana del {new Date(records[0]?.date).toLocaleDateString() || 'N/A'}</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Empleado</TableCell>
                <TableCell>Posición</TableCell>
                <TableCell>H. Reg.</TableCell>
                <TableCell>H. OT.</TableCell>
                <TableCell>H. Tot.</TableCell>
                <TableCell>Pago Total</TableCell>
                <TableCell>Cargo Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoiceData.invoiceDetails.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.employeeName}</TableCell>
                  <TableCell>{item.position}</TableCell>
                  <TableCell>{item.regularHours}</TableCell>
                  <TableCell>{item.overtimeHours}</TableCell>
                  <TableCell>${item.totalEmployeePay}</TableCell>
                  <TableCell>${item.totalChargeToHotel}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={5} align="right"><Typography variant="h6">Totales</Typography></TableCell>
                <TableCell><Typography variant="h6">${invoiceData.grandTotalEmployeePay}</Typography></TableCell>
                <TableCell><Typography variant="h6">${invoiceData.totalCompanyCharge}</Typography></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleDownloadPdf} id="download-pdf-button">Descargar PDF</Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default InvoiceView;