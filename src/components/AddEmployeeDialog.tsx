import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Grid, Snackbar, Alert
} from '@mui/material';
import { supabase } from '../supabaseClient';
import { Employee } from '../data/database';

interface AddEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => void;
}

const roles = ['Admin', 'Hotel Manager', 'Reclutador', 'QA Inspector', 'Contador', 'Trabajador'];

const AddEmployeeDialog: React.FC<AddEmployeeDialogProps> = ({ open, onClose, onSave }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [role, setRole] = useState<string>('Trabajador');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setSnackbar({ ...snackbar, open: false });
    setLoading(true);

    if (!email || !password || !name || !position || !role) {
      setSnackbar({ open: true, message: 'Por favor, complete todos los campos requeridos.', severity: 'error' });
      setLoading(false);
      return;
    }

    try {
      // 1. Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setSnackbar({ open: true, message: 'Error al registrar usuario: ' + authError.message, severity: 'error' });
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setSnackbar({ open: true, message: 'Error: No se pudo obtener el usuario registrado.', severity: 'error' });
        setLoading(false);
        return;
      }

      // 2. Insert employee details into the 'employees' table
      const newEmployee: Omit<Employee, 'imageUrl' | 'isBlacklisted' | 'hotel'> & { image_url: string; is_blacklisted: boolean; } = {
        id: authData.user.id, // UUID string, matches DB
        name,
        email,
        dob: '2000-01-01', // Default value, nullable in DB
        phone: '', // Default value, nullable in DB
        country: '', // Default value, nullable in DB
        state: '', // Default value, nullable in DB
        city: '', // Default value, nullable in DB
        zip: '', // Default value, nullable in DB
        address: '', // Default value, nullable in DB
        position,
        image_url: '', // Default value, nullable in DB
        status: 'Available', // Default status, nullable in DB
        role: role as Employee['role'], // From form, NOT NULL in DB
        is_blacklisted: false, // Default false, NOT NULL in DB
      };

      const { error: insertError } = await supabase.from('employees').insert([newEmployee as any]);

      if (insertError) {
        setSnackbar({ open: true, message: 'Error al añadir empleado: ' + insertError.message, severity: 'error' });
        setLoading(false);
        return;
      }

      setSnackbar({ open: true, message: 'Empleado añadido con éxito.', severity: 'success' });
      onSave(newEmployee); // Notify parent component
      onClose();
      // Clear form fields
      setEmail('');
      setPassword('');
      setName('');
      setPosition('');
      setRole('Trabajador');

    } catch (error: any) {
      setSnackbar({ open: true, message: 'Error inesperado: ' + error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Añadir Nuevo Empleado</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField margin="dense" name="email" label="Email" type="email" fullWidth variant="standard" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField margin="dense" name="password" label="Contraseña" type="password" fullWidth variant="standard" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField margin="dense" name="name" label="Nombre" type="text" fullWidth variant="standard" value={name} onChange={(e) => setName(e.target.value)} required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField margin="dense" name="position" label="Posición" type="text" fullWidth variant="standard" value={position} onChange={(e) => setPosition(e.target.value)} required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select margin="dense" name="role" label="Rol" fullWidth variant="standard" value={role} onChange={(e) => setRole(e.target.value)} required>
              {roles.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button onClick={handleSave} disabled={loading}>Guardar</Button>
      </DialogActions>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default AddEmployeeDialog;
