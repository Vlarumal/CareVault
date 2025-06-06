import { createTheme } from '@mui/material/styles';

// Modern healthcare color palette
const theme = createTheme({
  palette: {
    primary: {
      main: '#0a2b4d',
      light: '#0e3a6a',
      dark: '#061d36',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#09390b',
      light: '#0d5c10',
      dark: '#052907',
      contrastText: '#ffffff',
    },
    ...({
      tertiary: {
        main: '#6a5acd',
        light: '#9370db',
        dark: '#483d8b',
        contrastText: '#ffffff',
      },
    } as { tertiary: { main: string; light: string; dark: string; contrastText: string } }),
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#121212',
      secondary: '#1a2329',
    },
    error: {
      main: '#e53935',
    },
    warning: {
      main: '#ffb300',
    },
    info: {
      main: '#1e88e5',
    },
    success: {
      main: '#43a047',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontSize: '3rem',
      fontWeight: 800,
      letterSpacing: '-1px',
      lineHeight: 1.1,
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 700,
      letterSpacing: '-0.5px',
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 700,
      letterSpacing: '-0.25px',
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '0px',
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '0.25px',
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.1rem',
      fontWeight: 600,
      letterSpacing: '0.5px',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.75px',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      letterSpacing: '0.15px',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      letterSpacing: '0.1px',
    },
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  transitions: {
    duration: {
      short: 250,
      standard: 300,
      complex: 375,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
          border: 'none',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
          },
        },
      },
    },
  },
});

export default theme;