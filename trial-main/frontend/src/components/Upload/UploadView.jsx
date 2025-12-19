import React, { useState, useCallback, useRef } from 'react';
import { 
  Home, History, Eye, FileText, Upload, CheckCircle, AlertCircle, 
  Zap, ArrowRight, Sparkles, Clock, Settings, Play, ChevronDown,
  FileCheck, Shield, Cpu, Database, X, Trash2, RotateCcw, 
  FileImage, FileSpreadsheet, Archive, File, Image, Music, Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Container, Typography, Grid, Stack, LinearProgress, Chip, Tooltip, IconButton } from '@mui/material';
import FileUploader from '../common/FileUploader';
import Button from '../common/Button';
import Card from '../common/Card';
import { EXTRACTION_METHODS, BRAND_COLORS } from '../../utils/constants';
import { useFileUpload } from '../../hooks/useFileUpload';
import { uploadForPreview } from '../../services/api';
import { getErrorMessage } from '../../services/errorHandler';

const UploadView = ({ onUploadSuccess, onNavigate, onLoadHistory }) => {
  const {
    pptxFile,
    metadataFile,
    prospectusFile,
    errors,
    handlePptxChange,
    handleMetadataChange,
    handleProspectusChange,
    isValid
  } = useFileUpload();

  const [extractionMethod, setExtractionMethod] = useState('MO');
  const [parallelWorkers, setParallelWorkers] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [processingQueue, setProcessingQueue] = useState(false);
  const dragCounter = useRef(0);

  // Smart file type detection
  const getFileIcon = (file) => {
    if (!file) return <File size={32} />;
    
    const extension = file.name.split('.').pop().toLowerCase();
    const mimeType = file.type.toLowerCase();
    
    // PowerPoint files
    if (extension === 'pptx' || mimeType.includes('presentation')) {
      return <FileImage size={32} color="#D97706" />;
    }
    // JSON/Metadata files
    if (extension === 'json' || mimeType.includes('json')) {
      return <Settings size={32} color="#3B82F6" />;
    }
    // Word documents
    if (extension === 'docx' || mimeType.includes('document')) {
      return <FileText size={32} color="#8B5CF6" />;
    }
    // Images
    if (mimeType.includes('image')) {
      return <Image size={32} color="#10B981" />;
    }
    // Archives
    if (['zip', 'rar', '7z'].includes(extension)) {
      return <Archive size={32} color="#F59E0B" />;
    }
    // Spreadsheets
    if (['xlsx', 'csv'].includes(extension) || mimeType.includes('spreadsheet')) {
      return <FileSpreadsheet size={32} color="#059669" />;
    }
    
    return <File size={32} color="#6B7280" />;
  };

  // File validation
  const validateFile = (file, type) => {
    const validTypes = {
      pptx: ['.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      json: ['.json', 'application/json'],
      docx: ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    };

    const extension = '.' + file.name.split('.').pop().toLowerCase();
    const mimeType = file.type.toLowerCase();
    
    if (type && validTypes[type]) {
      return validTypes[type].some(valid => 
        extension === valid || mimeType === valid
      );
    }
    
    return true;
  };

  // Enhanced drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragActive(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      handleMultipleFiles(files);
    }
  }, []);

  // Handle multiple file uploads
  const handleMultipleFiles = (files) => {
    const newQueueItems = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      status: 'pending', // pending, uploading, completed, error
      progress: 0,
      error: null,
      type: detectFileType(file)
    }));

    setUploadQueue(prev => [...prev, ...newQueueItems]);
  };

  // Detect file type based on extension and content
  const detectFileType = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    const mimeType = file.type.toLowerCase();

    if (extension === 'pptx' || mimeType.includes('presentation')) return 'pptx';
    if (extension === 'json' || mimeType.includes('json')) return 'json';
    if (extension === 'docx' || mimeType.includes('document')) return 'docx';
    return 'unknown';
  };

  // Process upload queue
  const processUploadQueue = async () => {
    if (uploadQueue.length === 0) return;

    setProcessingQueue(true);
    
    for (const item of uploadQueue) {
      if (item.status === 'pending') {
        try {
          // Update status to uploading
          setUploadQueue(prev => prev.map(q => 
            q.id === item.id ? { ...q, status: 'uploading', progress: 0 } : q
          ));

          // Simulate upload progress
          for (let progress = 0; progress <= 100; progress += 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            setUploadQueue(prev => prev.map(q => 
              q.id === item.id ? { ...q, progress } : q
            ));
          }

          // Mark as completed
          setUploadQueue(prev => prev.map(q => 
            q.id === item.id ? { ...q, status: 'completed', progress: 100 } : q
          ));

          // Auto-assign to appropriate slot
          if (item.type === 'pptx' && !pptxFile) {
            handlePptxChange({ target: { files: [item.file] } });
          } else if (item.type === 'json' && !metadataFile) {
            handleMetadataChange({ target: { files: [item.file] } });
          } else if (item.type === 'docx' && !prospectusFile) {
            handleProspectusChange({ target: { files: [item.file] } });
          }

        } catch (error) {
          setUploadQueue(prev => prev.map(q => 
            q.id === item.id ? { ...q, status: 'error', error: error.message } : q
          ));
        }
      }
    }

    setProcessingQueue(false);
  };

  // Remove item from queue
  const removeFromQueue = (id) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id));
  };

  // Clear completed items
  const clearCompleted = () => {
    setUploadQueue(prev => prev.filter(item => item.status !== 'completed'));
  };

  // Retry failed upload
  const retryUpload = (id) => {
    setUploadQueue(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'pending', error: null, progress: 0 } : item
    ));
  };

  const handleUpload = async () => {
    if (!isValid) {
      setError('Please upload both PowerPoint and metadata files');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('pptx_file', pptxFile);
      formData.append('metadata_file', metadataFile);
      if (prospectusFile) {
        formData.append('prospectus_file', prospectusFile);
      }
      formData.append('extraction_method', extractionMethod);
      if (extractionMethod === 'SL') {
        formData.append('parallel_workers', parallelWorkers);
      }

      const response = await uploadForPreview(formData);
      onUploadSuccess(response);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Enhanced extraction methods with icons and features
  const enhancedMethods = EXTRACTION_METHODS.map(method => ({
    ...method,
    icon: method.id === 'MO' ? <Database /> : 
          method.id === 'FD' ? <Cpu /> : 
          method.id === 'SF' ? <Shield /> : <Zap />,
    features: method.id === 'MO' ? ['Fast Processing', 'Standard Quality', 'Low Resource Usage'] :
              method.id === 'FD' ? ['AI-Powered', 'High Accuracy', 'Multi-Agent System'] :
              method.id === 'SF' ? ['Comprehensive', 'Detailed Analysis', 'Best Quality'] :
              ['Ultra Fast', 'Parallel Processing', 'High Performance'],
    recommended: method.id === 'FD'
  }));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${BRAND_COLORS.dark} 0%, ${BRAND_COLORS.primary} 100%)`,
        position: 'relative',
      }}
    >

      <Container 
        maxWidth="xl" 
        sx={{ position: 'relative', zIndex: 1, py: 6 }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Global Drag Overlay */}
        <AnimatePresence>
          {dragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(59, 130, 246, 0.1)',
                backdropFilter: 'blur(8px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(20px)',
                  border: '3px dashed #3B82F6',
                  borderRadius: '24px',
                  padding: '48px',
                  textAlign: 'center',
                  color: 'white',
                }}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Upload size={64} color="#3B82F6" />
                </motion.div>
                <Typography variant="h4" sx={{ mt: 2, fontWeight: 700 }}>
                  Drop files anywhere to upload
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, opacity: 0.8 }}>
                  We'll automatically detect and organize your files
                </Typography>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Header Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={6}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('landing')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              <Home size={18} /> Back to Home
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLoadHistory}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 24px',
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
              <History size={18} /> View History
            </motion.button>
          </Stack>
        </motion.div>

        {/* Main Content - Centered */}
        <Grid container justifyContent="center">
          <Grid item xs={12} md={10} lg={8}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Box
                sx={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '24px',
                  p: { xs: 4, md: 6 },
                }}
              >
                {/* Header */}
                <Stack spacing={3} textAlign="center" mb={6}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 3,
                        py: 1.5,
                        borderRadius: '50px',
                        background: 'rgba(255, 215, 0, 0.15)',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        color: '#FFD700',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        mx: 'auto',
                        width: 'fit-content',
                      }}
                    >
                      <Sparkles size={18} />
                      AI-Powered Compliance Check
                    </Box>
                  </motion.div>

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
                    Upload Your Files
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: { xs: '1.1rem', md: '1.3rem' },
                      fontWeight: 400,
                      maxWidth: '600px',
                      mx: 'auto',
                    }}
                  >
                    Let's get your presentation checked with our advanced AI compliance system
                  </Typography>
                </Stack>

                {/* Error Display */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Box
                        sx={{
                          mb: 4,
                          p: 3,
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        <AlertCircle size={20} color="#EF4444" />
                        <Typography sx={{ color: '#FCA5A5', fontSize: '0.9rem' }}>
                          {error}
                        </Typography>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* File Upload Areas - Grid Layout */}
                <Grid container spacing={3}>
                  {/* PowerPoint File */}
                  <Grid item xs={12} md={6}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      <PremiumFileUploader
                        label="PowerPoint Presentation"
                        description="Upload your .pptx file for compliance checking"
                        accept=".pptx"
                        file={pptxFile}
                        onChange={handlePptxChange}
                        error={errors.pptx}
                        required
                        icon={<FileCheck size={32} />}
                        color="#10B981"
                      />
                    </motion.div>
                  </Grid>

                  {/* Metadata File */}
                  <Grid item xs={12} md={6}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                    >
                      <PremiumFileUploader
                        label="Metadata Configuration"
                        description="Upload your .json metadata file"
                        accept=".json"
                        file={metadataFile}
                        onChange={handleMetadataChange}
                        error={errors.metadata}
                        required
                        icon={<Settings size={32} />}
                        color="#3B82F6"
                      />
                    </motion.div>
                  </Grid>

                  {/* Prospectus File - Full Width */}
                  <Grid item xs={12}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                    >
                      <PremiumFileUploader
                        label="Prospectus Document (Optional)"
                        description="Upload your .docx prospectus file for enhanced validation"
                        accept=".docx"
                        file={prospectusFile}
                        onChange={handleProspectusChange}
                        error={errors.prospectus}
                        icon={<FileText size={32} />}
                        color="#8B5CF6"
                      />
                    </motion.div>
                  </Grid>
                </Grid>

                {/* Upload Progress */}
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Box sx={{ mt: 4, p: 3, background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px' }}>
                        <Stack spacing={2}>
                          <Typography sx={{ color: 'white', fontSize: '0.9rem', fontWeight: 600 }}>
                            Uploading and processing files...
                          </Typography>
                          <LinearProgress
                            variant="indeterminate"
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              '& .MuiLinearProgress-bar': {
                                background: `linear-gradient(90deg, ${BRAND_COLORS.primary} 0%, #FFD700 100%)`,
                              },
                            }}
                          />
                        </Stack>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Upload Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  <Box sx={{ mt: 6 }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUpload}
                      disabled={!isValid || loading}
                      style={{
                        width: '100%',
                        padding: '20px',
                        background: !isValid || loading 
                          ? 'rgba(156, 163, 175, 0.3)' 
                          : `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, #FFD700 100%)`,
                        border: 'none',
                        borderRadius: '20px',
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: 700,
                        cursor: !isValid || loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        boxShadow: !isValid || loading ? 'none' : '0 12px 40px rgba(196, 30, 58, 0.3)',
                        transition: 'all 0.3s ease',
                        opacity: !isValid || loading ? 0.6 : 1,
                      }}
                    >
                      {loading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Clock size={24} />
                          </motion.div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Eye size={24} />
                          Upload & Preview
                          <ArrowRight size={20} />
                        </>
                      )}
                    </motion.button>
                  </Box>
                </motion.div>
              </Box>
            </motion.div>
          </Grid>
        </Grid>

        {/* Upload Queue Management */}
        <AnimatePresence>
          {uploadQueue.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 30, height: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Box
                sx={{
                  mt: 4,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  p: 4,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'white',
                      fontWeight: 700,
                    }}
                  >
                    Upload Queue ({uploadQueue.length} files)
                  </Typography>
                  
                  <Stack direction="row" spacing={2}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={processUploadQueue}
                      disabled={processingQueue || uploadQueue.every(item => item.status !== 'pending')}
                      style={{
                        padding: '8px 16px',
                        background: processingQueue 
                          ? 'rgba(156, 163, 175, 0.3)' 
                          : `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, #E63950 100%)`,
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: processingQueue ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: processingQueue ? 0.6 : 1,
                      }}
                    >
                      {processingQueue ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Clock size={16} />
                          </motion.div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Play size={16} />
                          Process Queue
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={clearCompleted}
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(255, 255, 255, 0.1)',
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
                      <CheckCircle size={16} />
                      Clear Completed
                    </motion.button>
                  </Stack>
                </Stack>

                <Grid container spacing={2}>
                  {uploadQueue.map((item, index) => (
                    <Grid item xs={12} sm={6} md={4} key={item.id}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <QueueItem
                          item={item}
                          onRemove={() => removeFromQueue(item.id)}
                          onRetry={() => retryUpload(item.id)}
                          getFileIcon={getFileIcon}
                        />
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Extraction Methods Section - Centered */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <Box
            sx={{
              mt: 6,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              p: { xs: 3, sm: 4, md: 5 },
              maxWidth: { xs: '100%', sm: '900px', lg: '1000px' },
              mx: 'auto',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: 'white',
                fontWeight: 700,
                mb: 4,
                textAlign: 'center',
              }}
            >
              Choose Extraction Method
            </Typography>

            <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
              {enhancedMethods.map((method, index) => (
                <Grid item xs={12} sm={6} lg={3} key={method.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Box
                      onClick={() => setExtractionMethod(method.id)}
                      sx={{
                        p: { xs: 3, sm: 4, md: 5 },
                        borderRadius: '20px',
                        background: extractionMethod === method.id
                          ? `linear-gradient(135deg, ${BRAND_COLORS.primary}20 0%, #FFD70020 100%)`
                          : 'rgba(255, 255, 255, 0.05)',
                        border: extractionMethod === method.id
                          ? `3px solid ${BRAND_COLORS.primary}`
                          : '3px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        minHeight: { xs: '200px', sm: '220px', md: '240px' },
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: extractionMethod === method.id
                          ? `0 8px 32px rgba(196, 30, 58, 0.2)`
                          : '0 4px 20px rgba(0, 0, 0, 0.1)',
                        '&:hover': {
                          background: extractionMethod === method.id
                            ? `linear-gradient(135deg, ${BRAND_COLORS.primary}30 0%, #FFD70030 100%)`
                            : 'rgba(255, 255, 255, 0.08)',
                          transform: 'translateY(-4px)',
                          boxShadow: extractionMethod === method.id
                            ? `0 12px 40px rgba(196, 30, 58, 0.3)`
                            : '0 8px 30px rgba(0, 0, 0, 0.15)',
                        },
                      }}
                    >
                      {method.recommended && (
                        <Chip
                          label="Recommended"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            background: '#FFD700',
                            color: '#000',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                          }}
                        />
                      )}

                      <Stack spacing={{ xs: 2, sm: 3 }} sx={{ flex: 1, textAlign: 'center' }}>
                        {/* Icon Section */}
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            mb: 1,
                          }}
                        >
                          <Box
                            sx={{
                              p: { xs: 2, sm: 2.5 },
                              borderRadius: '16px',
                              background: extractionMethod === method.id
                                ? `${BRAND_COLORS.primary}30`
                                : 'rgba(255, 255, 255, 0.1)',
                              color: extractionMethod === method.id ? BRAND_COLORS.primary : '#FFD700',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Box sx={{ fontSize: { xs: '24px', sm: '28px' } }}>
                              {method.icon}
                            </Box>
                          </Box>
                        </Box>

                        {/* Title */}
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: 'white',
                            fontWeight: 700,
                            fontSize: { xs: '1rem', sm: '1.1rem' },
                            lineHeight: 1.2,
                          }}
                        >
                          {method.name}
                        </Typography>

                        {/* Description */}
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: { xs: '0.85rem', sm: '0.9rem' },
                            lineHeight: 1.4,
                            flex: 1,
                            px: 1,
                          }}
                        >
                          {method.description}
                        </Typography>

                        {/* Features */}
                        <Stack spacing={1} sx={{ mt: 'auto' }}>
                          {method.features.slice(0, 3).map((feature, idx) => (
                            <Box
                              key={idx}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                              }}
                            >
                              <CheckCircle size={14} color="#10B981" />
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'rgba(255, 255, 255, 0.8)',
                                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                                  fontWeight: 500,
                                }}
                              >
                                {feature}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Stack>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

                {/* Advanced Settings */}
                <AnimatePresence>
                  {extractionMethod === 'SL' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Box
                        sx={{
                          mt: 3,
                          p: 3,
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '16px',
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: 'white',
                            fontWeight: 600,
                            mb: 2,
                          }}
                        >
                          Parallel Workers: {parallelWorkers}
                        </Typography>
                        
                        <Box sx={{ px: 1 }}>
                          <input
                            type="range"
                            min="1"
                            max="8"
                            value={parallelWorkers}
                            onChange={(e) => setParallelWorkers(parseInt(e.target.value))}
                            style={{
                              width: '100%',
                              height: '6px',
                              borderRadius: '3px',
                              background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(parallelWorkers / 8) * 100}%, rgba(255, 255, 255, 0.2) ${(parallelWorkers / 8) * 100}%, rgba(255, 255, 255, 0.2) 100%)`,
                              outline: 'none',
                              cursor: 'pointer',
                            }}
                          />
                        </Box>
                        
                        <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            1 (slower)
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            8 (faster)
                          </Typography>
                        </Stack>
                      </Box>
                    </motion.div>
                  )}
            </AnimatePresence>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default UploadView;


// Queue Item Component
const QueueItem = ({ item, onRemove, onRetry, getFileIcon }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'error': return '#EF4444';
      case 'uploading': return '#3B82F6';
      default: return '#F59E0B';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} />;
      case 'error': return <AlertCircle size={16} />;
      case 'uploading': return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Clock size={16} />
        </motion.div>
      );
      default: return <Clock size={16} />;
    }
  };

  return (
    <Box
      sx={{
        p: 3,
        background: 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${getStatusColor(item.status)}40`,
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <Box sx={{ color: getStatusColor(item.status) }}>
          {getFileIcon(item.file)}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              color: 'white',
              fontWeight: 600,
              fontSize: '0.9rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.file.name}
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.75rem',
            }}
          >
            {(item.file.size / 1024 / 1024).toFixed(2)} MB • {item.type.toUpperCase()}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onRemove}
          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
        >
          <X size={16} />
        </IconButton>
      </Stack>

      {/* Progress Bar */}
      {item.status === 'uploading' && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={item.progress}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(90deg, ${getStatusColor(item.status)} 0%, #10B981 100%)`,
                borderRadius: 3,
              },
            }}
          />
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.75rem',
              mt: 0.5,
            }}
          >
            {item.progress}% uploaded
          </Typography>
        </Box>
      )}

      {/* Status */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Chip
          icon={getStatusIcon(item.status)}
          label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          size="small"
          sx={{
            background: `${getStatusColor(item.status)}20`,
            color: getStatusColor(item.status),
            border: `1px solid ${getStatusColor(item.status)}40`,
            fontSize: '0.75rem',
          }}
        />

        {item.status === 'error' && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onRetry}
            style={{
              padding: '4px 8px',
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              color: '#3B82F6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
            }}
          >
            <RotateCcw size={12} />
            Retry
          </motion.button>
        )}
      </Stack>

      {item.error && (
        <Typography
          sx={{
            color: '#FCA5A5',
            fontSize: '0.75rem',
            mt: 1,
            p: 1,
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px',
          }}
        >
          {item.error}
        </Typography>
      )}
    </Box>
  );
};

