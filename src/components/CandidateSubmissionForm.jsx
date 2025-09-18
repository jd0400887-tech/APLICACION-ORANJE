import React, { useState } from 'react';
import { TextField, Button, Box, Typography, CircularProgress, Alert } from '@mui/material';
import { supabase } from '../supabaseClient'; // Asegúrate de que la ruta sea correcta

const CandidateSubmissionForm = ({ onClose }) => {
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
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data, error } = await supabase
        .from('candidate_submissions') // Revertido al nombre de tabla correcto
        .insert([formData]);

      if (error) {
        throw error;
      }

      setSuccess(true);
      setFormData({ // Limpiar el formulario después del éxito
        name: '', email: '', dob: '', phone: '', country: '', state: '', city: '', zip: '', address: '', position: '',
      });
      // Opcional: cerrar el modal automáticamente después de un tiempo
      // setTimeout(onClose, 3000);
    } catch (err) {
      console.error('Error al enviar la candidatura:', err.message);
      setError('Error al enviar la candidatura: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Envía tu Candidatura
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }}>¡Candidatura enviada con éxito!</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TextField
        fullWidth
        margin="normal"
        label="Nombre Completo"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <TextField
        fullWidth
        margin="normal"
        label="Correo Electrónico"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Fecha de Nacimiento"
        name="dob"
        type="date"
        value={formData.dob}
        onChange={handleChange}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Teléfono"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
      />
      <TextField
        fullWidth
        margin="normal"
        label="País"
        name="country"
        value={formData.country}
        onChange={handleChange}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Estado/Provincia"
        name="state"
        value={formData.state}
        onChange={handleChange}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Ciudad"
        name="city"
        value={formData.city}
        onChange={handleChange}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Código Postal"
        name="zip"
        value={formData.zip}
        onChange={handleChange}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Dirección"
        name="address"
        value={formData.address}
        onChange={handleChange}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Puesto al que aplica"
        name="position"
        value={formData.position}
        onChange={handleChange}
      />
      

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
        <Button onClick={onClose} color="secondary" disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Enviar Candidatura'}
        </Button>
      </Box>
    </Box>
  );
};

export default CandidateSubmissionForm;
