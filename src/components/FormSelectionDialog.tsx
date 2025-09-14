import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
} from '@mui/material';

function FormSelectionDialog({ open, onClose, hotelName, onSelectForm }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Seleccionar Acción para {hotelName}</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          ¿Qué acción te gustaría realizar para este hotel?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '80%' }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => onSelectForm('personnelRequest')}
          >
            Solicitud de Requerimiento de Personal
          </Button>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => onSelectForm('incidentAlert')}
          >
            Reportar Accidente/Incidente
          </Button>
          <Button
            variant="text"
            color="inherit"
            fullWidth
            onClick={onClose}
          >
            Cancelar
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

export default FormSelectionDialog;
