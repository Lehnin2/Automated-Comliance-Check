import { Box, Container, Typography, Grid, Stack, useTheme, useMediaQuery } from '@mui/material';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Brain, Palette, Server, Sparkles, ArrowUpRight, Zap } from 'lucide-react';
import { BRAND_COLORS } from '../../utils/constants';
import { useState } from 'react';

const TechnologiesSection = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [hoveredTech, setHoveredTech] = useState(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  const techCategories = [
    {
      title: 'Backend & API',
      icon: <Server className="w-8 h-8" />,
      color: BRAND_COLORS.primary,
      gradient: 'linear-gradient(135deg, #C41E3A 0%, #E63950 100%)',
      description: 'Robust server architecture',
      technologies: [
        { 
          name: 'FastAPI', 
          description: 'High-performance async framework', 
          logo: 'fastapi.png',
          features: ['Async/Await', 'Auto Documentation', 'Type Safety']
        },
        { 
          name: 'Python', 
          description: 'Versatile programming language', 
          logo: 'python.png',
          features: ['Machine Learning', 'Data Processing', 'Rapid Development']
        },
        { 
          name: 'Pydantic', 
          description: 'Data validation using Python types', 
          logo: 'pydantic.jpg',
          features: ['Type Validation', 'JSON Schema', 'Error Handling']
        },
        { 
          name: 'Uvicorn', 
          description: 'Lightning-fast ASGI server', 
          logo: 'uvicorn.svg',
          features: ['High Performance', 'WebSocket Support', 'Production Ready']
        }
      ]
    },
    {
      title: 'Frontend & UI',
      icon: <Palette className="w-8 h-8" />,
      color: '#FFD700',
      gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
      description: 'Modern user interfaces',
      technologies: [
        { 
          name: 'React', 
          description: 'Component-based UI library', 
          logo: 'react.png',
          features: ['Virtual DOM', 'Component Reusability', 'Rich Ecosystem']
        },
        { 
          name: 'Material UI', 
          description: 'React component library', 
          logo: 'mui.png',
          features: ['Design System', 'Accessibility', 'Theming']
        },
        { 
          name: 'Framer Motion', 
          description: 'Production-ready motion library', 
          logo: 'framer.png',
          features: ['Smooth Animations', 'Gesture Support', 'Layout Animations']
        },
        { 
          name: 'Tailwind CSS', 
          description: 'Utility-first CSS framework', 
          logo: 'tailwind.svg',
          features: ['Rapid Styling', 'Responsive Design', 'Custom Components']
        }
      ]
    },
    {
      title: 'AI & Machine Learning',
      icon: <Brain className="w-8 h-8" />,
      color: '#9C27B0',
      gradient: 'linear-gradient(135deg, #9C27B0 0%, #E91E63 100%)',
      description: 'Intelligent automation',
      technologies: [
        { 
          name: 'OpenAI', 
          description: 'Advanced language models', 
          logo: 'openai.svg',
          features: ['GPT Integration', 'Natural Language', 'Code Generation']
        },
        { 
          name: 'Gemini', 
          description: 'Google\'s multimodal AI', 
          logo: 'gemini.svg',
          features: ['Multimodal AI', 'Fast Inference', 'Reliable Fallback']
        },
        { 
          name: 'LangGraph', 
          description: 'Multi-agent orchestration', 
          logo: 'langraph.png',
          features: ['Agent Workflows', 'State Management', 'Complex Reasoning']
        },
        { 
          name: 'Groq', 
          description: 'Ultra-fast AI inference', 
          logo: 'groq.png',
          features: ['Lightning Speed', 'Low Latency', 'High Throughput']
        }
      ]
    }
  ];

  return (
    <Box
      id="technologies"
      sx={{
        py: { xs: 12, md: 20 },
        background: `
          radial-gradient(circle at 20% 20%, rgba(196, 30, 58, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(255, 215, 0, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 60%, rgba(156, 39, 176, 0.1) 0%, transparent 50%),
          ${BRAND_COLORS.dark}
        `,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            linear-gradient(45deg, transparent 30%, rgba(255, 215, 0, 0.03) 50%, transparent 70%),
            linear-gradient(-45deg, transparent 30%, rgba(196, 30, 58, 0.03) 50%, transparent 70%)
          `,
          pointerEvents: 'none',
        }
      }}
    >
      {/* Floating Elements */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 pointer-events-none"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            right: '10%',
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255, 215, 0, 0.1)',
            filter: 'blur(40px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '20%',
            left: '15%',
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(196, 30, 58, 0.1)',
            filter: 'blur(30px)',
          }}
        />
      </motion.div>

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Stack spacing={4} textAlign="center" mb={16}>
            {/* Premium Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 4,
                  py: 2,
                  borderRadius: '50px',
                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%)',
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  backdropFilter: 'blur(10px)',
                  color: '#FFD700',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  mx: 'auto',
                  width: 'fit-content',
                  boxShadow: '0 8px 32px rgba(255, 215, 0, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(255, 215, 0, 0.2)',
                  }
                }}
              >
                <Zap size={18} />
                Powered by Modern Tech Stack
                <ArrowUpRight size={16} />
              </Box>
            </motion.div>

            {/* Main Title with Gradient */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '3.5rem', sm: '4.5rem', md: '5.5rem', lg: '6rem' },
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FFD700 50%, #FFFFFF 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 3,
                  lineHeight: 0.9,
                  letterSpacing: '-0.02em',
                  textAlign: 'center',
                }}
              >
                Technologies
              </Typography>
            </motion.div>
            
            {/* Subtitle with Better Typography */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: 'rgba(255, 255, 255, 0.85)',
                  maxWidth: '800px',
                  mx: 'auto',
                  lineHeight: 1.6,
                  fontSize: { xs: '1.2rem', md: '1.4rem', lg: '1.5rem' },
                  fontWeight: 400,
                  letterSpacing: '0.01em',
                }}
              >
                Built with cutting-edge technologies for{' '}
                <Box component="span" sx={{ color: '#FFD700', fontWeight: 600 }}>
                  performance
                </Box>
                ,{' '}
                <Box component="span" sx={{ color: '#FFD700', fontWeight: 600 }}>
                  reliability
                </Box>
                , and{' '}
                <Box component="span" sx={{ color: '#FFD700', fontWeight: 600 }}>
                  scalability
                </Box>
              </Typography>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={4} 
                justifyContent="center" 
                alignItems="center"
                sx={{ mt: 4 }}
              >
                {[
                  { number: '13+', label: 'Technologies' },
                  { number: '3', label: 'Categories' },
                  { number: '100%', label: 'Modern Stack' }
                ].map((stat, index) => (
                  <Box key={index} sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: '#FFD700',
                        fontSize: { xs: '1.8rem', md: '2.2rem' },
                        mb: 0.5,
                      }}
                    >
                      {stat.number}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </motion.div>
          </Stack>
        </motion.div>

        {/* Technology Categories */}
        <Grid container spacing={{ xs: 4, md: 6, lg: 8 }}>
          {techCategories.map((category, categoryIndex) => (
            <Grid item xs={12} lg={4} key={category.title}>
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.8, 
                  delay: categoryIndex * 0.2,
                  ease: "easeOut"
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    p: { xs: 4, md: 6 },
                    borderRadius: '32px',
                    background: `
                      linear-gradient(145deg, 
                        rgba(255, 255, 255, 0.08) 0%, 
                        rgba(255, 255, 255, 0.04) 100%
                      )
                    `,
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: category.gradient,
                      opacity: 0,
                      transition: 'opacity 0.4s ease',
                      borderRadius: '32px',
                    },
                    '&:hover': {
                      transform: 'translateY(-12px) scale(1.02)',
                      boxShadow: `
                        0 25px 50px rgba(0, 0, 0, 0.3),
                        0 0 0 1px rgba(255, 255, 255, 0.2),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1)
                      `,
                      '&::before': {
                        opacity: 0.05,
                      },
                    },
                  }}
                >
                  {/* Gradient Overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '100px',
                      height: '100px',
                      background: `radial-gradient(circle, ${category.color}20 0%, transparent 70%)`,
                      borderRadius: '50%',
                      transform: 'translate(30px, -30px)',
                    }}
                  />

                  {/* Category Header */}
                  <Stack direction="row" alignItems="center" spacing={3} mb={6} sx={{ position: 'relative', zIndex: 1 }}>
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: '20px',
                        background: `linear-gradient(135deg, ${category.color}20 0%, ${category.color}10 100%)`,
                        border: `1px solid ${category.color}30`,
                        color: category.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {category.icon}
                    </Box>
                    <Box>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          color: 'white',
                          fontSize: { xs: '1.3rem', md: '1.5rem' },
                          mb: 0.5,
                        }}
                      >
                        {category.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: '0.9rem',
                        }}
                      >
                        {category.description}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Technologies Grid */}
                  <Grid container spacing={2}>
                    {category.technologies.map((tech, techIndex) => (
                      <Grid item xs={6} key={tech.name}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: 20 }}
                          whileInView={{ opacity: 1, scale: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ 
                            duration: 0.5, 
                            delay: (categoryIndex * 0.1) + (techIndex * 0.1),
                            ease: "easeOut"
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Box
                            onMouseEnter={() => setHoveredTech(`${categoryIndex}-${techIndex}`)}
                            onMouseLeave={() => setHoveredTech(null)}
                            sx={{
                              p: 3,
                              borderRadius: '20px',
                              background: hoveredTech === `${categoryIndex}-${techIndex}` 
                                ? `linear-gradient(135deg, ${category.color}15 0%, ${category.color}08 100%)`
                                : 'rgba(255, 255, 255, 0.04)',
                              border: hoveredTech === `${categoryIndex}-${techIndex}`
                                ? `1px solid ${category.color}40`
                                : '1px solid rgba(255, 255, 255, 0.08)',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              cursor: 'pointer',
                              position: 'relative',
                              overflow: 'hidden',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: `linear-gradient(135deg, ${category.color}10 0%, transparent 100%)`,
                                opacity: hoveredTech === `${categoryIndex}-${techIndex}` ? 1 : 0,
                                transition: 'opacity 0.3s ease',
                              }
                            }}
                          >
                            <Stack spacing={2.5} alignItems="center" textAlign="center" sx={{ position: 'relative', zIndex: 1 }}>
                              {/* Logo with Enhanced Styling */}
                              <Box
                                sx={{
                                  position: 'relative',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Box
                                  component="img"
                                  src={(() => {
                                    const frameworkLogos = {
                                      'Groq': 'groq.png',
                                      'LangGraph': 'langraph.png', 
                                      'React': 'react.png',
                                      'Pydantic': 'pydantic.jpg',
                                      // Added to use images from public/assets/images/framework for Backend stack
                                      'FastAPI': 'fastapi.svg',
                                      'Python': 'python.svg'
                                    };
                                    
                                    if (frameworkLogos[tech.name]) {
                                      return `/assets/images/framework/${frameworkLogos[tech.name]}`;
                                    }
                                    return `/assets/images/tech/${tech.logo}`;
                                  })()}
                                  alt={tech.name}
                                  onError={(e) => {
                                    if (e.target.src.includes('/framework/')) {
                                      e.target.src = `/assets/images/tech/${tech.logo}`;
                                    } else {
                                      e.target.style.display = 'none';
                                    }
                                  }}
                                  sx={{
                                    width: isMobile ? 56 : 64,
                                    height: isMobile ? 56 : 64,
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
                                  }}
                                />
                              </Box>

                              {/* Tech Name & Description */}
                              <Typography
                                variant="subtitle1"
                                sx={{ color: 'white', fontWeight: 700 }}
                              >
                                {tech.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                              >
                                {tech.description}
                              </Typography>
                            </Stack>
                          </Box>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                  {/* End Technologies Grid */}
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
        {/* End Technology Categories */}
      </Container>
    </Box>
  );
};

export default TechnologiesSection;