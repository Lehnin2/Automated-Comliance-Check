import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const uploadForPreview = async (formData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/upload-preview`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const checkModules = async (jobId, modules) => {
  try {
    const formData = new FormData();
    formData.append('job_id', jobId);
    formData.append('modules', modules);
    
    const response = await axios.post(`${API_BASE_URL}/api/check-modules`, formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getJobStatus = async (jobId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/status/${jobId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getViolations = async (jobId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/download/${jobId}/violations`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getExtractedJson = async (jobId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/download/${jobId}/extracted-json`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getHistory = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/history`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getHistoryStats = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/history/stats`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateReviewStatus = async (jobId, status, notes = '') => {
  try {
    const formData = new FormData();
    formData.append('review_status', status);
    if (notes) formData.append('reviewer_notes', notes);
    
    const response = await axios.put(`${API_BASE_URL}/api/history/${jobId}/review`, formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteJob = async (jobId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/history/${jobId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadReport = async (jobId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/download/${jobId}/report`, { 
      responseType: 'blob' 
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadJSON = async (jobId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/download/${jobId}/violations`, { 
      responseType: 'blob' 
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};