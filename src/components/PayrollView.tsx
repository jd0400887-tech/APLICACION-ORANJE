import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';

// Mock data for the payroll/time tracking list
const mockTimeRecords = [
  { id: 1, name: 'John Doe', date: '2025-08-28', checkIn: '09:02 AM', checkOut: '05:05 PM' },
  { id: 2, name: 'Jane Smith', date: '2025-08-28', checkIn: '08:58 AM', checkOut: '05:01 PM' },
  { id: 3, name: 'Peter Jones', date: '2025-08-28', checkIn: '09:15 AM', checkOut: '04:55 PM' },
];

function PayrollView({ onBack }) {
  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{ mb: 2 }}
      >
        Volver al Dashboard del Hotel
      </Button>
      <Typography variant="h5" gutterBottom>
        Registros de Horarios
      </Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Empleado</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Hora de Entrada</TableCell>
              <TableCell>Hora de Salida</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockTimeRecords.map((record) => (
              <TableRow
                key={record.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {record.name}
                </TableCell>
                <TableCell>{record.date}</TableCell>
                <TableCell>{record.checkIn}</TableCell>
                <TableCell>{record.checkOut}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default PayrollView;
