import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Avatar, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import { Users, Target, Building2, Code2 } from 'lucide-react';
import { BRAND } from '../../utils/constants';
import { ODDO_COLORS } from '../../utils/oddoColors';

// Map team member names to actual image filenames
const getTeamMemberImage = (name) => {
  const imageMap = {
    'Selim Manai': '/assets/images/team/selim.jfif',
    'Fida Naimi': '/assets/images/team/fida.jfif',
    'Mohamed Sillini': '/assets/images/team/mohamed.jpg',
    'Ghassen Bousselm': '/assets/images/team/ghassen.jfif',
    'Cyrine Maalel': '/assets/images/team/syrine.jfif',
    'Safa Bachagha': '/assets/images/team/safa.jfif',
  };
  return imageMap[name] || '';
};

const AboutSection = () => {
  const teamMembers = BRAND.team;

  return (
    <Box
      id="about"
      sx={{
        py: { xs: 8, md: 12 },
        background: ODDO_COLORS.bgPrimary,
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
          <Stack spacing={2} textAlign="center" mb={6}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '2rem', md: '3rem' },
                fontWeight: 700,
                color: ODDO_COLORS.primary,
                mb: 2,
              }}
            >
              About VeriDeck
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: '1.1rem', md: '1.5rem' },
                fontWeight: 300,
                color: ODDO_COLORS.textSecondary,
                maxWidth: '800px',
                mx: 'auto',
              }}
            >
              {BRAND.slogan}
            </Typography>
          </Stack>
        </motion.div>

        {/* Mission Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card
            sx={{
              mb: 6,
              borderRadius: 4,
              boxShadow: ODDO_COLORS.shadowMedium,
              border: `1px solid ${ODDO_COLORS.lightGray}`,
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    background: `${ODDO_COLORS.primary}10`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Target size={40} color={ODDO_COLORS.primary} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: ODDO_COLORS.primary, mb: 2 }}>
                    Our Mission
                  </Typography>
                  <Typography variant="body1" sx={{ color: ODDO_COLORS.textSecondary, lineHeight: 1.8, fontSize: '1.1rem' }}>
                    VeriDeck is designed to revolutionize compliance verification in the financial sector.
                    We provide intelligent automation tools that ensure regulatory compliance with precision and efficiency,
                    specifically tailored for {BRAND.company}. Our platform combines advanced AI technology with
                    comprehensive regulatory knowledge to deliver accurate, actionable compliance insights.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Box mb={4}>
            <Stack direction="row" spacing={2} alignItems="center" mb={4}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: `${ODDO_COLORS.primary}10`,
                }}
              >
                <Users size={32} color={ODDO_COLORS.primary} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: ODDO_COLORS.primary }}>
                Our Team
              </Typography>
            </Stack>
          </Box>

          <Grid container spacing={3}>
            {teamMembers.map((member, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
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
                        borderColor: ODDO_COLORS.primary,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                      <Avatar
                        src={getTeamMemberImage(member.name)}
                        alt={member.name}
                        sx={{
                          width: 100,
                          height: 100,
                          mx: 'auto',
                          mb: 2,
                          fontSize: '2rem',
                          fontWeight: 'bold',
                          background: ODDO_COLORS.gradientPrimary,
                          border: `3px solid ${ODDO_COLORS.primary}20`,
                        }}
                      >
                        {member.name.charAt(0)}
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: ODDO_COLORS.textPrimary, mb: 0.5 }}>
                        {member.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: ODDO_COLORS.textSecondary }}>
                        {member.role}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Company Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card
            sx={{
              mt: 6,
              borderRadius: 4,
              boxShadow: ODDO_COLORS.shadowMedium,
              border: `1px solid ${ODDO_COLORS.lightGray}`,
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    background: `${ODDO_COLORS.primary}10`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Building2 size={40} color={ODDO_COLORS.primary} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: ODDO_COLORS.primary, mb: 2 }}>
                    Designed for {BRAND.company}
                  </Typography>
                  <Typography variant="body1" sx={{ color: ODDO_COLORS.textSecondary, lineHeight: 1.8, fontSize: '1.1rem' }}>
                    VeriDeck is specifically developed to meet the compliance requirements of {BRAND.company}.
                    Our solution integrates seamlessly with {BRAND.company}'s workflow, ensuring that all financial
                    presentations meet the highest regulatory standards. We understand the unique challenges faced
                    by financial institutions and have built a platform that addresses them directly.
                  </Typography>
                  <Box
                    component="img"
                    src="/assets/images/company/compani.jpg"
                    alt={BRAND.company}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                    sx={{
                      width: '100%',
                      maxWidth: 600,
                      height: 'auto',
                      borderRadius: 3,
                      mt: 3,
                      boxShadow: ODDO_COLORS.shadowMedium,
                    }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
};

export default AboutSection;

