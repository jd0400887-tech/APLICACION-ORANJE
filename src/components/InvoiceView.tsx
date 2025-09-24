import React, { useMemo } from 'react';
import {
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Box, Button
} from '@mui/material';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
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

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    let yPos = 10;

    doc.setFontSize(18);
    doc.text(`Factura para ${hotel.name}`, 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.text(`Dirección: ${hotel.address || 'N/A'}, ${hotel.city || 'N/A'}`, 20, yPos);
    yPos += 5;
    doc.text(`Contacto: ${hotel.contact || 'N/A'}`, 20, yPos);
    yPos += 5;
    doc.text(`Email: ${hotel.email || 'N/A'}`, 20, yPos);
    yPos += 5;
    doc.text(`Gerente General: ${hotel.generalManager || 'N/A'}`, 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.text(`Semana del: ${new Date(records[0]?.date).toLocaleDateString() || 'N/A'}`, 20, yPos);
    yPos += 10;

    const tableColumn = ["Empleado", "Posición", "H. Reg.", "H. OT.", "H. Tot.", "Pago Total", "Cargo Total"];
    const tableRows: any[] = [];

    invoiceData.invoiceDetails.forEach(item => {
      const rowData = [
        item.employeeName,
        item.position,
        item.regularHours,
        item.overtimeHours,
        item.totalHours,
        `$${item.totalEmployeePay}`,
        `$${item.totalChargeToHotel}`,
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: yPos,
      headStyles: { fillColor: [255, 165, 0] }, // Orange color for header
      theme: 'grid',
    });

    let finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.text(`Total Pago Empleados: $${invoiceData.grandTotalEmployeePay}`, 14, finalY + 10);
    doc.text(`Total Cargo a Hotel: $${invoiceData.totalCompanyCharge}`, 14, finalY + 16);
    doc.save(`factura-${hotel.name}-${new Date(records[0]?.date).toLocaleDateString()}.pdf`);
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