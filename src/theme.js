import { createTheme } from '@mui/material/styles';

const getAppTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#FF8C00' : '#FFA726', // Darker Orange for light, Lighter Orange for dark
    },
    secondary: {
      main: mode === 'light' ? '#1976D2' : '#90CAF9', // Deep Blue for light, Light Blue for dark
    },
    background: {
      default: mode === 'light' ? '#F5F5F5' : '#121212', // Light Grey for light, Very Dark Grey for dark
      paper: mode === 'light' ? '#FFFFFF' : '#1E1E1E', // White for light, Slightly Lighter Dark Grey for dark
    },
    text: {
      primary: mode === 'light' ? '#212121' : '#E0E0E0', // Dark Grey for light, Light Grey for dark
      secondary: mode === 'light' ? '#757575' : '#B0B0B0', // Medium Grey for light, Medium Light Grey for dark
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
          // This will be handled by palette.background.paper
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          // This will be handled by palette.text.primary
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: mode === 'light' ? '#FF8C00' : '#FFA726', // Use primary color (orange) for icons
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: mode === 'light' ? 'rgba(255, 140, 0, 0.08)' : 'rgba(255, 167, 38, 0.08)', // Light primary color on hover
          },
          '&.Mui-selected': {
            backgroundColor: mode === 'light' ? 'rgba(255, 140, 0, 0.16)' : 'rgba(255, 167, 38, 0.16)', // Slightly darker primary for selected
            '&:hover': {
              backgroundColor: mode === 'light' ? 'rgba(255, 140, 0, 0.24)' : 'rgba(255, 167, 38, 0.24)', // Even darker on hover for selected
            },
          },
        },
      },
    },
  },
});

export default getAppTheme;