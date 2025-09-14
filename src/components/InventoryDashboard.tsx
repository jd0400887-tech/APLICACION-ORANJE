import React, { useState } from 'react';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Snackbar,
  Alert,
  IconButton
} from '@mui/material';
import { getInventory, updateInventory } from '../data/database';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

const InventoryDashboard = () => {
  const [inventory, setInventory] = useState(getInventory());
  const [amounts, setAmounts] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const getStockColor = (quantity) => {
    if (quantity < 10) return '#ffcdd2'; // Light Red
    if (quantity < 50) return '#fff9c4'; // Light Yellow
    return 'transparent';
  };

  const handleAmountChange = (id, value) => {
    const numValue = parseInt(value, 10);
    setAmounts(prev => ({ ...prev, [id]: isNaN(numValue) ? '' : numValue }));
  };

  const handleUpdateStock = (id, change) => {
    const item = inventory.find(i => i.id === id);
    if (!item || change === 0) return;

    // Confirmation dialog for removing stock
    if (change < 0) {
      if (!window.confirm(`¿Estás seguro de que quieres quitar ${Math.abs(change)} de ${item.name}?`)) {
        return; // User cancelled
      }
    }

    const newQuantity = Math.max(0, item.quantity + change);
    updateInventory(item.id, newQuantity);
    setInventory(getInventory()); // Re-fetch from the source of truth

    setSnackbar({ open: true, message: '¡Inventario actualizado correctamente!', severity: 'success' });
    handleAmountChange(id, ''); // Reset input field
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gestión de Inventario de Uniformes
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ítem</TableCell>
              <TableCell align="right">Cantidad Actual</TableCell>
              <TableCell align="center" sx={{ width: '350px' }}>Modificar Stock</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.map((item) => {
              const amount = amounts[item.id] || '';
              return (
                <TableRow key={item.id} sx={{ backgroundColor: getStockColor(item.quantity) }}>
                  <TableCell component="th" scope="row">
                    {item.name}
                  </TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <Button 
                        variant="contained" 
                        color="success"
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={() => handleUpdateStock(item.id, parseInt(amount, 10) || 0)}
                        disabled={!amount || amount <= 0}
                      >
                        Añadir
                      </Button>
                      <TextField
                        type="number"
                        size="small"
                        sx={{ width: '100px' }}
                        value={amount}
                        onChange={(e) => handleAmountChange(item.id, e.target.value)}
                        inputProps={{ min: 0 }}
                      />
                      <Button 
                        variant="contained" 
                        color="error"
                        startIcon={<RemoveCircleOutlineIcon />}
                        onClick={() => handleUpdateStock(item.id, -1 * (parseInt(amount, 10) || 0))}
                        disabled={!amount || amount <= 0}
                      >
                        Quitar
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InventoryDashboard;