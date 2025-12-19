/**
 * Validation utility functions
 */

/**
 * Validate file type
 */
export const validateFileType = (file, allowedTypes) => {
  if (!file) return false;
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
  return allowedTypes.some(type => fileExtension === type.toLowerCase());
};

/**
 * Validate file size
 */
export const validateFileSize = (file, maxSizeMB = 50) => {
  if (!file) return false;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Validate PowerPoint file
 */
export const validatePptxFile = (file) => {
  if (!file) return { valid: false, error: 'No file selected' };
  
  if (!validateFileType(file, ['.pptx'])) {
    return { valid: false, error: 'File must be a .pptx file' };
  }
  
  if (!validateFileSize(file, 100)) {
    return { valid: false, error: 'File size must be less than 100MB' };
  }
  
  return { valid: true };
};

/**
 * Validate metadata JSON file
 */
export const validateMetadataFile = (file) => {
  if (!file) return { valid: false, error: 'No file selected' };
  
  if (!validateFileType(file, ['.json'])) {
    return { valid: false, error: 'File must be a .json file' };
  }
  
  if (!validateFileSize(file, 10)) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }
  
  return { valid: true };
};

/**
 * Validate prospectus file (optional)
 */
export const validateProspectusFile = (file) => {
  if (!file) return { valid: true }; // Optional file
  
  if (!validateFileType(file, ['.docx'])) {
    return { valid: false, error: 'File must be a .docx file' };
  }
  
  if (!validateFileSize(file, 50)) {
    return { valid: false, error: 'File size must be less than 50MB' };
  }
  
  return { valid: true };
};

