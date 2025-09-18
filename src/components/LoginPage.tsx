import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import { useAuth } from '../context/AuthContext';
import { Container, Paper, TextField, Button, Typography, Box } from '@mui/material';
import { supabase } from '../supabaseClient';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) {
        setError(signInError.message);
      } else if (data.user) {
        const appLoginSuccess = await login(data.user.email || '');
        
        if (appLoginSuccess) {
          navigate('/');
        } else {
          setError('Authentication successful, but user profile not found in the application.');
          supabase.auth.signOut();
        }
      } else {
        setError('An unexpected error occurred during login.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to the server.');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Typography color="error" variant="body2" align="center">
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
          
          <Link to="/candidate-submission" style={{ textDecoration: 'none' }}>
            <Button
              fullWidth
              variant="text"
              sx={{ mt: 1, mb: 2 }}
            >
              ¿Quieres trabajar con nosotros? Envía tu CV
            </Button>
          </Link>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;
