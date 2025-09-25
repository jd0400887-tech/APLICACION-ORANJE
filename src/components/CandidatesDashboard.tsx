import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import { Candidate } from '../data/database';
import { getDisplayImage } from '../utils/imageUtils';

interface CandidatesDashboardProps {
  candidates: Candidate[];
  onPromoteCandidateWithCredentials: (candidateId: number) => Promise<void>; // Simplified signature
}

function CandidatesDashboard({ candidates, onPromoteCandidateWithCredentials }: CandidatesDashboardProps) {
  const theme = useTheme();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [error, setError] = useState('');

  const [openDetailsDialog, setOpenDetailsDialog] = useState(false); // New state for details dialog
  const [viewedCandidate, setViewedCandidate] = useState<Candidate | null>(null); // New state for viewed candidate

  const handleOpenDialog = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCandidate(null);
  };

  const handleOpenDetailsDialog = (candidate: Candidate) => { // New handler for details dialog
    setViewedCandidate(candidate);
    setOpenDetailsDialog(true);
  };

  const handleCloseDetailsDialog = () => { // New handler for details dialog
    setOpenDetailsDialog(false);
    setViewedCandidate(null);
  };

  const handleConfirmPromote = async () => {
    if (selectedCandidate) {
      await onPromoteCandidateWithCredentials(selectedCandidate.id); // Simplified call
      handleCloseDialog();
    }
  };

  const mainButtonStyles = {
    transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
    '&:hover': {
      transform: 'scale(1.05)',
      boxShadow: theme.shadows[6],
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Módulo de Candidatos
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        {candidates.map((candidate) => (
          <Box key={candidate.id}>
            <Card 
              sx={{ textAlign: 'center', cursor: 'pointer' }} // Added cursor and click handler
              onClick={() => handleOpenDetailsDialog(candidate)}
            >
              <Box sx={{ pt: 3 }}>
                <Avatar
                  alt={`Foto de ${candidate.name}`}
                  sx={{ width: 150, height: 150, margin: 'auto' }}
                />
              </Box>
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  {candidate.name}
                </Typography>
                <Typography variant="body1" color="text.primary" component="p">
                  {candidate.position}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {candidate.city}, {candidate.country}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button 
                  size="small" 
                  variant="contained"
                  onClick={(e) => { e.stopPropagation(); handleOpenDialog(candidate); }} // Stop propagation for button click
                  sx={mainButtonStyles}
                >
                  Contratar
                </Button>
              </CardActions>
            </Card>
          </Box>
        ))}
      </Box>
      {candidates.length === 0 && (
        <Typography sx={{ mt: 4, textAlign: 'center' }}>
          No hay candidatos disponibles en este momento.
        </Typography>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Confirmar Contratación</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography>
            ¿Estás seguro de que quieres contratar a {selectedCandidate?.name}?
            Se creará un usuario con su email y una contraseña derivada de su número de teléfono.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleConfirmPromote}>Confirmar</Button>
        </DialogActions>
      </Dialog>

      {/* New Dialog for Candidate Details */}
      <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Detalles del Candidato</DialogTitle>
        <DialogContent dividers>
          {viewedCandidate && (
            <Box>
              <Typography variant="h6" gutterBottom>{viewedCandidate.name}</Typography>
              <Typography variant="body1"><strong>Email:</strong> {viewedCandidate.email}</Typography>
              <Typography variant="body1"><strong>Teléfono:</strong> {viewedCandidate.phone}</Typography>
              <Typography variant="body1"><strong>Fecha de Nacimiento:</strong> {viewedCandidate.dob}</Typography>
              <Typography variant="body1"><strong>Posición:</strong> {viewedCandidate.position}</Typography>
              <Typography variant="body1"><strong>Dirección:</strong> {viewedCandidate.address}, {viewedCandidate.city}, {viewedCandidate.state}, {viewedCandidate.zip}, {viewedCandidate.country}</Typography>
              {/* Add more fields as needed */}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CandidatesDashboard;