import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardActions, Button, Avatar, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, Chip, FormControlLabel, Switch, useTheme, Select, FormControl, InputLabel, Snackbar, Alert
} from '@mui/material';
import { Employee, getInventory, assignUniformToEmployee, InventoryItem } from '../data/database';
import { useAuth } from '../context/AuthContext';
import { getDisplayImage } from '../utils/imageUtils';
import * as XLSX from 'xlsx';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddEmployeeDialog from './AddEmployeeDialog';

const roles = ['Admin', 'Hotel Manager', 'Reclutador', 'QA Inspector', 'Contador', 'Trabajador'];

interface EditEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSave: (employee: Employee) => void;
}

const EditEmployeeDialog: React.FC<EditEmployeeDialogProps> = ({ open, onClose, employee, onSave }) => {
  const [editedEmployee, setEditedEmployee] = useState<Employee | null>(employee);

  useEffect(() => {
    setEditedEmployee(employee);
  }, [employee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedEmployee((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSave = () => {
    if (editedEmployee) {
      onSave(editedEmployee);
      onClose();
    }
  };

  if (!editedEmployee) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Editar Empleado: {editedEmployee.name}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}><TextField margin="dense" name="name" label="Nombre" type="text" fullWidth variant="standard" value={editedEmployee.name} onChange={handleChange} /></Grid>
          <Grid item xs={12} sm={6}><TextField margin="dense" name="email" label="Email" type="email" fullWidth variant="standard" value={editedEmployee.email} onChange={handleChange} /></Grid>
          <Grid item xs={12} sm={6}><TextField margin="dense" name="dob" label="Fecha de Nacimiento" type="date" fullWidth variant="standard" InputLabelProps={{ shrink: true }} value={editedEmployee.dob} onChange={handleChange} /></Grid>
          <Grid item xs={12} sm={6}><TextField margin="dense" name="phone" label="Número Celular" type="text" fullWidth variant="standard" value={editedEmployee.phone} onChange={handleChange} /></Grid>
          <Grid item xs={12} sm={6}><TextField margin="dense" name="country" label="País" type="text" fullWidth variant="standard" value={editedEmployee.country} onChange={handleChange} /></Grid>
          <Grid item xs={12} sm={6}><TextField margin="dense" name="state" label="Estado" type="text" fullWidth variant="standard" value={editedEmployee.state} onChange={handleChange} /></Grid>
          <Grid item xs={12} sm={6}><TextField margin="dense" name="city" label="Ciudad" type="text" fullWidth variant="standard" value={editedEmployee.city} onChange={handleChange} /></Grid>
          <Grid item xs={12} sm={6}><TextField margin="dense" name="zip" label="Código Postal" type="text" fullWidth variant="standard" value={editedEmployee.zip} onChange={handleChange} /></Grid>
          <Grid item xs={12}><TextField margin="dense" name="address" label="Dirección" type="text" fullWidth variant="standard" value={editedEmployee.address} onChange={handleChange} /></Grid>
          <Grid item xs={12}><TextField margin="dense" name="position" label="Posición" type="text" fullWidth variant="standard" value={editedEmployee.position} onChange={handleChange} /></Grid>
          <Grid item xs={12}><TextField margin="dense" name="image_url" label="URL de Imagen" type="text" fullWidth variant="standard" value={editedEmployee.image_url} onChange={handleChange} /></Grid>
          <Grid item xs={12}><FormControlLabel control={<Switch checked={editedEmployee.isBlacklisted} onChange={(e) => setEditedEmployee((prev) => (prev ? { ...prev, isBlacklisted: e.target.checked } : null))} name="isBlacklisted" color="secondary" />} label="Marcar como en Lista Negra" /></Grid>
          <Grid item xs={12}><TextField select margin="dense" name="role" label="Rol" fullWidth variant="standard" value={editedEmployee.role} onChange={handleChange}>{roles.map((option) => (<MenuItem key={option} value={option}>{option}</MenuItem>))}</TextField></Grid>
        </Grid>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Cancelar</Button><Button onClick={handleSave}>Guardar</Button></DialogActions>
    </Dialog>
  );
};

interface AssignUniformDialogProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
  onAssign: (employeeId: number, itemType: 'Pantalones' | 'Camisas') => void;
}

const AssignUniformDialog: React.FC<AssignUniformDialogProps> = ({ open, onClose, employee, onAssign }) => {
  const [itemToAssign, setItemToAssign] = useState<'Pantalones' | 'Camisas'>('Pantalones');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    if (open) setInventory(getInventory());
  }, [open]);

  const selectedItemStock = inventory.find(i => i.name === itemToAssign)?.quantity || 0;

  const handleAssign = () => {
    if (employee) onAssign(employee.id, itemToAssign);
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Asignar Uniforme a {employee.name}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Ítem de Uniforme</InputLabel>
          <Select value={itemToAssign} label="Ítem de Uniforme" onChange={(e) => setItemToAssign(e.target.value as 'Pantalones' | 'Camisas')}>
            <MenuItem value="Pantalones">Pantalones</MenuItem>
            <MenuItem value="Camisas">Camisas</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" sx={{ mt: 2 }}>Stock disponible: {selectedItemStock}</Typography>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Cancelar</Button><Button onClick={handleAssign} disabled={selectedItemStock <= 0}>Asignar</Button></DialogActions>
    </Dialog>
  );
};

