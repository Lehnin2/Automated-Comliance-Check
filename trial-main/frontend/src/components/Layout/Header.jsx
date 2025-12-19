import { useState, useEffect } from 'react';
import { AppBar, Toolbar, Box, Button, IconButton, Container, Typography } from '@mui/material';
import { Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';
import { ODDO_COLORS } from '../../utils/oddoColors';

const Header = ({ onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('landing');

  const menuItems = [
    { label: 'Home', view: 'landing' },
    { label: 'About', view: 'about' },
    { label: 'Technologies', view: 'technologies' },
    { label: 'Services', view: 'services' },
    { label: 'Contact', view: 'contact' },
  ];

  // Détecter la section active lors du scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['about', 'technologies', 'services', 'contact'];
      const scrollPosition = window.scrollY + 100; // Offset pour le header
      
      // Vérifier si on est en haut de la page
      if (scrollPosition < 200) {
        setActiveSection('landing');
        return;
      }
      
      // Vérifier quelle section est visible
      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            return;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Vérifier la position initiale
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Calculer l'offset pour compenser la hauteur du header fixe
      const headerHeight = 80; // Hauteur approximative du header
      const elementPosition = element.offsetTop - headerHeight;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleMenuClick = (view) => {
    // Si on clique sur About/Services/Contact, on scroll vers la section
    if (view === 'about' || view === 'technologies' || view === 'services' || view === 'contact') {
      // Vérifier si l'élément existe déjà (on est sur la page d'accueil)
      const element = document.getElementById(view);
      
      if (element) {
        // On est déjà sur la page d'accueil, scroll directement
        scrollToSection(view);
      } else {
        // On n'est pas sur la page d'accueil, naviguer d'abord
        if (onNavigate) {
          onNavigate('landing');
        }
        
        // Attendre que la page se charge puis scroller
        setTimeout(() => {
          scrollToSection(view);
        }, 300);
      }
    } else {
      // Pour les autres vues (landing, upload), navigation normale
      if (onNavigate) {
        onNavigate(view);
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={1}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(15px)',
        borderBottom: `1px solid ${ODDO_COLORS.lightGray}`,
        zIndex: 1300,
      }}
    >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ py: 1, justifyContent: 'space-between', minHeight: '64px' }}>
            {/* Logo Section - Homogène sur toutes les pages */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
                '&:hover': { 
                  opacity: 0.8,
                },
                transition: 'opacity 0.2s ease',
              }}
              onClick={() => handleMenuClick('landing')}
            >
              {/* Logo VeriDeck */}
              <Box
                component="img"
                src="/assets/images/logos/logo.PNG"
                alt="VeriDeck"
                onError={(e) => {
                  // Fallback si le logo n'existe pas
                  e.target.style.display = 'none';
                }}
                sx={{
                  height: 40,
                  objectFit: 'contain',
                  borderRadius: '16px', // rounded-2xl equivalent
                }}
              />

              {/* Nom VeriDeck - Homogène */}
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                  fontWeight: 700,
                  color: ODDO_COLORS.primary,
                  fontFamily: '"Inter", "Segoe UI", sans-serif',
                  letterSpacing: '-0.02em',
                }}
              >
                VeriDeck
              </Typography>
            </Box>

            {/* Desktop Menu - Homogène sur toutes les pages */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
              {menuItems.map((item) => {
                const isActive = activeSection === item.view || 
                               (item.view === 'landing' && activeSection === 'landing');
                
                return (
                  <Button
                    key={item.label}
                    onClick={() => handleMenuClick(item.view)}
                    sx={{
                      color: isActive ? ODDO_COLORS.primary : ODDO_COLORS.textPrimary,
                      fontWeight: isActive ? 600 : 500,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontFamily: '"Inter", "Segoe UI", sans-serif',
                      px: 2,
                      py: 1,
                      borderRadius: '8px',
                      position: 'relative',
                      '&:hover': {
                        backgroundColor: `${ODDO_COLORS.primary}10`,
                        color: ODDO_COLORS.primary,
                      },
                      // Indicateur de section active
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        width: isActive ? '80%' : '0%',
                        height: '2px',
                        backgroundColor: ODDO_COLORS.primary,
                        transform: 'translateX(-50%)',
                        transition: 'width 0.3s ease',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
              
              {/* Get Started Button - Homogène */}
              <Button
                variant="contained"
                onClick={() => handleMenuClick('upload')}
                sx={{
                  ml: 2,
                  background: ODDO_COLORS.gradientPrimary,
                  color: 'white',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontFamily: '"Inter", "Segoe UI", sans-serif',
                  px: 3,
                  py: 1,
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(196, 30, 58, 0.3)',
                  '&:hover': {
                    background: ODDO_COLORS.primaryDark,
                    boxShadow: '0 6px 20px rgba(196, 30, 58, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Get Started
              </Button>
            </Box>

            {/* Mobile Menu Button - Homogène */}
            <IconButton
              sx={{ 
                display: { xs: 'flex', md: 'none' }, 
                color: ODDO_COLORS.primary,
                '&:hover': {
                  backgroundColor: `${ODDO_COLORS.primary}10`,
                },
                transition: 'all 0.2s ease',
              }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          </Toolbar>

          {/* Mobile Menu - Homogène */}
          {mobileMenuOpen && (
            <Box
              sx={{
                display: { xs: 'flex', md: 'none' },
                flexDirection: 'column',
                gap: 1,
                pb: 2,
                px: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(15px)',
                borderTop: `1px solid ${ODDO_COLORS.lightGray}`,
              }}
            >
              {menuItems.map((item) => (
                <Button
                  key={item.label}
                  onClick={() => handleMenuClick(item.view)}
                  fullWidth
                  sx={{
                    color: ODDO_COLORS.textPrimary,
                    fontWeight: 500,
                    textTransform: 'none',
                    justifyContent: 'flex-start',
                    py: 1.5,
                    px: 2,
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                    '&:hover': {
                      backgroundColor: `${ODDO_COLORS.primary}10`,
                      color: ODDO_COLORS.primary,
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {item.label}
                </Button>
              ))}
              <Button
                variant="contained"
                onClick={() => handleMenuClick('upload')}
                fullWidth
                sx={{
                  mt: 1,
                  background: ODDO_COLORS.gradientPrimary,
                  color: 'white',
                  fontWeight: 600,
                  textTransform: 'none',
                  py: 1.5,
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontFamily: '"Inter", "Segoe UI", sans-serif',
                  boxShadow: '0 4px 12px rgba(196, 30, 58, 0.3)',
                  '&:hover': {
                    background: ODDO_COLORS.primaryDark,
                    boxShadow: '0 6px 20px rgba(196, 30, 58, 0.4)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Get Started
              </Button>
            </Box>
          )}
        </Container>
      </AppBar>
  );
};

export default Header;