// Premium File Uploader Component
const PremiumFileUploader = ({ 
  label, 
  description, 
  accept, 
  file, 
  onChange, 
  error, 
  required = false, 
  icon, 
  color = '#3B82F6' 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [dragDepth, setDragDepth] = useState(0);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter") {
      setDragDepth(prev => prev + 1);
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragDepth(prev => {
        const newDepth = prev - 1;
        if (newDepth === 0) {
          setDragActive(false);
        }
        return newDepth;
      });
    } else if (e.type === "dragover") {
      setDragActive(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setDragDepth(0);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const event = { target: { files: [droppedFile] } };
      onChange(event);
    }
  };

  const handleFileSelect = (e) => {
    onChange(e);
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Typography
          variant="subtitle1"
          sx={{
            color: 'white',
            fontWeight: 600,
            fontSize: '1.1rem',
          }}
        >
          {label}
        </Typography>
        {required && (
          <Typography sx={{ color: BRAND_COLORS.primary, fontWeight: 700 }}>
            *
          </Typography>
        )}
      </Stack>

      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById(`file-input-${label}`).click()}
        sx={{
          p: 4,
          borderRadius: '20px',
          border: error 
            ? '3px dashed #EF4444'
            : file 
              ? `3px solid ${color}`
              : dragActive 
                ? `3px dashed ${color}`
                : '2px dashed rgba(255, 255, 255, 0.3)',
          background: error
            ? 'rgba(239, 68, 68, 0.1)'
            : file
              ? `${color}15`
              : dragActive
                ? `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`
                : 'rgba(255, 255, 255, 0.05)',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          transform: dragActive ? 'scale(1.02)' : 'scale(1)',
          boxShadow: dragActive 
            ? `0 20px 40px ${color}30, inset 0 0 0 1px ${color}40`
            : file
              ? `0 8px 32px ${color}20`
              : '0 4px 16px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            background: error
              ? 'rgba(239, 68, 68, 0.15)'
              : file
                ? `${color}25`
                : `${color}15`,
            transform: dragActive ? 'scale(1.02)' : 'translateY(-4px) scale(1.01)',
            boxShadow: `0 12px 40px ${error ? '#EF4444' : color}25`,
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: dragActive 
              ? `linear-gradient(45deg, transparent 30%, ${color}10 50%, transparent 70%)`
              : 'transparent',
            opacity: dragActive ? 1 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
          },
        }}
      >
        {/* Animated border effect for drag state */}
        <AnimatePresence>
          {dragActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                position: 'absolute',
                top: -2,
                left: -2,
                right: -2,
                bottom: -2,
                borderRadius: '22px',
                background: `linear-gradient(45deg, ${color}, transparent, ${color})`,
                backgroundSize: '200% 200%',
                zIndex: -1,
              }}
            >
              <motion.div
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(45deg, ${color}, transparent, ${color})`,
                  backgroundSize: '200% 200%',
                  borderRadius: '20px',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Box
            sx={{
              p: 2,
              borderRadius: '16px',
              background: error
                ? 'rgba(239, 68, 68, 0.2)'
                : `${color}20`,
              color: error ? '#EF4444' : color,
            }}
          >
            {icon}
          </Box>

          <Stack spacing={1}>
            <Typography
              variant="h6"
              sx={{
                color: file ? color : 'white',
                fontWeight: 600,
                fontSize: '1.1rem',
              }}
            >
              {file ? file.name : `Drop your ${label.toLowerCase()} here`}
            </Typography>
            
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
              }}
            >
              {file 
                ? `${(file.size / 1024 / 1024).toFixed(2)} MB • ${file.type || 'Unknown type'}`
                : description
              }
            </Typography>

            {!file && (
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.8rem',
                }}
              >
                or click to browse files
              </Typography>
            )}
          </Stack>

          {file && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <CheckCircle size={24} color={color} />
            </motion.div>
          )}
        </Stack>

        <input
          id={`file-input-${label}`}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </Box>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AlertCircle size={16} color="#EF4444" />
            <Typography
              variant="caption"
              sx={{
                color: '#FCA5A5',
                fontSize: '0.85rem',
              }}
            >
              {error}
            </Typography>
          </Box>
        </motion.div>
      )}
    </Box>
  );
};