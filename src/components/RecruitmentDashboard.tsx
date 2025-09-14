import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  TableSortLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Radio,
  useTheme
} from '@mui/material';
import { PersonnelRequest, Employee, getEmployees, saveEmployees } from '../data/database';
import AddEmployeeDialog from './AddEmployeeDialog'; // Keep this import for now, even if dialog is not rendered

interface AssignEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  request: PersonnelRequest | null;
  employees: Employee[];
  onAssignEmployee: (employeeId: number, hotelName: string) => void;
  onFulfillRequest: (requestId: number) => void;
}

const AssignEmployeeDialog: React.FC<AssignEmployeeDialogProps> = ({
  open, onClose, request, employees, onAssignEmployee, onFulfillRequest
}) => {
  const theme = useTheme();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  const mainButtonStyles = {
    transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
    '&:hover': {
      transform: 'scale(1.05)',
      boxShadow: theme.shadows[6],
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
  };

  React.useEffect(() => {
    if (!open) {
      setSelectedEmployeeId(null); // Reset selected employee when dialog closes
    }
  }, [open]);

  const handleAssignConfirm = () => {
    if (selectedEmployeeId && request) {
      onAssignEmployee(selectedEmployeeId, request.hotelName);
      onFulfillRequest(request.id);
      onClose();
    }
  };

  const availableEmployees = useMemo(() => {
    if (!request) return [];
    return employees.filter(emp => emp.status === 'Available' && emp.position === request.position && !emp.isBlacklisted);
  }, [employees, request]);

  if (!request) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Asignar Empleado a: {request.position} en {request.hotelName}</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>Empleados disponibles para {request.position}:</Typography>
        {availableEmployees.length === 0 ? (
          <Typography>No hay empleados disponibles para esta posición.</Typography>
        ) : (
          <List>
            {availableEmployees.map((employee) => (
              <ListItem key={employee.id} button onClick={() => setSelectedEmployeeId(employee.id)}>
                <ListItemIcon>
                  <Radio checked={selectedEmployeeId === employee.id} />
                </ListItemIcon>
                <ListItemText primary={employee.name} secondary={`Posición: ${employee.position}, Estado: ${employee.status}`} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleAssignConfirm} disabled={!selectedEmployeeId || availableEmployees.length === 0} sx={mainButtonStyles} variant="contained">Confirmar Asignación</Button>
      </DialogActions>
    </Dialog>
  );
};

interface RecruitmentDashboardProps {
  requests: PersonnelRequest[];
  employees: Employee[];
  onAssignEmployee: (employeeId: number, hotelName: string) => void;
  onFulfillRequest: (requestId: number) => void;
  onEmployeeListRefresh: () => void; 
}

function RecruitmentDashboard({ requests, employees, onAssignEmployee, onFulfillRequest, onEmployeeListRefresh }: RecruitmentDashboardProps) {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState<keyof PersonnelRequest>('hotelName');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PersonnelRequest | null>(null);

  const mainButtonStyles = {
    transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
    '&:hover': {
      transform: 'scale(1.05)',
      boxShadow: theme.shadows[6],
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
  };

  const handleAssignClick = (request: PersonnelRequest) => {
    setSelectedRequest(request);
    setAssignDialogOpen(true);
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const handleRequestSort = (property: keyof PersonnelRequest) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedRequests = useMemo(() => {
    const pendingRequests = requests.filter(req => req.status === 'Pending');
    return pendingRequests.sort((a, b) => {
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
  }, [requests, orderBy, order]);

  const handleDownloadExcel = () => {
    const employees = getEmployees();
    const worksheet = XLSX.utils.json_to_sheet(employees);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
    XLSX.writeFile(workbook, "personal.xlsx");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Employee>(worksheet);
        
        const currentEmployees = getEmployees();
        const newEmployees = json.map(newEmp => ({
            ...newEmp,
            id: newEmp.id || Math.random(), // ensure id
        }));

        // A simple merge strategy: update existing or add new
        const employeeMap = new Map(currentEmployees.map(emp => [emp.id, emp]));
        newEmployees.forEach(emp => employeeMap.set(emp.id, emp));
        
        saveEmployees(Array.from(employeeMap.values()));
        alert('Datos de personal cargados exitosamente.');
        onEmployeeListRefresh();
      } catch (error) {
        console.error('Error during Excel upload:', error);
        alert('Error de red al intentar cargar el archivo Excel.');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Panel de Reclutamiento
      </Typography>

      {/* Personnel Requests List */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Solicitudes de Personal Pendientes
      </Typography>
      <TableContainer component={Paper} elevation={3} sx={{ mb: 4 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', padding: '12px 16px' }} sortDirection={orderBy === 'id' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'id'}
                  direction={orderBy === 'id' ? order : 'asc'}
                  onClick={() => handleRequestSort('id')}
                >
                  Fecha de Solicitud
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', padding: '12px 16px' }} sortDirection={orderBy === 'hotelName' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'hotelName'}
                  direction={orderBy === 'hotelName' ? order : 'asc'}
                  onClick={() => handleRequestSort('hotelName')}
                >
                  Hotel
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', padding: '12px 16px' }} sortDirection={orderBy === 'position' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'position'}
                  direction={orderBy === 'position' ? order : 'asc'}
                  onClick={() => handleRequestSort('position')}
                >
                  Posición
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', padding: '12px 16px' }} sortDirection={orderBy === 'quantity' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'quantity'}
                  direction={orderBy === 'quantity' ? order : 'asc'}
                  onClick={() => handleRequestSort('quantity')}
                >
                  Cantidad
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', padding: '12px 16px' }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 'bold', padding: '12px 16px' }}>Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRequests.map((request) => (
              <TableRow key={request.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                <TableCell sx={{ padding: '12px 16px' }}>{new Date(request.id).toLocaleDateString()}</TableCell>
                <TableCell sx={{ padding: '12px 16px' }}>{request.hotelName}</TableCell>
                <TableCell sx={{ padding: '12px 16px' }}>{request.position}</TableCell>
                <TableCell sx={{ padding: '12px 16px' }}>{request.quantity}</TableCell>
                <TableCell sx={{ padding: '12px 16px' }}>{request.status}</TableCell>
                <TableCell sx={{ padding: '12px 16px' }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleAssignClick(request)}
                    sx={mainButtonStyles}
                  >
                    Asignar Empleado
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* All Employees List */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Base de Datos de Empleados
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Buscar por Nombre"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleDownloadExcel}
            sx={mainButtonStyles}
          >
            Descargar Excel
          </Button>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="excel-upload-input"
          />
          <Button
            variant="contained"
            color="secondary"
            onClick={() => document.getElementById('excel-upload-input')?.click()}
            sx={mainButtonStyles}
          >
            Cargar Excel
          </Button>
        </Box>
      </Box>
      <TableContainer component={Paper} elevation={3} sx={{ mt: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', padding: '12px 16px' }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 'bold', padding: '12px 16px' }}>Posición</TableCell>
              <TableCell sx={{ fontWeight: 'bold', padding: '12px 16px' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold', padding: '12px 16px' }}>Celular</TableCell>
              <TableCell sx={{ fontWeight: 'bold', padding: '12px 16px' }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 'bold', padding: '12px 16px' }}>Hotel Asignado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow key={employee.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                <TableCell sx={{ padding: '12px 16px' }}>{employee.name}</TableCell>
                <TableCell sx={{ padding: '12px 16px' }}>{employee.position}</TableCell>
                <TableCell sx={{ padding: '12px 16px' }}>{employee.email}</TableCell>
                <TableCell sx={{ padding: '12px 16px' }}>{employee.phone}</TableCell>
                <TableCell sx={{ padding: '12px 16px' }}>{employee.status}</TableCell>
                <TableCell sx={{ padding: '12px 16px' }}>{employee.hotel || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <AssignEmployeeDialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        request={selectedRequest}
        employees={employees}
        onAssignEmployee={onAssignEmployee}
        onFulfillRequest={onFulfillRequest}
      />
    </Box>
  );
}

export default RecruitmentDashboard;