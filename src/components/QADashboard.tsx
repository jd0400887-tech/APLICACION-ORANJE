import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Slider, Rating
} from '@mui/material';
import { QAInspection, Employee, Hotel } from '../data/database';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useQA } from '../context/QAContext';

// Main Component Props
interface QADashboardProps {
  employees: Employee[];
  hotels: Hotel[];
  currentUser: any; // Simplified for this context
}

// Dialog for Add/Edit
interface InspectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<QAInspection, 'id'> | QAInspection) => void;
  inspection: QAInspection | null;
  employees: Employee[];
  hotels: Hotel[];
  inspectorName: string;
}

const InspectionDialog: React.FC<InspectionDialogProps> = ({ open, onClose, onSave, inspection, employees, hotels, inspectorName }) => {
  const [formData, setFormData] = useState<Omit<QAInspection, 'id'>>({
    hotelName: inspection?.hotelName || '',
    inspectorName: inspection?.inspectorName || inspectorName,
    date: inspection?.date || new Date().toISOString().split('T')[0],
    area: inspection?.area || '',
    score: inspection?.score || 5,
    comments: inspection?.comments || '',
    employeeId: inspection?.employeeId || null,
  });

  useEffect(() => {
    if (open) {
        if (inspection) {
            setFormData({ ...inspection });
        } else {
            setFormData({
                hotelName: '',
                inspectorName,
                date: new Date().toISOString().split('T')[0],
                area: '',
                score: 5,
                comments: '',
                employeeId: null
            });
        }
    }
}, [inspection, open, inspectorName]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    setFormData(prev => ({ ...prev, [e.target.name!]: e.target.value }));
  };

  const handleSave = () => {
    if (inspection) {
      onSave({ ...formData, id: inspection.id });
    } else {
      onSave(formData);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{inspection ? 'Editar' : 'Nueva'} Inspección</DialogTitle>
      <DialogContent>
        <TextField select label="Hotel" name="hotelName" value={formData.hotelName} onChange={handleChange} fullWidth margin="normal">
          {hotels.map(h => <MenuItem key={h.id} value={h.name}>{h.name}</MenuItem>)}
        </TextField>
        <TextField label="Área Inspeccionada" name="area" value={formData.area} onChange={handleChange} fullWidth margin="normal" />
        <TextField select label="Empleado Evaluado (Opcional)" name="employeeId" value={formData.employeeId || ''} onChange={handleChange} fullWidth margin="normal">
          <MenuItem value={null}>Ninguno</MenuItem>
          {employees.map(e => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
        </TextField>
        <Typography gutterBottom sx={{ mt: 2 }}>Puntuación: {formData.score}</Typography>
        <Rating name="score" value={formData.score} max={10} onChange={(e, newValue) => setFormData(prev => ({...prev, score: newValue || 0}))} />
        <TextField label="Comentarios" name="comments" value={formData.comments} onChange={handleChange} fullWidth multiline rows={4} margin="normal" />
        <TextField label="Fecha" name="date" type="date" value={formData.date} onChange={handleChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} />
        <TextField label="Inspector" name="inspectorName" value={formData.inspectorName} fullWidth margin="normal" disabled />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
};


const QADashboard: React.FC<QADashboardProps> = ({ employees, hotels, currentUser }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<QAInspection | null>(null);
  const { inspections, addInspection, updateInspection, deleteInspection } = useQA();

  const employeeNameMap = useMemo(() =>
    employees.reduce((acc, emp) => {
      acc[emp.id] = emp.name;
      return acc;
    }, {} as Record<number, string>)
  , [employees]);

  const handleOpenDialog = (inspection: QAInspection | null = null) => {
    setSelectedInspection(inspection);
    setDialogOpen(true);
  };

  const handleSave = (data: Omit<QAInspection, 'id'> | QAInspection) => {
    if ('id' in data) {
      updateInspection(data);
    } else {
      addInspection(data);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Inspecciones de Calidad (QA)</Typography>
        <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => handleOpenDialog()}>Crear Nueva Inspección</Button>
      </Box>
      {inspections.length === 0 ? (
        <Paper sx={{ textAlign: 'center', p: 4, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            No hay inspecciones para mostrar
          </Typography>
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            Crea una nueva inspección para empezar a evaluar la calidad.
          </Typography>
          <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => handleOpenDialog()}>
            Crear Nueva Inspección
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Hotel</TableCell>
                <TableCell>Área</TableCell>
                <TableCell>Empleado Evaluado</TableCell>
                <TableCell>Puntuación</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inspections.map((insp) => (
                <TableRow key={insp.id}>
                  <TableCell>{insp.hotelName}</TableCell>
                  <TableCell>{insp.area}</TableCell>
                  <TableCell>{insp.employeeId ? employeeNameMap[insp.employeeId] || 'N/A' : 'N/A'}</TableCell>
                  <TableCell><Rating value={insp.score} max={10} readOnly /></TableCell>
                  <TableCell>{insp.date}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(insp)}><EditIcon /></IconButton>
                    <IconButton onClick={() => deleteInspection(insp.id)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <InspectionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        inspection={selectedInspection}
        employees={employees}
        hotels={hotels}
        inspectorName={currentUser?.name || 'N/A'}
      />
    </Box>
  );
};

export default QADashboard;
