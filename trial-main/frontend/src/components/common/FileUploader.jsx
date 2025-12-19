import React from 'react';

// This is a legacy component - the new UploadView uses PremiumFileUploader instead
// Keeping this for backward compatibility
const FileUploader = ({ accept, onChange, file, error }) => {
  return (
    <div>
      <input
        type="file"
        accept={accept}
        onChange={onChange}
        style={{ display: 'none' }}
        id="file-uploader"
      />
      <label htmlFor="file-uploader" style={{ cursor: 'pointer' }}>
        {file ? file.name : 'Choose file...'}
      </label>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};

export default FileUploader;