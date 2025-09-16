import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';

const SupportView = () => {
  return (
    <Box
      component="form"
      noValidate
      autoComplete="off"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center', // Center horizontally
        justifyContent: 'center', // Center vertically
        minHeight: '100vh', // Ensure it takes full viewport height
        p: 2,
        maxWidth: 400, // Limit width on larger screens
        width: '100%', // Take full width on smaller screens
        margin: '0 auto', // Center the box itself
      }}
    >
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