import React, { useState } from 'react';
import { Button, Modal, Box } from '@mui/material';
import CandidateSubmissionForm from './CandidateSubmissionForm';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%', // Ajusta el ancho para pantallas pequeñas
  maxWidth: 600, // Ancho máximo para pantallas grandes
  maxHeight: '90vh', // Altura máxima para evitar desbordamiento
  overflowY: 'auto', // Habilitar scroll si el contenido es muy largo
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const WorkWithUsButton = () => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Button variant="contained" color="primary" onClick={handleOpen}>
        Quieres trabajar con nosotros
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box sx={style}>
          <CandidateSubmissionForm onClose={handleClose} />
        </Box>
      </Modal>
    </>
  );
};

export default WorkWithUsButton;
