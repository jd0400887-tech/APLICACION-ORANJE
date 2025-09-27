
import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Box, CircularProgress, List, ListItem, ListItemText, Button, TextField, Select, MenuItem, FormControl, InputLabel, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getEmployees, Employee, getEmployeeAdjustments, addEmployeeAdjustment, deleteEmployeeAdjustment, Adjustment } from '../data/database';

const EmployeeAdjustmentsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [newAdjustment, setNewAdjustment] = useState({ type: 'addition', amount: '', description: '' });
  const [employeeSearch, setEmployeeSearch] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const allEmployees = await getEmployees();
        setEmployees(allEmployees);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
      }
      setLoading(false);
    };
    fetchEmployees();
  }, []);

  const handleEmployeeSelect = async (employee: Employee) => {
    setSelectedEmployee(employee);
    try {
      const employeeAdjustments = await getEmployeeAdjustments(parseInt(employee.id));
      setAdjustments(employeeAdjustments);
    } catch (error) {
      console.error("Failed to fetch employee adjustments:", error);
    }
  };

  const handleAddAdjustment = async () => {
    if (selectedEmployee && newAdjustment.amount && newAdjustment.description) {
      const newAdj: Omit<Adjustment, 'id'> = {
        employee_id: parseInt(selectedEmployee.id),
        date: new Date().toISOString().split('T')[0],
        type: newAdjustment.type as 'addition' | 'deduction',
        amount: parseFloat(newAdjustment.amount),
        description: newAdjustment.description,
      };
      const addedAdjustment = await addEmployeeAdjustment(newAdj);
      if (addedAdjustment) {
        setAdjustments([...adjustments, addedAdjustment]);
        setNewAdjustment({ type: 'addition', amount: '', description: '' });
      }
    }
  };

  const handleDeleteAdjustment = async (adjustmentId: number) => {
    await deleteEmployeeAdjustment(adjustmentId);
    setAdjustments(adjustments.filter(adj => adj.id !== adjustmentId));
  };

  if (loading) {
    return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Container>;
  }

  const filteredEmployees = employees.filter(emp => emp.name.toLowerCase().includes(employeeSearch.toLowerCase()));

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Ajustes de Empleados</Typography>
      <Box sx={{ display: 'flex', gap: 4 }}>
        <Paper sx={{ width: '30%', p: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6">Empleados</Typography>
          <TextField
            label="Buscar Empleado"
            variant="outlined"
            size="small"
            sx={{ mt: 2, mb: 1 }}
            value={employeeSearch}
            onChange={(e) => setEmployeeSearch(e.target.value)}
          />
          <List sx={{ overflow: 'auto' }}>
            {filteredEmployees.map(emp => (
              <ListItem button key={emp.id} onClick={() => handleEmployeeSelect(emp)}>
                <ListItemText primary={emp.name} secondary={emp.role} />
              </ListItem>
            ))}
          </List>
        </Paper>
        <Paper sx={{ width: '70%', p: 2 }}>
          {selectedEmployee ? (
            <>
              <Typography variant="h6">Ajustes para {selectedEmployee.name}</Typography>
              <List>
                {adjustments.map(adj => (
                  <ListItem key={adj.id} secondaryAction={<IconButton edge="end" aria-label="delete" onClick={() => handleDeleteAdjustment(adj.id)}><DeleteIcon /></IconButton>}>
                    <ListItemText 
                      primary={`${adj.description}: ${adj.type === 'addition' ? '+' : '-'}$${adj.amount}`}
                      secondary={adj.date}
                    />
                  </ListItem>
                ))}
              </List>
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6">Nuevo Ajuste</Typography>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={newAdjustment.type}
                    onChange={(e) => setNewAdjustment({ ...newAdjustment, type: e.target.value })}
                  >
                    <MenuItem value="addition">Adición</MenuItem>
                    <MenuItem value="deduction">Deducción</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Monto"
                  type="number"
                  fullWidth
                  sx={{ mt: 2 }}
                  value={newAdjustment.amount}
                  onChange={(e) => setNewAdjustment({ ...newAdjustment, amount: e.target.value })}
                />
                <TextField
                  label="Descripción"
                  fullWidth
                  sx={{ mt: 2 }}
                  value={newAdjustment.description}
                  onChange={(e) => setNewAdjustment({ ...newAdjustment, description: e.target.value })}
                />
                <Button variant="contained" sx={{ mt: 2 }} onClick={handleAddAdjustment}>Agregar Ajuste</Button>
              </Box>
            </>
          ) : (
            <Typography>Selecciona un empleado para ver sus ajustes.</Typography>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default EmployeeAdjustmentsView;
