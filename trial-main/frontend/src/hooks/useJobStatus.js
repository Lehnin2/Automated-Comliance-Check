import { useState, useEffect } from 'react';
import { getJobStatus } from '../services/api';
import { POLLING_INTERVAL, JOB_STATUS } from '../utils/constants';
import { logError } from '../services/errorHandler';

/**
 * Hook to poll job status
 */
export const useJobStatus = (jobId, isActive = true) => {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!jobId || !isActive) return;

    setLoading(true);
    
    const interval = setInterval(async () => {
      try {
        const data = await getJobStatus(jobId);
        setStatus(data);
        setError(null);
        
        // Stop polling if job is completed or failed
        if (data.status === JOB_STATUS.COMPLETED || data.status === JOB_STATUS.FAILED) {
          clearInterval(interval);
          setLoading(false);
        }
      } catch (err) {
        logError(err, 'useJobStatus');
        setError(err);
        clearInterval(interval);
        setLoading(false);
      }
    }, POLLING_INTERVAL);

    // Initial fetch
    getJobStatus(jobId)
      .then(data => {
        setStatus(data);
        setError(null);
      })
      .catch(err => {
        logError(err, 'useJobStatus - initial');
        setError(err);
      });

    return () => {
      clearInterval(interval);
    };
  }, [jobId, isActive]);

  return { status, error, loading };
};

