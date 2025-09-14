import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme'; // Import your custom theme
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { registerServiceWorker } from './utils/pushNotifications';

// Register the service worker
registerServiceWorker();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  </StrictMode>,
)