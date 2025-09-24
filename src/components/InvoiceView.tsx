import React, { useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import {
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Box, Button
} from '@mui/material';
import jsPDF from 'jspdf';
import * as jspdfAutotable from 'jspdf-autotable';
import { Hotel, Employee } from '../data/database';
import { Attendance } from '../data/attendance';
import { PayrollSettings } from './PayrollSettingsDialog';

interface InvoiceViewProps {
  hotel: Hotel;
  records: Attendance[];
  employees: Employee[];
  onBack: () => void;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ hotel, records, employees, onBack }) => {

  const invoiceData = useMemo(() => {
    const employeeHoursMap: Map<string, { totalHours: number, employee: Employee | undefined }> = new Map();

    records.forEach(record => {
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
      ...(hotel.payroll_settings as PayrollSettings || {}) 
    };

    let totalCompanyCharge = 0;
    let grandTotalEmployeePay = 0;

    const invoiceDetails = Array.from(employeeHoursMap.entries()).map(([employeeName, { totalHours, employee }]) => {
      const position = employee?.position || '';
      const payRate = hotel.hourly_rates_by_position?.[position] || 0;
      const billRate = hotel.billing_rates_by_position?.[position] || 0;

      let regularHours = totalHours;
      let overtimeHours = 0;

      if (payrollSettings.overtime_enabled && totalHours > 40) {
        regularHours = 40;
        overtimeHours = totalHours - 40;
      }

      const totalEmployeePay = (regularHours * payRate) + (overtimeHours * payRate * payrollSettings.overtime_multiplier);
      const totalChargeToHotel = (regularHours * billRate) + (overtimeHours * billRate * payrollSettings.overtime_multiplier);
      
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
      };
    });

    return { invoiceDetails, grandTotalEmployeePay: grandTotalEmployeePay.toFixed(2), totalCompanyCharge: totalCompanyCharge.toFixed(2) };
  }, [records, employees, hotel]);

  const invoiceRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = () => {
    if (invoiceRef.current) {
      html2canvas(invoiceRef.current, {
        scale: 2, // Increase scale for better quality
        useCORS: true, // Enable CORS if images are from external sources
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        pdf.save(`factura-${hotel.name}-${new Date(records[0]?.date).toLocaleDateString()}.pdf`);
      });
    }
  };

  return (
    <Container>
      <Button onClick={onBack} sx={{ mb: 2 }}>Volver al Dashboard de Nómina</Button>
      <Paper elevation={3} sx={{ p: 2 }} ref={invoiceRef}>
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
                  <TableCell>{item.totalHours}</TableCell>
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
          <Button variant="contained" onClick={handleDownloadPdf}>Descargar PDF</Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default InvoiceView;