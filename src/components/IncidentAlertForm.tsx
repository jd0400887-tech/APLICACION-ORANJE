import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Grid,
} from '@mui/material';

function IncidentAlertForm({ open, onClose, hotelName }) {
  const [formData, setFormData] = useState({
    employeeName: '',
    incidentDay: '',
    observations: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log('Alerta de Accidente/Incidente:', { hotel: hotelName, ...formData });
    // Here you would typically send this data to a backend
    onClose(); // Close the dialog after submission
    setFormData({ // Reset form
      employeeName: '',
      incidentDay: '',
      observations: '',
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reportar Accidente/Incidente para {hotelName}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid size={12}>
            <TextField
              autoFocus
              margin="dense"
              name="employeeName"
              label="Nombre del Empleado"
              type="text"
              fullWidth
              variant="standard"
              value={formData.employeeName}
              onChange={handleChange}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              margin="dense"
              name="incidentDay"
              label="Día del Incidente"
              type="date"
              fullWidth
              variant="standard"
              InputLabelProps={{ shrink: true }}
              value={formData.incidentDay}
              onChange={handleChange}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              margin="dense"
              name="observations"
              label="Observaciones"
              type="text"
              fullWidth
              multiline
              rows={4}
              variant="standard"
              value={formData.observations}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit}>Enviar Alerta</Button>
      </DialogActions>
    </Dialog>
  );
}

export default IncidentAlertForm;
