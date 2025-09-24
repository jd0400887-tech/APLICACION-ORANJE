import React, { useState, useEffect } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Switch,
  FormControl, InputLabel, Select, MenuItem, FormControlLabel, Box
} from '@mui/material';
import { Hotel } from '../data/database';
import EditHotelRatesDialog from './EditHotelRatesDialog';

// Define the structure for payroll settings
export interface PayrollSettings {
  week_cutoff_day: 'saturday' | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  overtime_enabled: boolean;
  overtime_multiplier: number;
}

interface PayrollSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  hotel: Hotel;
  onSave: (updatedHotel: Hotel) => void;
}

const weekDays = [
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
];

function PayrollSettingsDialog({ open, onClose, hotel, onSave }: PayrollSettingsDialogProps) {
  const [settings, setSettings] = useState<PayrollSettings | null>(null);
  const [isRatesDialogOpen, setIsRatesDialogOpen] = useState(false);

  useEffect(() => {
    if (hotel) {
      const existingSettings = hotel.payroll_settings as PayrollSettings;
      setSettings({
        week_cutoff_day: existingSettings?.week_cutoff_day || 'saturday',
        overtime_enabled: existingSettings?.overtime_enabled || false,
        overtime_multiplier: existingSettings?.overtime_multiplier || 1.5,
      });
    } else {
      setSettings(null);
    }
  }, [hotel]);

  const handleChange = (field: keyof PayrollSettings, value: any) => {
    setSettings(prev => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSaveSettings = () => {
    if (settings) {
      const updatedHotel = {
        ...hotel,
        payroll_settings: settings,
      };
      onSave(updatedHotel);
    }
    onClose();
  };

  const handleSaveRates = (updatedHotel: Hotel) => {
    onSave(updatedHotel); // Pass the save event up to the parent
    setIsRatesDialogOpen(false);
  };

  if (!settings) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Configuración de Nómina para {hotel.name}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="week-cutoff-day-label">Día de Corte Semanal</InputLabel>
              <Select
                labelId="week-cutoff-day-label"
                value={settings.week_cutoff_day}
                label="Día de Corte Semanal"
                onChange={(e) => handleChange('week_cutoff_day', e.target.value)}
              >
                {weekDays.map(day => (
                  <MenuItem key={day.value} value={day.value}>{day.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.overtime_enabled}
                  onChange={(e) => handleChange('overtime_enabled', e.target.checked)}
                />
              }
              label="Activar Overtime"
            />

            <TextField
              label="Multiplicador de Overtime (ej. 1.5)"
              type="number"
              disabled={!settings.overtime_enabled}
              value={settings.overtime_multiplier}
              onChange={(e) => handleChange('overtime_multiplier', parseFloat(e.target.value))}
              fullWidth
              InputProps={{ inputProps: { min: 1, step: 0.1 } }}
            />

            <Button variant="outlined" onClick={() => setIsRatesDialogOpen(true)} sx={{ mt: 2 }}>
              Editar Tarifas por Posición (Pay Rate / Bill Rate)
            </Button>

          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSaveSettings} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      <EditHotelRatesDialog
        open={isRatesDialogOpen}
        onClose={() => setIsRatesDialogOpen(false)}
        hotel={hotel}
        onSave={handleSaveRates}
      />
    </>
  );
}

export default PayrollSettingsDialog;