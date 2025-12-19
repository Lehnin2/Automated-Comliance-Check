import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import { Shield, FileSearch, Zap, Users, BarChart3, Lock, CheckCircle, TrendingUp } from 'lucide-react';
import { MODULES } from '../../utils/constants';
import { ODDO_COLORS } from '../../utils/oddoColors';

const ServicesSection = () => {
  const features = [
    {
      icon: <Shield size={32} />,
      title: 'Complete Coverage',
      description: 'ESG, disclaimers, performance, structure, and more - all checked automatically.',
      color: ODDO_COLORS.primary,
    },
    {
      icon: <FileSearch size={32} />,
      title: 'Smart Analysis',
      description: 'Our AI understands context, not just keywords. Fewer false positives, more accuracy.',
      color: ODDO_COLORS.accent,
    },
    {
      icon: <Zap size={32} />,
      title: 'Save Hours',
      description: 'What used to take hours of manual review now takes minutes. Time is money.',
      color: ODDO_COLORS.primary,
    },
    {
      icon: <Users size={32} />,
      title: 'Clear Guidance',
      description: 'Every issue comes with a clear explanation and how to fix it. No guesswork.',
      color: ODDO_COLORS.accent,
    },
  ];

  const steps = [
    { step: '1', title: 'Upload', desc: 'Drop your PowerPoint and metadata file', icon: <FileSearch size={24} /> },
    { step: '2', title: 'Preview', desc: 'See your slides and pick which checks to run', icon: <BarChart3 size={24} /> },
    { step: '3', title: 'Analyze', desc: 'Our AI scans every slide for issues', icon: <TrendingUp size={24} /> },
    { step: '4', title: 'Fix', desc: 'Get a clear list of what needs attention', icon: <Lock size={24} /> },
  ];

  return (
    <Box
      id="services"
      sx={{
        py: { xs: 8, md: 12 },
        background: `linear-gradient(135deg, ${ODDO_COLORS.bgSecondary} 0%, ${ODDO_COLORS.bgPrimary} 100%)`,
      }}
    >
      <Container maxWidth="lg">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Stack spacing={2} textAlign="center" mb={8}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '2rem', md: '3rem' },
                fontWeight: 700,
                color: ODDO_COLORS.primary,
                mb: 2,
              }}
            >
              Our Services
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '1rem', md: '1.25rem' },
                fontWeight: 400,
                color: ODDO_COLORS.textSecondary,
                maxWidth: '700px',
                mx: 'auto',
              }}
            >
              Comprehensive compliance validation across 8 specialized modules
            </Typography>
          </Stack>
        </motion.div>

        {/* Features Grid */}
        <Grid container spacing={4} mb={10}>
          {features.map((feature, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    boxShadow: ODDO_COLORS.shadowSmall,
                    border: `1px solid ${ODDO_COLORS.lightGray}`,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: ODDO_COLORS.shadowLarge,
                      borderColor: feature.color,
                    },
                  }}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        p: 2,
                        borderRadius: 2,
                        background: `${feature.color}10`,
                        mb: 2,
                        color: feature.color,
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: ODDO_COLORS.textPrimary, mb: 1 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: ODDO_COLORS.textSecondary, lineHeight: 1.6 }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Compliance Modules */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: '1.75rem', md: '2.5rem' },
              fontWeight: 700,
              color: ODDO_COLORS.primary,
              textAlign: 'center',
              mb: 4,
            }}
          >
            Compliance Modules
          </Typography>
          <Grid container spacing={2}>
            {MODULES.map((module, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <Card
                    sx={{
                      borderRadius: 2,
                      boxShadow: ODDO_COLORS.shadowSmall,
                      border: `1px solid ${ODDO_COLORS.lightGray}`,
                      transition: 'all 0.3s',
                      '&:hover': {
                        borderColor: ODDO_COLORS.primary,
                        boxShadow: ODDO_COLORS.shadowMedium,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            background: ODDO_COLORS.gradientPrimary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                          }}
                        >
                          {idx + 1}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: ODDO_COLORS.textPrimary, fontSize: '1rem' }}>
                            {module.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: ODDO_COLORS.textSecondary, fontSize: '0.875rem' }}>
                            {module.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ mt: 10, textAlign: 'center' }}>
            <Typography
              variant="h3"
              sx={{
                fontSize: { xs: '1.75rem', md: '2.5rem' },
                fontWeight: 700,
                color: ODDO_COLORS.primary,
                mb: 6,
              }}
            >
              How It Works
            </Typography>
            <Grid container spacing={4}>
              {steps.map((item, idx) => (
                <Grid item xs={12} sm={6} md={3} key={idx}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        borderRadius: 3,
                        boxShadow: ODDO_COLORS.shadowMedium,
                        border: `2px solid ${ODDO_COLORS.primary}20`,
                        background: 'white',
                        textAlign: 'center',
                        p: 3,
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          borderColor: ODDO_COLORS.primary,
                          boxShadow: ODDO_COLORS.shadowLarge,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          background: ODDO_COLORS.gradientPrimary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '1.5rem',
                          boxShadow: ODDO_COLORS.shadowMedium,
                        }}
                      >
                        {item.step}
                      </Box>
                      <Box sx={{ color: ODDO_COLORS.primary, mb: 1, display: 'flex', justifyContent: 'center' }}>
                        {item.icon}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: ODDO_COLORS.textPrimary, mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: ODDO_COLORS.textSecondary }}>
                        {item.desc}
                      </Typography>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ServicesSection;

