import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#16a34a',
      light: '#22c55e',
      dark: '#15803d',
    },
    secondary: {
      main: '#0ea5e9',
    },
    error: {
      main: '#ef4444',
    },
    success: {
      main: '#16a34a',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollBehavior: 'smooth',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          transition: 'box-shadow 0.22s ease, transform 0.22s ease',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

export default theme;
