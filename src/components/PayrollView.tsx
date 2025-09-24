
import React, { useState, useEffect, useMemo } from 'react';
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
  TableRow,
  IconButton,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import { Hotel, Employee, updateHotel } from '../data/database';
import { getAttendanceForHotel, Attendance } from '../data/attendance';
import PayrollSettingsDialog from './PayrollSettingsDialog';
import EmployeePayrollDetail from './EmployeePayrollDetail';

interface PayrollViewProps {
  hotel: Hotel;
  employees: Employee[];
  onBack: () => void;
  onHotelUpdated: (updatedHotel: Hotel) => void;
  currentUser: any; // New prop
}

function PayrollView({ hotel, employees, onBack, onHotelUpdated, currentUser }: PayrollViewProps) {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const fetchAttendanceForHotel = async () => {
    setLoading(true);
    const attendanceRecords = await getAttendanceForHotel(hotel.id);
    setRecords(attendanceRecords);
    setLoading(false);
  };

  useEffect(() => {
    fetchAttendanceForHotel();
  }, [hotel.id]);

  const employeeHours = useMemo(() => {
    const hoursMap = new Map<string, number>();
    records.forEach(record => {
      if (record.workHours) {
        const currentHours = hoursMap.get(record.employeeName) || 0;
        hoursMap.set(record.employeeName, currentHours + record.workHours);
      }
    });
    return hoursMap;
  }, [records]);

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
  };

  const handleBackToList = () => {
    setSelectedEmployee(null);
  };

  const handleSaveSettings = async (updatedHotel: Hotel) => {
    const savedHotel = await updateHotel(updatedHotel);
    if (savedHotel) {
      onHotelUpdated(savedHotel);
    }
    setIsSettingsOpen(false);
  };

  const recordsForSelectedEmployee = useMemo(() => {
    if (!selectedEmployee) return [];
    return records.filter(r => r.employeeId === selectedEmployee.id);
  }, [records, selectedEmployee]);

  if (selectedEmployee) {
    return (
      <EmployeePayrollDetail 
        employee={selectedEmployee} 
        hotel={hotel} 
        allRecordsForEmployee={recordsForSelectedEmployee}
        onBack={handleBackToList} 
        onRefreshHotelPayroll={fetchAttendanceForHotel} 
        currentUser={currentUser} // Pass currentUser down
      />
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
        >
          Volver al Dashboard del Hotel
        </Button>
        <IconButton onClick={() => setIsSettingsOpen(true)}>
          <SettingsIcon />
        </IconButton>
      </Box>
      <Typography variant="h5" gutterBottom>
        Nómina y Horarios para {hotel.name}
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Empleado</TableCell>
                <TableCell>Cargo</TableCell>
                <TableCell align="right">Horas Totales (Periodo Actual)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => (
                <TableRow
                  key={employee.id}
                  hover
                  onClick={() => handleEmployeeClick(employee)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell component="th" scope="row">
                    {employee.name}
                  </TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell align="right">
                    {(employeeHours.get(employee.name) || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <PayrollSettingsDialog
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        hotel={hotel}
        onSave={handleSaveSettings}
      />
    </Box>
  );
}

export default PayrollView;
