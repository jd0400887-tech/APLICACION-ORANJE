import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';

const SupportView = () => {
  return (
    <Box component="form" noValidate autoComplete="off" sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>Support</Typography>
      <TextField
        fullWidth
        margin="normal"
        label="Subject"
      />
      <TextField
        fullWidth
        margin="normal"
        label="Describe your issue"
        multiline
        rows={4}
      />
      <Button variant="contained" sx={{ mt: 2 }}>Submit</Button>
    </Box>
  );
};

export default SupportView;