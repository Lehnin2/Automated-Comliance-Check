import React, { useState, useMemo, useCallback } from 'react';
import { 
  History, Eye, Trash2, CheckCircle, AlertTriangle, Clock, 
  FileText, RefreshCw, Filter, Search, Send,
  TrendingUp, BarChart3, Users, Calendar, ArrowUpRight,
  ChevronDown, ChevronRight, Award, AlertCircle, X, Home
} from 'lucide-react';
import SortButton from './SortButton';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, Container, Typography, Grid, Stack, Chip, 
  TextField, InputAdornment, Tooltip, IconButton,
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Avatar
} from '@mui/material';
import { BRAND_COLORS } from '../../utils/constants';

const HistoryView = ({ 
  historyData = [], 
  historyStats = null, 
  onLoadHistory, 
  onViewJob, 
  onUpdateReview, 
  onDeleteJob,
  onNavigate 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedStats, setExpandedStats] = useState(false);
  
  // Advanced filtering
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Comparison mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareItems, setCompareItems] = useState([]);

  // Advanced filtering and sorting
  const filteredData = useMemo(() => {
    return historyData
      .filter(job => {
        // Basic search
        const matchesSearch = job.filename.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Status filter
        const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
        
        // Date range filter
        const jobDate = new Date(job.created_at);
        const matchesDateRange = (!dateRange.start || jobDate >= dateRange.start) && 
                                (!dateRange.end || jobDate <= dateRange.end);
        
        // File type filter
        const fileExtension = job.filename.split('.').pop().toLowerCase();
        const matchesFileType = fileTypeFilter === 'all' || 
                               (fileTypeFilter === 'pptx' && fileExtension === 'pptx') ||
                               (fileTypeFilter === 'docx' && fileExtension === 'docx') ||
                               (fileTypeFilter === 'other' && !['pptx', 'docx'].includes(fileExtension));
        
        return matchesSearch && matchesStatus && matchesDateRange && matchesFileType;
      })
      .sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'date':
            comparison = new Date(b.created_at) - new Date(a.created_at);
            break;
          case 'violations':
            comparison = (b.total_violations || 0) - (a.total_violations || 0);
            break;
          case 'name':
            comparison = a.filename.localeCompare(b.filename);
            break;
          case 'status':
            comparison = a.status.localeCompare(b.status);
            break;
          default:
            comparison = 0;
        }
        
        return sortOrder === 'desc' ? comparison : -comparison;
      });
  }, [historyData, searchTerm, filterStatus, dateRange, fileTypeFilter, sortBy, sortOrder]);

  // Comparison handlers
  const handleCompareToggle = useCallback((job) => {
    if (compareItems.find(item => item.job_id === job.job_id)) {
      setCompareItems(prev => prev.filter(item => item.job_id !== job.job_id));
    } else if (compareItems.length < 3) {
      setCompareItems(prev => [...prev, job]);
    }
  }, [compareItems]);

  const handleSort = useCallback((field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  }, [sortBy]);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return { 
          color: '#10B981', 
          bg: 'rgba(16, 185, 129, 0.1)', 
          border: 'rgba(16, 185, 129, 0.3)',
          icon: <CheckCircle size={16} />
        };
      case 'failed':
        return { 
          color: '#EF4444', 
          bg: 'rgba(239, 68, 68, 0.1)', 
          border: 'rgba(239, 68, 68, 0.3)',
          icon: <AlertCircle size={16} />
        };
      case 'processing':
      case 'pending':
        return { 
          color: '#F59E0B', 
          bg: 'rgba(245, 158, 11, 0.1)', 
          border: 'rgba(245, 158, 11, 0.3)',
          icon: <Clock size={16} />
        };
      default:
        return { 
          color: '#6B7280', 
          bg: 'rgba(107, 114, 128, 0.1)', 
          border: 'rgba(107, 114, 128, 0.3)',
          icon: <Clock size={16} />
        };
    }
  };

  const getReviewConfig = (reviewStatus) => {
    switch (reviewStatus) {
      case 'validated':
        return { 
          color: '#10B981', 
          bg: 'rgba(16, 185, 129, 0.1)', 
          border: 'rgba(16, 185, 129, 0.3)',
          icon: <Award size={16} />,
          label: 'Validated'
        };
      case 'needs_revision':
        return { 
          color: '#F59E0B', 
          bg: 'rgba(245, 158, 11, 0.1)', 
          border: 'rgba(245, 158, 11, 0.3)',
          icon: <AlertTriangle size={16} />,
          label: 'Needs Revision'
        };
      default:
        return { 
          color: '#8B5CF6', 
          bg: 'rgba(139, 92, 246, 0.1)', 
          border: 'rgba(139, 92, 246, 0.3)',
          icon: <Clock size={16} />,
          label: 'Pending Review'
        };
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${BRAND_COLORS.dark} 0%, ${BRAND_COLORS.primary} 100%)`,
        position: 'relative',
      }}
    >

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, py: 6 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={6}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${BRAND_COLORS.primary}20 0%, #FFD70020 100%)`,
                    border: `1px solid ${BRAND_COLORS.primary}40`,
                  }}
                >
                  <History size={32} color={BRAND_COLORS.primary} />
                </Box>
                <Box>
                  <Typography
                    variant="h2"
                    sx={{
                      fontSize: { xs: '2.5rem', md: '3.5rem' },
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #FFD700 50%, #FFFFFF 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      lineHeight: 1.1,
                    }}
                  >
                    Compliance History
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '1.2rem',
                      fontWeight: 400,
                    }}
                  >
                    Review and manage all compliance checks
                  </Typography>
                </Box>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2}>
              {/* Back to Home (minimal CTA) */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('landing')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Home size={16} />
                Back to Home
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLoadHistory}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={16} />
                Refresh
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('upload')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, #E63950 100%)`,
                  border: 'none',
                  borderRadius: '16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 8px 32px rgba(196, 30, 58, 0.3)',
                }}
              >
                New Check
                <ArrowUpRight size={16} />
              </motion.button>
            </Stack>
          </Stack>
        </motion.div>

        {/* Stats Dashboard */}
        {historyStats && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Box
              sx={{
                mb: 6,
                p: 4,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography
                  variant="h5"
                  sx={{
                    color: 'white',
                    fontWeight: 700,
                  }}
                >
                  Analytics Overview
                </Typography>
                <IconButton
                  onClick={() => setExpandedStats(!expandedStats)}
                  sx={{ color: 'white' }}
                >
                  {expandedStats ? <ChevronDown /> : <ChevronRight />}
                </IconButton>
              </Stack>

              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <StatsCard
                    icon={<BarChart3 size={24} />}
                    value={historyStats.total_jobs || 0}
                    label="Total Jobs"
                    color="#3B82F6"
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <StatsCard
                    icon={<CheckCircle size={24} />}
                    value={historyStats.by_status?.completed || 0}
                    label="Completed"
                    color="#10B981"
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <StatsCard
                    icon={<Clock size={24} />}
                    value={historyStats.by_review?.pending_review || 0}
                    label="Pending Review"
                    color="#F59E0B"
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <StatsCard
                    icon={<Award size={24} />}
                    value={historyStats.by_review?.validated || 0}
                    label="Validated"
                    color="#8B5CF6"
                  />
                </Grid>
              </Grid>

              <AnimatePresence>
                {expandedStats && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Grid container spacing={3} sx={{ mt: 2 }}>
                      <Grid item xs={6} sm={3}>
                        <StatsCard
                          icon={<TrendingUp size={24} />}
                          value={historyStats.by_status?.processing || 0}
                          label="Processing"
                          color="#06B6D4"
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <StatsCard
                          icon={<AlertTriangle size={24} />}
                          value={historyStats.by_review?.needs_revision || 0}
                          label="Needs Revision"
                          color="#F97316"
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <StatsCard
                          icon={<Users size={24} />}
                          value="12"
                          label="Active Users"
                          color="#EC4899"
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <StatsCard
                          icon={<Calendar size={24} />}
                          value="7"
                          label="This Week"
                          color="#84CC16"
                        />
                      </Grid>
                    </Grid>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          </motion.div>
        )}

        {/* Enhanced Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Box
            sx={{
              mb: 4,
              p: 4,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
            }}
          >
            {/* Main Search and Quick Filters */}
            <Grid container spacing={3} alignItems="center" mb={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search by filename, job ID, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={20} color="rgba(255, 255, 255, 0.7)" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      color: 'white',
                      '& fieldset': {
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      },
                      '&:hover fieldset': {
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                      },
                      '&.Mui-focused fieldset': {
                        border: `2px solid ${BRAND_COLORS.primary}`,
                      },
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: 'rgba(255, 255, 255, 0.6)',
                    },
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    style={{
                      padding: '8px 16px',
                      background: showAdvancedFilters 
                        ? `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, #E63950 100%)`
                        : 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Filter size={16} />
                    Advanced Filters
                    {showAdvancedFilters ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCompareMode(!compareMode)}
                    style={{
                      padding: '8px 16px',
                      background: compareMode 
                        ? 'rgba(139, 92, 246, 0.3)'
                        : 'rgba(255, 255, 255, 0.1)',
                      border: compareMode 
                        ? '1px solid rgba(139, 92, 246, 0.5)'
                        : '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <TrendingUp size={16} />
                    Compare ({compareItems.length}/3)
                  </motion.button>
                </Stack>
              </Grid>
            </Grid>

            {/* Quick Status Filters */}
            <Stack direction="row" spacing={2} mb={showAdvancedFilters ? 3 : 0} flexWrap="wrap" gap={1}>
              <FilterChip
                label="All"
                active={filterStatus === 'all'}
                onClick={() => setFilterStatus('all')}
                count={filteredData.length}
              />
              <FilterChip
                label="Completed"
                active={filterStatus === 'completed'}
                onClick={() => setFilterStatus('completed')}
                count={historyData.filter(job => job.status === 'completed').length}
              />
              <FilterChip
                label="Processing"
                active={filterStatus === 'processing'}
                onClick={() => setFilterStatus('processing')}
                count={historyData.filter(job => job.status === 'processing').length}
              />
              <FilterChip
                label="Failed"
                active={filterStatus === 'failed'}
                onClick={() => setFilterStatus('failed')}
                count={historyData.filter(job => job.status === 'failed').length}
              />
            </Stack>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showAdvancedFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box
                    sx={{
                      p: 3,
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Typography sx={{ color: 'white', mb: 1, fontSize: '0.9rem', fontWeight: 600 }}>
                          Date Range
                        </Typography>
                        <Stack direction="row" spacing={2}>
                          <TextField
                            type="date"
                            size="small"
                            value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
                            onChange={(e) => setDateRange(prev => ({ 
                              ...prev, 
                              start: e.target.value ? new Date(e.target.value) : null 
                            }))}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                '& fieldset': { border: '1px solid rgba(255, 255, 255, 0.2)' },
                              },
                            }}
                          />
                          <TextField
                            type="date"
                            size="small"
                            value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
                            onChange={(e) => setDateRange(prev => ({ 
                              ...prev, 
                              end: e.target.value ? new Date(e.target.value) : null 
                            }))}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                '& fieldset': { border: '1px solid rgba(255, 255, 255, 0.2)' },
                              },
                            }}
                          />
                        </Stack>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Typography sx={{ color: 'white', mb: 1, fontSize: '0.9rem', fontWeight: 600 }}>
                          File Type
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <FilterChip
                            label="All"
                            active={fileTypeFilter === 'all'}
                            onClick={() => setFileTypeFilter('all')}
                            small
                          />
                          <FilterChip
                            label="PPTX"
                            active={fileTypeFilter === 'pptx'}
                            onClick={() => setFileTypeFilter('pptx')}
                            small
                          />
                          <FilterChip
                            label="DOCX"
                            active={fileTypeFilter === 'docx'}
                            onClick={() => setFileTypeFilter('docx')}
                            small
                          />
                          <FilterChip
                            label="Other"
                            active={fileTypeFilter === 'other'}
                            onClick={() => setFileTypeFilter('other')}
                            small
                          />
                        </Stack>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Typography sx={{ color: 'white', mb: 1, fontSize: '0.9rem', fontWeight: 600 }}>
                          Sort By
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <SortButton
                            label="Date"
                            active={sortBy === 'date'}
                            order={sortBy === 'date' ? sortOrder : null}
                            onClick={() => handleSort('date')}
                          />
                          <SortButton
                            label="Name"
                            active={sortBy === 'name'}
                            order={sortBy === 'name' ? sortOrder : null}
                            onClick={() => handleSort('name')}
                          />
                          <SortButton
                            label="Violations"
                            active={sortBy === 'violations'}
                            order={sortBy === 'violations' ? sortOrder : null}
                            onClick={() => handleSort('violations')}
                          />
                        </Stack>
                      </Grid>
                    </Grid>

                    {/* Clear Filters */}
                    <Stack direction="row" justifyContent="flex-end" mt={3}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSearchTerm('');
                          setFilterStatus('all');
                          setDateRange({ start: null, end: null });
                          setFileTypeFilter('all');
                          setSortBy('date');
                          setSortOrder('desc');
                        }}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '12px',
                          color: '#EF4444',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <X size={16} />
                        Clear All Filters
                      </motion.button>
                    </Stack>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </motion.div>

        {/* History Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              overflow: 'hidden',
            }}
          >
            {filteredData.length === 0 ? (
              <EmptyState searchTerm={searchTerm} onNavigate={onNavigate} />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 600, border: 'none' }}>
                        File
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600, border: 'none' }}>
                        Date
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600, border: 'none' }}>
                        Status
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600, border: 'none' }}>
                        Violations
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600, border: 'none' }}>
                        Review
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600, border: 'none' }} align="right">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredData.map((job, index) => (
                      <HistoryRow
                        key={job.job_id}
                        job={job}
                        index={index}
                        onView={() => onViewJob(job)}
                        onUpdateReview={onUpdateReview}
                        onDelete={() => onDeleteJob(job.job_id)}
                        getStatusConfig={getStatusConfig}
                        getReviewConfig={getReviewConfig}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </motion.div>
      </Container>


    </Box>
  );
};

// Stats Card Component
const StatsCard = ({ icon, value, label, color }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    transition={{ duration: 0.2 }}
  >
    <Box
      sx={{
        p: 3,
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        textAlign: 'center',
        transition: 'all 0.3s ease',
        '&:hover': {
          background: 'rgba(255, 255, 255, 0.08)',
          border: `1px solid ${color}40`,
        },
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          p: 1.5,
          borderRadius: '12px',
          background: `${color}20`,
          color: color,
          mb: 2,
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="h4"
        sx={{
          color: 'white',
          fontWeight: 700,
          mb: 0.5,
        }}
      >
        {value}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.85rem',
        }}
      >
        {label}
      </Typography>
    </Box>
  </motion.div>
);

// Filter Chip Component
const FilterChip = ({ label, active, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    style={{
      padding: '8px 16px',
      background: active 
        ? `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, #E63950 100%)`
        : 'rgba(255, 255, 255, 0.1)',
      border: active 
        ? 'none'
        : '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      color: 'white',
      fontSize: '0.85rem',
      fontWeight: active ? 600 : 500,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    }}
  >
    {label}
  </motion.button>
);

// History Row Component
const HistoryRow = ({ 
  job, 
  index, 
  onView, 
  onUpdateReview, 
  onDelete, 
  getStatusConfig, 
  getReviewConfig 
}) => {
  const statusConfig = getStatusConfig(job.status);
  const reviewConfig = getReviewConfig(job.review_status);

  return (
    <motion.tr
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <TableCell sx={{ border: 'none', py: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              background: `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, #E63950 100%)`,
            }}
          >
            <FileText size={20} />
          </Avatar>
          <Box>
            <Typography
              sx={{
                color: 'white',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              {job.filename}
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.75rem',
              }}
            >
              {job.job_id.slice(0, 8)}...
            </Typography>
          </Box>
        </Stack>
      </TableCell>

      <TableCell sx={{ border: 'none', py: 2 }}>
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.85rem' }}>
          {new Date(job.created_at).toLocaleDateString()}
        </Typography>
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>
          {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </TableCell>

      <TableCell sx={{ border: 'none', py: 2 }}>
        <Chip
          icon={statusConfig.icon}
          label={job.status}
          size="small"
          sx={{
            background: statusConfig.bg,
            color: statusConfig.color,
            border: `1px solid ${statusConfig.border}`,
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        />
      </TableCell>

      <TableCell sx={{ border: 'none', py: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography
            sx={{
              color: 'white',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            {job.total_violations || 0}
          </Typography>
          {job.critical_violations > 0 && (
            <Chip
              label={`${job.critical_violations} critical`}
              size="small"
              sx={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#EF4444',
                fontSize: '0.7rem',
                height: '20px',
              }}
            />
          )}
        </Stack>
      </TableCell>

      <TableCell sx={{ border: 'none', py: 2 }}>
        <Chip
          icon={reviewConfig.icon}
          label={reviewConfig.label}
          size="small"
          sx={{
            background: reviewConfig.bg,
            color: reviewConfig.color,
            border: `1px solid ${reviewConfig.border}`,
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        />
      </TableCell>

      <TableCell sx={{ border: 'none', py: 2 }} align="right">
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="View Details">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onView}
              style={{
                padding: '8px',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                color: '#3B82F6',
                cursor: 'pointer',
              }}
            >
              <Eye size={16} />
            </motion.button>
          </Tooltip>

          {job.status === 'completed' && job.review_status === 'pending_review' && (
            <>
              <Tooltip title="Validate">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onUpdateReview(job.job_id, 'validated')}
                  style={{
                    padding: '8px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    color: '#10B981',
                    cursor: 'pointer',
                  }}
                >
                  <CheckCircle size={16} />
                </motion.button>
              </Tooltip>

              <Tooltip title="Needs Revision">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onUpdateReview(job.job_id, 'needs_revision')}
                  style={{
                    padding: '8px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '8px',
                    color: '#F59E0B',
                    cursor: 'pointer',
                  }}
                >
                  <AlertTriangle size={16} />
                </motion.button>
              </Tooltip>
            </>
          )}

          {job.review_status === 'validated' && (
            <Tooltip title="Send to Owner">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{
                  padding: '8px',
                  background: 'rgba(6, 182, 212, 0.2)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '8px',
                  color: '#06B6D4',
                  cursor: 'pointer',
                }}
              >
                <Send size={16} />
              </motion.button>
            </Tooltip>
          )}

          <Tooltip title="Delete">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onDelete}
              style={{
                padding: '8px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#EF4444',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={16} />
            </motion.button>
          </Tooltip>
        </Stack>
      </TableCell>
    </motion.tr>
  );
};

// Empty State Component
const EmptyState = ({ searchTerm, onNavigate }) => (
  <Box
    sx={{
      p: 8,
      textAlign: 'center',
    }}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          p: 4,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          mb: 3,
        }}
      >
        <FileText size={48} color="rgba(255, 255, 255, 0.5)" />
      </Box>
      
      <Typography
        variant="h5"
        sx={{
          color: 'white',
          fontWeight: 600,
          mb: 2,
        }}
      >
        {searchTerm ? 'No matching results' : 'No compliance checks yet'}
      </Typography>
      
      <Typography
        variant="body1"
        sx={{
          color: 'rgba(255, 255, 255, 0.7)',
          mb: 4,
          maxWidth: '400px',
          mx: 'auto',
        }}
      >
        {searchTerm 
          ? `No files found matching "${searchTerm}". Try adjusting your search terms.`
          : 'Upload your first presentation to get started with compliance checking.'
        }
      </Typography>

      {!searchTerm && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate('upload')}
          style={{
            padding: '16px 32px',
            background: `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, #E63950 100%)`,
            border: 'none',
            borderRadius: '16px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(196, 30, 58, 0.3)',
          }}
        >
          Start Your First Check
        </motion.button>
      )}
    </motion.div>
  </Box>
);

export default HistoryView;