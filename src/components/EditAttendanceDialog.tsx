
import React, { useState, useEffect } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField
} from '@mui/material';
import { Attendance } from '../data/attendance';

interface EditAttendanceDialogProps {
  open: boolean;
  onClose: () => void;
  record: Attendance | null;
  onSave: (updatedRecord: Attendance) => void;
}

function EditAttendanceDialog({ open, onClose, record, onSave }: EditAttendanceDialogProps) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  useEffect(() => {
    if (record) {
      // Format date and time for datetime-local input
      const formatForInput = (dateStr: string, timeStr: string) => {
        const date = new Date(`${dateStr}T${timeStr}`);
        // Adjust for timezone offset to display local time correctly
        const timezoneOffset = date.getTimezoneOffset() * 60000; // in milliseconds
        const localDate = new Date(date.getTime() - timezoneOffset);
        return localDate.toISOString().slice(0, 16);
      };

      setCheckIn(formatForInput(record.date, record.checkIn));
      if (record.checkOut) {
        setCheckOut(formatForInput(record.date, record.checkOut));
      }
    } else {
      setCheckIn('');
      setCheckOut('');
    }
  }, [record]);

  const handleSave = () => {
    if (record) {
      const updatedRecord = {
        ...record,
        check_in_datetime: new Date(checkIn).toISOString(),
        check_out_datetime: new Date(checkOut).toISOString(),
      };
      onSave(updatedRecord as any);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Editar Registro de Asistencia</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: '16px !important' }}>
        <TextField
          label="Hora de Entrada"
          type="datetime-local"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Hora de Salida"
          type="datetime-local"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditAttendanceDialog;
