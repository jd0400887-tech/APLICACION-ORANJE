import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Box, TextField, TableSortLabel, Card, CardContent,
} from '@mui/material';
import { getAttendance, Attendance } from '../data/attendance';

const NominaDashboard: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orderBy, setOrderBy] = useState<keyof Attendance>('date');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchRecords = async () => {
      const records = await getAttendance();
      setAttendanceRecords(records);
    };
    fetchRecords();
  }, []);

  const formatDuration = (checkIn: string | null, checkOut: string | null, date: string) => {
    if (!checkIn || !checkOut) return 'N/A';
    const checkInTime = new Date(`${date}T${checkIn}`).getTime();
    const checkOutTime = new Date(`${date}T${checkOut}`).getTime();
    const milliseconds = checkOutTime - checkInTime;
    if (milliseconds < 0) return 'N/A';
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const filteredAndSortedRecords = useMemo(() => {
    let currentRecords = attendanceRecords;

    // Filter by search term (employee name)
    if (searchTerm) {
      currentRecords = currentRecords.filter(rec =>
        rec.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date range
    if (startDate) {
      currentRecords = currentRecords.filter(rec => rec.date >= startDate);
    }
    if (endDate) {
      currentRecords = currentRecords.filter(rec => rec.date <= endDate);
    }

    // Sort
    return currentRecords.sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];

      if (aValue === null || aValue === undefined) return order === 'asc' ? -1 : 1;
      if (bValue === null || bValue === undefined) return order === 'asc' ? 1 : -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        return 0;
      }
    });
  }, [attendanceRecords, searchTerm, startDate, endDate, orderBy, order]);

  const handleRequestSort = (property: keyof Attendance) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const totalHoursFiltered = filteredAndSortedRecords.reduce((acc, rec) => {
    if (rec.workHours) {
      return acc + rec.workHours;
    }
    return acc;
  }, 0);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Nómina
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Buscar por Empleado"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <TextField
          label="Fecha Inicio"
          type="date"
          variant="outlined"
          size="small"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Fecha Fin"
          type="date"
          variant="outlined"
          size="small"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Resumen de Horas
          </Typography>
          <Typography variant="h4" component="div">
            {totalHoursFiltered.toFixed(2)} horas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total de horas trabajadas en el periodo filtrado.
          </Typography>
        </CardContent>
      </Card>

      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Historial de Asistencia
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'employeeName'}
                    direction={orderBy === 'employeeName' ? order : 'asc'}
                    onClick={() => handleRequestSort('employeeName')}
                  >
                    Empleado
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'hotelName'}
                    direction={orderBy === 'hotelName' ? order : 'asc'}
                    onClick={() => handleRequestSort('hotelName')}
                  >
                    Hotel
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'position'}
                    direction={orderBy === 'position' ? order : 'asc'}
                    onClick={() => handleRequestSort('position')}
                  >
                    Posición
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'date'}
                    direction={orderBy === 'date' ? order : 'asc'}
                    onClick={() => handleRequestSort('date')}
                  >
                    Fecha
                  </TableSortLabel>
                </TableCell>
                <TableCell>Entrada</TableCell>
                <TableCell>Salida</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'workHours'}
                    direction={orderBy === 'workHours' ? order : 'asc'}
                    onClick={() => handleRequestSort('workHours')}
                  >
                    Duración
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedRecords.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell>{rec.employeeName}</TableCell>
                  <TableCell>{rec.hotelName}</TableCell>
                  <TableCell>{rec.position}</TableCell>
                  <TableCell>{new Date(rec.date).toLocaleDateString()}</TableCell>
                  <TableCell>{rec.checkIn}</TableCell>
                  <TableCell>{rec.checkOut || 'En curso'}</TableCell>
                  <TableCell>{formatDuration(rec.checkIn, rec.checkOut, rec.date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default NominaDashboard;