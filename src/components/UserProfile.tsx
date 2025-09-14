
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Container, Paper, Typography, Box, Avatar } from '@mui/material';

const UserProfile: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return null; // Or a loading spinner
  }

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ mt: 8, p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar src={currentUser.imageUrl} sx={{ width: 80, height: 80, mr: 2 }} />
          <Box>
            <Typography component="h1" variant="h4">
              {currentUser.name}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {currentUser.role}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body1"><strong>Email:</strong> {currentUser.email}</Typography>
        <Typography variant="body1"><strong>Phone:</strong> {currentUser.phone}</Typography>
        <Typography variant="body1"><strong>Country:</strong> {currentUser.country}</Typography>
        <Typography variant="body1"><strong>City:</strong> {currentUser.city}</Typography>
      </Paper>
    </Container>
  );
};

export default UserProfile;
