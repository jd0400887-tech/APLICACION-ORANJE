import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Snackbar, Alert } from '@mui/material';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom'; // Added import

const CandidateSubmissionForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dob: '',
    phone: '',
    country: '',
    state: '',
    city: '',
    zip: '',
    address: '',
    position: '',
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const navigate = useNavigate(); // Added hook

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSnackbar({ open: false, message: '', severity: 'success' });

    try {
      const { error } = await supabase
        .from('candidate_submissions')
        .insert([formData]);

      if (error) {
        throw error;
      }

      setSnackbar({ open: true, message: 'Candidato registrado con éxito!', severity: 'success' });
      setFormData({ // Clear form
        name: '',
        email: '',
        dob: '',
        phone: '',
        country: '',
        state: '',
        city: '',
        zip: '',
        address: '',
        position: '',
      });
      navigate('/'); // Redirect to home page
    } catch (err: any) {
      console.error('Error al registrar candidato:', err);
      setSnackbar({ open: true, message: `Error: ${err.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };


  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container component="main" maxWidth="md">
      <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Registro de Candidato
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Nombre Completo"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="dob"
            label="Fecha de Nacimiento"
            name="dob"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formData.dob}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="phone"
            label="Teléfono"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="country"
            label="País"
            name="country"
            value={formData.country}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="state"
            label="Estado/Provincia"
            name="state"
            value={formData.state}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="city"
            label="Ciudad"
            name="city"
            value={formData.city}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="zip"
            label="Código Postal"
            name="zip"
            value={formData.zip}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="address"
            label="Dirección"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="position"
            label="Puesto Deseado"
            name="position"
            value={formData.position}
            onChange={handleChange}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Registrar Candidato'}
          </Button>
        </Box>
      </Paper>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity as any} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CandidateSubmissionForm;
