import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#FF8C00', // Darker Orange
    },
    secondary: {
      main: '#4caf50', // Material Green 500
    },
    background: {
      default: '#f4f6f8', // Light grey background for the main content area
      paper: '#ffffff', // White background for surfaces like Drawer
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          // Primary color will apply automatically
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF', // White for Drawer background
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: '#333333', // Darker text for better contrast on white background
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: '#1976d2', // Use primary color for icons
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 140, 0, 0.08)', // Light primary color on hover
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 140, 0, 0.16)', // Slightly darker primary for selected
            '&:hover': {
              backgroundColor: 'rgba(255, 140, 0, 0.24)', // Even darker on hover for selected
            },
          },
        },
      },
    },
  },
});

export default theme;
