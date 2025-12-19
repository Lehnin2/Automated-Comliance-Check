import { useState } from 'react';

export const useFileUpload = () => {
  const [pptxFile, setPptxFile] = useState(null);
  const [metadataFile, setMetadataFile] = useState(null);
  const [prospectusFile, setProspectusFile] = useState(null);
  const [errors, setErrors] = useState({
    pptx: null,
    metadata: null,
    prospectus: null
  });

  const validateFile = (file, type) => {
    if (!file) return null;

    const validTypes = {
      pptx: ['.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      json: ['.json', 'application/json'],
      docx: ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    };

    const extension = '.' + file.name.split('.').pop().toLowerCase();
    const mimeType = file.type.toLowerCase();
    
    if (type && validTypes[type]) {
      const isValid = validTypes[type].some(valid => 
        extension === valid || mimeType === valid
      );
      
      if (!isValid) {
        return `Invalid file type. Expected ${validTypes[type][0]} file.`;
      }
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return 'File size exceeds 50MB limit.';
    }

    return null;
  };

  const handlePptxChange = (event) => {
    const file = event.target.files?.[0];
    const error = validateFile(file, 'pptx');
    
    setPptxFile(file);
    setErrors(prev => ({ ...prev, pptx: error }));
  };

  const handleMetadataChange = (event) => {
    const file = event.target.files?.[0];
    const error = validateFile(file, 'json');
    
    setMetadataFile(file);
    setErrors(prev => ({ ...prev, metadata: error }));
  };

  const handleProspectusChange = (event) => {
    const file = event.target.files?.[0];
    const error = validateFile(file, 'docx');
    
    setProspectusFile(file);
    setErrors(prev => ({ ...prev, prospectus: error }));
  };

  const isValid = pptxFile && metadataFile && !errors.pptx && !errors.metadata && !errors.prospectus;

  return {
    pptxFile,
    metadataFile,
    prospectusFile,
    errors,
    handlePptxChange,
    handleMetadataChange,
    handleProspectusChange,
    isValid
  };
};