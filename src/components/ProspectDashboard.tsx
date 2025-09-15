import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Divider,
  Link,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';
import { Hotel, uploadContract, updateHotelContractUrl } from '../data/database';

interface ProspectDashboardProps {
  hotel: Hotel;
  onBack: () => void;
}

function ProspectDashboard({ hotel, onBack }: ProspectDashboardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  // Local state to track the URL, to update the UI immediately after upload
  const [contractUrl, setContractUrl] = useState(hotel.contract_url);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Por favor, selecciona un archivo primero.');
      return;
    }

    setIsUploading(true);
    const publicUrl = await uploadContract(selectedFile);

    if (publicUrl) {
      await updateHotelContractUrl(hotel.id, publicUrl);
      setContractUrl(publicUrl); // Update local state to show the new link
      setSelectedFile(null); // Clear the file input
      alert('Contrato subido con éxito.');
    } else {
      alert('Error al subir el contrato.');
    }

    setIsUploading(false);
  };

  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{ mb: 2 }}
      >
        Volver a la lista de Hoteles
      </Button>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {hotel.name} (Prospecto)
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6">Información de Contacto</Typography>
            <Typography><strong>Gerente General:</strong> {hotel.generalManager}</Typography>
            <Typography><strong>Teléfono:</strong> {hotel.contact}</Typography>
            <Typography><strong>Email:</strong> {hotel.email}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6">Ubicación</Typography>
            <Typography><strong>Dirección:</strong> {hotel.address}</Typography>
            <Typography><strong>Ciudad:</strong> {hotel.city}</Typography>
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />
        <Box>
          <Typography variant="h6" gutterBottom>
            Contrato del Hotel
          </Typography>
          {contractUrl ? (
            <Box>
              <Typography>Contrato ya subido. Puedes verlo aquí:</Typography>
              <Link href={contractUrl} target="_blank" rel="noopener noreferrer">
                {contractUrl}
              </Link>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Sube una copia del contrato firmado con el hotel.
              </Typography>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                style={{ display: 'block', marginBottom: '1rem' }}
              />
              {selectedFile && <Typography sx={{ mb: 1 }}>Archivo seleccionado: {selectedFile.name}</Typography>}
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={isUploading || !selectedFile}
              >
                {isUploading ? <CircularProgress size={24} /> : 'Subir Contrato'}
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default ProspectDashboard;
