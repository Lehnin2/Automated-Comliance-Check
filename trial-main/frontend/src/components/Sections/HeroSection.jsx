import React from 'react';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { ODDO_COLORS } from '../../utils/oddoColors';

const HeroSection = ({ onGetStarted }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${ODDO_COLORS.primary} 0%, ${ODDO_COLORS.primaryDark} 50%, ${ODDO_COLORS.primary} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        pt: 10,
        pb: 6,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={4} alignItems="center" textAlign="center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 3,
                py: 1,
                borderRadius: 25,
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <Sparkles size={16} color="white" />
              <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                Powered by ODDO BHF
              </Typography>
            </Box>
          </motion.div>

          {/* Main Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '3rem', md: '5rem', lg: '6rem' },
                fontWeight: 800,
                color: 'white',
                lineHeight: 1.1,
                mb: 2,
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              }}
            >
              VeriDeck
            </Typography>
          </motion.div>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: '1.5rem', md: '2rem' },
                fontWeight: 300,
                color: 'rgba(255, 255, 255, 0.95)',
                mb: 2,
                maxWidth: '800px',
              }}
            >
              Smarter automation for compliance verification
            </Typography>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '1rem', md: '1.25rem' },
                fontWeight: 400,
                color: 'rgba(255, 255, 255, 0.85)',
                mb: 4,
                maxWidth: '700px',
                lineHeight: 1.6,
              }}
            >
              Automated regulatory compliance validation for financial presentations.
              Ensure your documents meet all regulatory requirements with AI-powered precision.
            </Typography>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                onClick={() => onGetStarted && onGetStarted('upload')}
                endIcon={<ArrowRight size={20} />}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  borderRadius: 3,
                  background: 'white',
                  color: ODDO_COLORS.primary,
                  textTransform: 'none',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.95)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)',
                  },
                  transition: 'all 0.3s',
                }}
              >
                Start Compliance Check
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => onGetStarted && onGetStarted('history')}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 3,
                  borderColor: 'white',
                  color: 'white',
                  textTransform: 'none',
                  borderWidth: 2,
                  '&:hover': {
                    borderColor: 'white',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 2,
                  },
                  transition: 'all 0.3s',
                }}
              >
                View History
              </Button>
            </Stack>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={4}
              sx={{ mt: 6, color: 'rgba(255, 255, 255, 0.9)' }}
            >
              {[
                { label: '8 Compliance Modules', icon: '✓' },
                { label: '140+ Validation Rules', icon: '✓' },
                { label: 'AI-Powered Analysis', icon: '✓' },
              ].map((item, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </motion.div>
        </Stack>
      </Container>
    </Box>
  );
};

export default HeroSection;

