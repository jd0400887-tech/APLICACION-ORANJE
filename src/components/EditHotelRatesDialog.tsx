
import React, { useState, useEffect } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, IconButton, Box, Typography,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Hotel } from '../data/database';
import { workerPositions } from '../data/positions';

interface EditHotelRatesDialogProps {
  open: boolean;
  onClose: () => void;
  hotel: Hotel;
  onSave: (updatedHotel: Hotel) => void;
}

function EditHotelRatesDialog({ open, onClose, hotel, onSave }: EditHotelRatesDialogProps) {
  const [rates, setRates] = useState<{ position: string; hourlyRate: number; billingRate: number }[]>([]);

  useEffect(() => {
    if (hotel) {
      const combinedRates: { [position: string]: { hourlyRate: number; billingRate: number } } = {};

      if (hotel.hourly_rates_by_position) {
        Object.entries(hotel.hourly_rates_by_position).forEach(([position, rate]) => {
          combinedRates[position] = { hourlyRate: rate, billingRate: 0 };
        });
      }

      if (hotel.billing_rates_by_position) {
        Object.entries(hotel.billing_rates_by_position).forEach(([position, rate]) => {
          if (combinedRates[position]) {
            combinedRates[position].billingRate = rate;
          } else {
            combinedRates[position] = { hourlyRate: 0, billingRate: rate };
          }
        });
      }

      const ratesArray = Object.entries(combinedRates).map(([position, { hourlyRate, billingRate }]) => ({
        position,
        hourlyRate,
        billingRate,
      }));
      setRates(ratesArray);
    } else {
      setRates([]);
    }
  }, [hotel]);

  const handleAddRate = () => {
    setRates(prev => [...prev, { position: '', hourlyRate: 0, billingRate: 0 }]);
  };

  const handleChangeRate = (index: number, field: 'position' | 'hourlyRate' | 'billingRate', value: string | number) => {
    setRates(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: field === 'position' ? value : parseFloat(value as string) }
          : item
      )
    );
  };

  const handleDeleteRate = (index: number) => {
    setRates(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const newHourlyRatesByPosition: { [position: string]: number } = {};
    const newBillingRatesByPosition: { [position: string]: number } = {};

    rates.forEach(item => {
      if (item.position) {
        newHourlyRatesByPosition[item.position] = item.hourlyRate;
        newBillingRatesByPosition[item.position] = item.billingRate;
      }
    });

    onSave({
      ...hotel,
      hourly_rates_by_position: newHourlyRatesByPosition,
      billing_rates_by_position: newBillingRatesByPosition,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Editar Tarifas del Hotel para {hotel.name}</DialogTitle>
      <DialogContent dividers>
        {rates.length === 0 && (
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            No hay tarifas configuradas para este hotel. Añade una nueva.
          </Typography>
        )}
        {rates.map((item, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <FormControl fullWidth>
              <InputLabel id={`position-label-${index}`}>Posición</InputLabel>
              <Select
                labelId={`position-label-${index}`}
                value={item.position}
                label="Posición"
                onChange={(e) => handleChangeRate(index, 'position', e.target.value)}
              >
                {workerPositions.map(pos => (
                  <MenuItem key={pos} value={pos}>{pos}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Tarifa por Hora (Empleado)"
              type="number"
              value={item.hourlyRate}
              onChange={(e) => handleChangeRate(index, 'hourlyRate', e.target.value)}
              fullWidth
              InputProps={{ startAdornment: <Typography>$</Typography> }}
            />
            <TextField
              label="Tarifa de Facturación (Empresa)"
              type="number"
              value={item.billingRate}
              onChange={(e) => handleChangeRate(index, 'billingRate', e.target.value)}
              fullWidth
              InputProps={{ startAdornment: <Typography>$</Typography> }}
            />
            <IconButton onClick={() => handleDeleteRate(index)} color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
        <Button startIcon={<AddIcon />} onClick={handleAddRate} sx={{ mt: 2 }}>
          Añadir Tarifa
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditHotelRatesDialog;
