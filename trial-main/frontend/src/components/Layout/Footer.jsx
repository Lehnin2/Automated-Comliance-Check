import { Box, Container, Typography, Grid, Stack, Link, IconButton } from '@mui/material';
import { Linkedin, Mail, Phone } from 'lucide-react';
import { BRAND } from '../../utils/constants';
import { ODDO_COLORS } from '../../utils/oddoColors';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        background: ODDO_COLORS.dark,
        color: 'white',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand Section */}
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {/* Logo VeriDeck */}
                <Box
                  component="img"
                  src="/assets/images/logos/logo.PNG"
                  alt="VeriDeck"
                  onError={(e) => {
                    // Fallback vers le logo V si l'image n'existe pas
                    console.log('Logo VeriDeck failed to load, showing fallback');
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                  sx={{
                    height: 50,
                    objectFit: 'contain',
                    borderRadius: '16px', // rounded-2xl equivalent
                  }}
                />
                {/* Fallback logo V */}
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: '16px', // rounded-2xl equivalent
                    background: ODDO_COLORS.gradientPrimary,
                    display: 'none', // Caché par défaut, s'affiche si le logo ne se charge pas
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                  }}
                >
                  V
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
                  {BRAND.name}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.8 }}>
                {BRAND.slogan}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Designed for {BRAND.company}
              </Typography>
            </Stack>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'white' }}>
              Quick Links
            </Typography>
            <Stack spacing={1}>
              {['Home', 'About', 'Services', 'Contact'].map((link) => (
                <Link
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    '&:hover': {
                      color: ODDO_COLORS.primaryLight,
                      textDecoration: 'underline',
                    },
                    transition: 'color 0.2s',
                  }}
                >
                  {link}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Contact */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'white' }}>
              Contact
            </Typography>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Mail size={16} color="rgba(255, 255, 255, 0.7)" />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  contact@verideck.com
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Phone size={16} color="rgba(255, 255, 255, 0.7)" />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  +33 1 44 51 85 00
                </Typography>
              </Stack>
            </Stack>
          </Grid>

          {/* Social */}
          <Grid item xs={12} md={3}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'white' }}>
              Follow Us
            </Typography>
            <Stack direction="row" spacing={2}>
              <IconButton
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    color: ODDO_COLORS.primaryLight,
                    borderColor: ODDO_COLORS.primaryLight,
                    background: 'rgba(196, 30, 58, 0.1)',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <Linkedin size={20} />
              </IconButton>
            </Stack>
          </Grid>
        </Grid>

        {/* Copyright */}
        <Box
          sx={{
            mt: 6,
            pt: 4,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved. | Designed for {BRAND.company}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;

