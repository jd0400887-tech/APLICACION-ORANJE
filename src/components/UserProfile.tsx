import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Container, Paper, Typography, Box, Avatar, Button, CircularProgress } from '@mui/material';
import { uploadProfilePicture, Employee } from '../data/database';

interface UserProfileProps {
  onUpdateEmployee: (employee: Employee) => Promise<void>;
}

const UserProfile: React.FC<UserProfileProps> = ({ onUpdateEmployee }) => {
  const { currentUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploading(true);
    try {
      const newImageUrl = await uploadProfilePicture(file);
      if (newImageUrl) {
        // Assuming currentUser has all the necessary fields of an Employee
        const updatedEmployee = { ...currentUser, image_url: newImageUrl } as Employee;
        await onUpdateEmployee(updatedEmployee);
        // The AuthContext refresh is handled in the parent component (AuthenticatedAppContent)
      } else {
        // Handle upload error (e.g., show a notification)
        console.error("Failed to upload image.");
      }
    } catch (error) {
      console.error("Error during file upload process:", error);
    }
    setIsUploading(false);
  };

  if (!currentUser) {
    return null; // Or a loading spinner
  }

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ mt: 8, p: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar 
              src={currentUser.image_url} 
              sx={{ 
                width: 120, 
                height: 120, 
                mb: 2, 
                cursor: 'pointer',
                border: '3px solid',
                borderColor: 'primary.main'
              }}
              onClick={handleAvatarClick}
            />
            {isUploading && (
              <CircularProgress 
                size={130} 
                sx={{ 
                  position: 'absolute', 
                  top: -5, 
                  left: -5, 
                  zIndex: 1, 
                  color: 'primary.main' 
                }}
              />
            )}
          </Box>
          <Button 
            variant="contained" 
            onClick={handleAvatarClick} 
            disabled={isUploading}
          >
            {isUploading ? 'Subiendo...' : 'Cambiar Foto'}
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            hidden 
            accept="image/*" 
            onChange={handleFileChange} 
          />
          <Box sx={{ textAlign: 'center', mt: 2 }}>
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