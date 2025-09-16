import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Asumiendo que tienes un useAuth hook
import {
  Box, Button, TextField, Typography, Alert, Snackbar
} from '@mui/material';

function ChangePasswordForm() {
  const { supabase } = useAuth(); // Obtén la instancia de supabase de tu contexto
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSnackbar({ ...snackbar, open: false }); // Close any existing snackbar

    if (newPassword !== confirmPassword) {
      setSnackbar({ open: true, message: 'Las contraseñas no coinciden.', severity: 'error' });
      return;
    }

    if (newPassword.length < 6) { // Supabase default minimum password length
      setSnackbar({ open: true, message: 'La contraseña debe tener al menos 6 caracteres.', severity: 'error' });
      return;
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setSnackbar({ open: true, message: 'Error al actualizar la contraseña: ' + error.message, severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Contraseña actualizada exitosamente.', severity: 'success' });
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: 'Error al actualizar la contraseña: ' + err.message, severity: 'error' });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, maxWidth: 400, mx: 'auto', p: 2, border: '1px solid #ccc', borderRadius: '8px' }}>
      <Typography variant="h5" component="h2" gutterBottom>Cambiar Contraseña</Typography>
      <TextField
        margin="normal"
        required
        fullWidth
        name="newPassword"
        label="Nueva Contraseña"
        type="password"
        id="newPassword"
        autoComplete="new-password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="confirmPassword"
        label="Confirmar Nueva Contraseña"
        type="password"
        id="confirmPassword"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
      >
        Actualizar Contraseña
      </Button>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ChangePasswordForm;
