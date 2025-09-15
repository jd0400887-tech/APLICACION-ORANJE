import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Grid,
  MenuItem,
} from '@mui/material';

function PersonnelRequestForm({ open, onClose, hotelName, hotelId, onAddNewRequest }) {
  const [formData, setFormData] = useState({
    city: '',
    state: '',
    manager: '',
    contact: '',
    position: '',
    quantity: '',
    startTime: '',
    startDate: '',
    endDate: '',
    englishSpeakingLevel: '',
    englishListeningLevel: '',
    experience: '',
    observations: '',
  });

  const englishLevels = ['Básico', 'Intermedio', 'Avanzado', 'Nativo'];
  const positions = ['Recepcionista', 'Limpieza', 'Seguridad', 'Gerente', 'Otro']; // Example positions

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onAddNewRequest({
      hotel_id: hotelId,
      position: formData.position,
      quantity: parseInt(formData.quantity, 10) || 1,
    });
    onClose(); // Close the dialog after submission
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Solicitud de Requerimiento de Personal para {hotelName}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          {/* Grid items for form fields remain unchanged */}
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}>
            <TextField
              margin="dense"
              name="city"
              label="Ciudad"
              type="text"
              fullWidth
              variant="standard"
              value={formData.city}
              onChange={handleChange}
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}>
            <TextField
              margin="dense"
              name="state"
              label="Estado"
              type="text"
              fullWidth
              variant="standard"
              value={formData.state}
              onChange={handleChange}
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}>
            <TextField
              margin="dense"
              name="manager"
              label="Manager"
              type="text"
              fullWidth
              variant="standard"
              value={formData.manager}
              onChange={handleChange}
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}>
            <TextField
              margin="dense"
              name="contact"
              label="Contacto"
              type="text"
              fullWidth
              variant="standard"
              value={formData.contact}
              onChange={handleChange}
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}>
            <TextField
              select
              margin="dense"
              name="position"
              label="Posición"
              fullWidth
              variant="standard"
              value={formData.position}
              onChange={handleChange}
            >
              {positions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}>
            <TextField
              margin="dense"
              name="quantity"
              label="Cantidad"
              type="number"
              fullWidth
              variant="standard"
              value={formData.quantity}
              onChange={handleChange}
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 4
            }}>
            <TextField
              margin="dense"
              name="startTime"
              label="Hora de Inicio"
              type="time"
              fullWidth
              variant="standard"
              InputLabelProps={{ shrink: true }}
              value={formData.startTime}
              onChange={handleChange}
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 4
            }}>
            <TextField
              margin="dense"
              name="startDate"
              label="Fecha de Inicio"
              type="date"
              fullWidth
              variant="standard"
              InputLabelProps={{ shrink: true }}
              value={formData.startDate}
              onChange={handleChange}
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 4
            }}>
            <TextField
              margin="dense"
              name="endDate"
              label="Fecha de Finalización"
              type="date"
              fullWidth
              variant="standard"
              InputLabelProps={{ shrink: true }}
              value={formData.endDate}
              onChange={handleChange}
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}>
            <TextField
              select
              margin="dense"
              name="englishSpeakingLevel"
              label="Nivel de Hablar Inglés"
              fullWidth
              variant="standard"
              value={formData.englishSpeakingLevel}
              onChange={handleChange}
            >
              {englishLevels.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 6
            }}>
            <TextField
              select
              margin="dense"
              name="englishListeningLevel"
              label="Nivel de Escuchar Inglés"
              fullWidth
              variant="standard"
              value={formData.englishListeningLevel}
              onChange={handleChange}
            >
              {englishLevels.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={12}>
            <TextField
              margin="dense"
              name="experience"
              label="Experiencia"
              type="text"
              fullWidth
              multiline
              rows={2}
              variant="standard"
              value={formData.experience}
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
              rows={3}
              variant="standard"
              value={formData.observations}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit}>Enviar Solicitud</Button>
      </DialogActions>
    </Dialog>
  );
}

export default PersonnelRequestForm;
