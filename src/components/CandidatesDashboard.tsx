import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  useTheme
} from '@mui/material';
import { Candidate } from '../data/database';
import { getDisplayImage } from '../utils/imageUtils';

interface CandidatesDashboardProps {
  candidates: Candidate[];
  onPromoteCandidate: (candidateId: number) => void;
}

function CandidatesDashboard({ candidates, onPromoteCandidate }: CandidatesDashboardProps) {
  const theme = useTheme();

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
      <Grid container spacing={3}>
        {candidates.map((candidate) => (
          <Grid key={candidate.id} xs={12} sm={6} md={4}> {/* Removed 'item' prop */}
            <Card sx={{ textAlign: 'center' }}>
              <Box sx={{ pt: 3 }}>
                <Avatar
                  alt={`Foto de ${candidate.name}`}
                  src={getDisplayImage(candidate.imageUrl, 'person')}
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
                  onClick={() => onPromoteCandidate(candidate.id)}
                  sx={mainButtonStyles}
                >
                  Contratar
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      {candidates.length === 0 && (
        <Typography sx={{ mt: 4, textAlign: 'center' }}>
          No hay candidatos disponibles en este momento.
        </Typography>
      )}
    </Box>
  );
}

export default CandidatesDashboard;