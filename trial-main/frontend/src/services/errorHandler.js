export const getErrorMessage = (error) => {
  if (error.response) {
    // Server responded with error status
    if (error.response.data?.detail) {
      return error.response.data.detail;
    }
    if (error.response.data?.message) {
      return error.response.data.message;
    }
    if (typeof error.response.data === 'string') {
      return error.response.data;
    }
    return `Server error: ${error.response.status}`;
  } else if (error.request) {
    // Request was made but no response received
    return 'Network error: Unable to connect to server';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred';
  }
};