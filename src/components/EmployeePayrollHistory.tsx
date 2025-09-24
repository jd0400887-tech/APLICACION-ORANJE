
import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Box, CircularProgress, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, CardContent
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getAttendanceForEmployee } from '../data/attendance';
import { getEmployees, Employee, Attendance } from '../data/database';

interface EmployeePayrollHistoryProps {
  employeeId: number;
  onBack: () => void;
}

const EmployeePayrollHistory: React.FC<EmployeePayrollHistoryProps> = ({ employeeId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const allEmployees = await getEmployees();
      const currentEmployee = allEmployees.find(e => e.id === employeeId.toString());
      setEmployee(currentEmployee || null);

      const history = await getAttendanceForEmployee(employeeId);
      setAttendanceHistory(history);
      setLoading(false);
    };

    fetchData();
  }, [employeeId]);

  if (loading) {
    return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Container>;
  }

  if (!employee) {
    return (
      <Container>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2 }}>Volver</Button>
        <Typography variant="h5" color="error">Empleado no encontrado.</Typography>
      </Container>
    );
  }

  const totalHours = attendanceHistory.reduce((acc, record) => acc + (record.workHours || 0), 0);

  return (
    <Container>
      <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2 }}>Volver al Dashboard</Button>
      <Typography variant="h4" gutterBottom>Historial de Nómina</Typography>
      
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5">{employee.name}</Typography>
          <Typography color="text.secondary">{employee.position}</Typography>
          <Typography color="text.secondary">{employee.email}</Typography>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">Estadísticas Totales</Typography>
          <Typography><strong>Horas Trabajadas Totales:</strong> {totalHours.toFixed(2)}</Typography>
          <Typography><strong>Días Trabajados Totales:</strong> {attendanceHistory.length}</Typography>
        </CardContent>
      </Card>

      <Typography variant="h5" gutterBottom>Registros de Asistencia</Typography>
      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Hotel</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Entrada</TableCell>
              <TableCell>Salida</TableCell>
              <TableCell align="right">Horas Trabajadas</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attendanceHistory.map(record => (
              <TableRow key={record.id}>
                <TableCell>{record.hotelName}</TableCell>
                <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                <TableCell>{record.checkIn}</TableCell>
                <TableCell>{record.checkOut || 'N/A'}</TableCell>
                <TableCell align="right">{record.workHours?.toFixed(2) || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default EmployeePayrollHistory;
