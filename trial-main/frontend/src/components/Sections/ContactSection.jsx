import React, { useState } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, TextField, Button, Stack, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { ODDO_COLORS } from '../../utils/oddoColors';

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', message: '' });
    }, 3000);
  };

  const contactInfo = [
    {
      icon: <Mail size={24} />,
      title: 'Email',
      content: 'contact@verideck.com',
      link: 'mailto:contact@verideck.com',
    },
    {
      icon: <Phone size={24} />,
      title: 'Phone',
      content: '+33 1 44 51 85 00',
      link: 'tel:+33144518500',
    },
    {
      icon: <MapPin size={24} />,
      title: 'Address',
      content: '12 bd de la Madeleine, 75009 Paris, France',
      link: null,
    },
  ];

  return (
    <Box
      id="contact"
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
              Get In Touch
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
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </Typography>
          </Stack>
        </motion.div>

        <Grid container spacing={4}>
          {/* Contact Info */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {contactInfo.map((info, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Card
                    sx={{
                      borderRadius: 3,
                      boxShadow: ODDO_COLORS.shadowSmall,
                      border: `1px solid ${ODDO_COLORS.lightGray}`,
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateX(8px)',
                        boxShadow: ODDO_COLORS.shadowMedium,
                        borderColor: ODDO_COLORS.primary,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            background: `${ODDO_COLORS.primary}10`,
                            color: ODDO_COLORS.primary,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {info.icon}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: ODDO_COLORS.textPrimary, mb: 0.5 }}>
                            {info.title}
                          </Typography>
                          {info.link ? (
                            <Typography
                              component="a"
                              href={info.link}
                              variant="body2"
                              sx={{
                                color: ODDO_COLORS.primary,
                                textDecoration: 'none',
                                '&:hover': { textDecoration: 'underline' },
                              }}
                            >
                              {info.content}
                            </Typography>
                          ) : (
                            <Typography variant="body2" sx={{ color: ODDO_COLORS.textSecondary }}>
                              {info.content}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </Stack>
          </Grid>

          {/* Contact Form */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card
                sx={{
                  borderRadius: 4,
                  boxShadow: ODDO_COLORS.shadowMedium,
                  border: `1px solid ${ODDO_COLORS.lightGray}`,
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  {submitted ? (
                    <Alert
                      icon={<CheckCircle />}
                      severity="success"
                      sx={{
                        mb: 3,
                        borderRadius: 2,
                        background: `${ODDO_COLORS.success}10`,
                        color: ODDO_COLORS.success,
                        border: `1px solid ${ODDO_COLORS.success}30`,
                      }}
                    >
                      Thank you! Your message has been sent successfully.
                    </Alert>
                  ) : null}
                  <form onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                      <TextField
                        fullWidth
                        label="Your Name"
                        variant="outlined"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': {
                              borderColor: ODDO_COLORS.primary,
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: ODDO_COLORS.primary,
                            },
                          },
                        }}
                      />
                      <TextField
                        fullWidth
                        label="Your Email"
                        type="email"
                        variant="outlined"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': {
                              borderColor: ODDO_COLORS.primary,
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: ODDO_COLORS.primary,
                            },
                          },
                        }}
                      />
                      <TextField
                        fullWidth
                        label="Your Message"
                        multiline
                        rows={6}
                        variant="outlined"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': {
                              borderColor: ODDO_COLORS.primary,
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: ODDO_COLORS.primary,
                            },
                          },
                        }}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        endIcon={<Send size={20} />}
                        sx={{
                          py: 1.5,
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          borderRadius: 2,
                          background: ODDO_COLORS.gradientPrimary,
                          textTransform: 'none',
                          boxShadow: ODDO_COLORS.shadowMedium,
                          '&:hover': {
                            background: ODDO_COLORS.primaryDark,
                            boxShadow: ODDO_COLORS.shadowLarge,
                            transform: 'translateY(-2px)',
                          },
                          transition: 'all 0.3s',
                        }}
                      >
                        Send Message
                      </Button>
                    </Stack>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ContactSection;