function CollaboratorsDashboard({ employees, onUpdateEmployee, onDeleteEmployee, onRefreshEmployees }: any) {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [addEmployeeDialogOpen, setAddEmployeeDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('');
  const [showBlacklistedOnly, setShowBlacklistedOnly] = useState<boolean>(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const mainButtonStyles = {
    transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
    '&:hover': { transform: 'scale(1.05)', boxShadow: theme.shadows[6] },
    '&:active': { transform: 'scale(0.98)' },
  };

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditDialogOpen(true);
  };

  const handleAssignClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setAssignDialogOpen(true);
  };

  const handleSaveEmployee = (updatedEmployee: Employee) => {
    onUpdateEmployee(updatedEmployee);
    setEditDialogOpen(false);
  };

  const handleDeleteClick = (employeeId: number) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      onDeleteEmployee(employeeId);
    }
  };

  const handleAssignUniform = (employeeId: number, itemType: 'Pantalones' | 'Camisas') => {
    const result = assignUniformToEmployee(employeeId, itemType);
    setSnackbar({ open: true, message: result.message, severity: result.success ? 'success' : 'error' });
    if (result.success) {
      onRefreshEmployees();
    }
    setAssignDialogOpen(false);
  };
  
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const filteredEmployees = useMemo(() => {
    let currentEmployees = employees;
    if (selectedRoleFilter) currentEmployees = currentEmployees.filter((e) => e.role === selectedRoleFilter);
    if (showBlacklistedOnly) currentEmployees = currentEmployees.filter((e) => e.isBlacklisted);
    if (selectedStatusFilter) currentEmployees = currentEmployees.filter((e) => e.status === selectedStatusFilter);
    return currentEmployees;
  }, [employees, selectedRoleFilter, showBlacklistedOnly, selectedStatusFilter]);

  const handleExport = () => {
    const dataToExport = filteredEmployees.map(emp => ({
      'Nombre': emp.name, 'Posición': emp.position, 'Email': emp.email, 'Estado': emp.status,
      'Hotel Asignado': emp.hotel || 'N/A', 'Rol': emp.role, 'En Lista Negra': emp.isBlacklisted ? 'Sí' : 'No',
      'Pantalones Asignados': emp.uniforms?.pants || 0, 'Camisas Asignadas': emp.uniforms?.shirts || 0,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Colaboradores");
    XLSX.writeFile(workbook, "Colaboradores.xlsx");
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>Módulo de Colaboradores</Typography>
        <Box>
          <Button variant="contained" startIcon={<FileDownloadIcon />} onClick={handleExport} disabled={filteredEmployees.length === 0} sx={{ mr: 1 }}>Exportar a Excel</Button>
          <Button variant="contained" color="primary" onClick={() => setAddEmployeeDialogOpen(true)}>Añadir Empleado</Button>
        </Box>
      </Box>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip label="Todos los Roles" clickable color={selectedRoleFilter === '' ? 'primary' : 'default'} onClick={() => setSelectedRoleFilter('')} />
        {roles.map((role) => (<Chip key={role} label={role} clickable color={selectedRoleFilter === role ? 'primary' : 'default'} onClick={() => setSelectedRoleFilter(role)} />))}
        <Chip label="Ver Solo Lista Negra" clickable color={showBlacklistedOnly ? 'secondary' : 'default'} onClick={() => setShowBlacklistedOnly(!showBlacklistedOnly)} />
      </Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip label="Todos los Estados" clickable color={selectedStatusFilter === '' ? 'primary' : 'default'} onClick={() => setSelectedStatusFilter('')} />
        <Chip label="Disponibles" clickable color={selectedStatusFilter === 'Available' ? 'primary' : 'default'} onClick={() => setSelectedStatusFilter('Available')} />
        <Chip label="Asignados" clickable color={selectedStatusFilter === 'Assigned' ? 'primary' : 'default'} onClick={() => setSelectedStatusFilter('Assigned')} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        {filteredEmployees.map((employee) => (
          <Box key={employee.id}>
            <Card sx={{ textAlign: 'center', backgroundColor: employee.isBlacklisted ? '#424242' : '#ffffff', color: employee.isBlacklisted ? '#ffffff' : '#000000' }}>
              <Box sx={{ pt: 3 }}><Avatar alt={`Foto de ${employee.name}`} src={getDisplayImage(employee.image_url, 'person')} sx={{ width: 100, height: 100, margin: 'auto' }} /></Box>
              <CardContent>
                <Typography gutterBottom variant="h6" component="div">{employee.name}</Typography>
                <Typography variant="body2" color="text.primary" component="p">{employee.position}</Typography>
                <Typography variant="body2" color="text.secondary">**Estado:** {employee.status}</Typography>
                <Typography variant="body2" color="text.secondary">**Rol:** {employee.role}</Typography>
                <Typography variant="body2" color="text.secondary">{employee.city}, {employee.country}</Typography>
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>Uniformes: {employee.uniforms?.pants || 0} Pantalones, {employee.uniforms?.shirts || 0} Camisas</Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Button size="small" variant="contained" onClick={() => handleEditClick(employee)} sx={mainButtonStyles}>Editar</Button>
                <Button size="small" variant="outlined" onClick={() => handleAssignClick(employee)}>Asignar Uniforme</Button>
                {currentUser && currentUser.role === 'Admin' && (<Button size="small" variant="contained" color="secondary" onClick={() => handleDeleteClick(employee.id)}>Eliminar</Button>)}
              </CardActions>
            </Card>
          </Box>
        ))}
      </Box>

      <EditEmployeeDialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} employee={selectedEmployee} onSave={handleSaveEmployee} />
      <AssignUniformDialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} employee={selectedEmployee} onAssign={handleAssignUniform} />
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}><Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert></Snackbar>
      <AddEmployeeDialog open={addEmployeeDialogOpen} onClose={() => setAddEmployeeDialogOpen(false)} onSave={onRefreshEmployees} />
    </Box>
  );
}

export default CollaboratorsDashboard;