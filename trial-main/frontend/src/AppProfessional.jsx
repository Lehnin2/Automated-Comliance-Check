import React, { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Box } from '@mui/material';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import HeroSection from './components/Sections/HeroSection';
import AboutSection from './components/Sections/AboutSection';
import TechnologiesSection from './components/Sections/TechnologiesSection';
import ServicesSection from './components/Sections/ServicesSection';
import ContactSection from './components/Sections/ContactSection';
import UploadView from './components/Upload/UploadView';
import ProcessingView from './components/Processing/ProcessingView';
import { ODDO_COLORS } from './utils/oddoColors';
import { VIEWS } from './utils/constants';
import AppEnhanced from './AppEnhanced';

// Create Material UI theme with ODDO BHF colors
const theme = createTheme({
  palette: {
    primary: {
      main: ODDO_COLORS.primary,
      dark: ODDO_COLORS.primaryDark,
      light: ODDO_COLORS.primaryLight,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: ODDO_COLORS.secondary,
      contrastText: ODDO_COLORS.primary,
    },
    background: {
      default: ODDO_COLORS.bgPrimary,
      paper: ODDO_COLORS.bgPrimary,
    },
    text: {
      primary: ODDO_COLORS.textPrimary,
      secondary: ODDO_COLORS.textSecondary,
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 800,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

function AppProfessional() {
  const [currentView, setCurrentView] = useState(VIEWS.LANDING);

  const handleNavigate = (view) => {
    setCurrentView(view);
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If it's a functional view (upload, processing, results, etc.), use AppEnhanced
  if ([VIEWS.UPLOAD, VIEWS.PREVIEW, VIEWS.PROCESSING, VIEWS.RESULTS, VIEWS.HISTORY, VIEWS.JSON_VIEWER, VIEWS.HISTORY_DETAIL].includes(currentView)) {
    return <AppEnhanced initialView={currentView} onNavigate={handleNavigate} />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header onNavigate={handleNavigate} />
        
        <Box component="main" sx={{ flexGrow: 1 }}>
          {currentView === VIEWS.LANDING && (
            <>
              <HeroSection onGetStarted={(view) => handleNavigate(view || VIEWS.UPLOAD)} />
              <AboutSection />
              <TechnologiesSection />
              <ServicesSection />
              <ContactSection />
            </>
          )}
          
          {currentView === 'about' && (
            <>
              <Box sx={{ pt: 10, pb: 4 }}>
                <AboutSection />
              </Box>
              <ServicesSection />
              <ContactSection />
            </>
          )}
          
          {currentView === 'services' && (
            <>
              <Box sx={{ pt: 10, pb: 4 }}>
                <ServicesSection />
              </Box>
              <AboutSection />
              <ContactSection />
            </>
          )}
          
          {currentView === 'contact' && (
            <Box sx={{ pt: 10, pb: 4 }}>
              <ContactSection />
            </Box>
          )}
        </Box>
        
        <Footer />
      </Box>
    </ThemeProvider>
  );
}

export default AppProfessional;

