import { useState, useEffect, useCallback } from 'react';
import { getHistory, getHistoryStats, updateReviewStatus, deleteHistoryJob } from '../services/api';
import { logError } from '../services/errorHandler';

/**
 * Hook to manage compliance history
 */
export const useHistory = () => {
  const [historyData, setHistoryData] = useState([]);
  const [historyStats, setHistoryStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [historyRes, statsRes] = await Promise.all([
        getHistory(),
        getHistoryStats()
      ]);
      setHistoryData(historyRes.jobs || []);
      setHistoryStats(statsRes);
    } catch (err) {
      logError(err, 'useHistory - loadHistory');
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReview = useCallback(async (jobId, newStatus, reviewerNotes = '') => {
    try {
      await updateReviewStatus(jobId, newStatus, reviewerNotes);
      await loadHistory(); // Refresh history
    } catch (err) {
      logError(err, 'useHistory - updateReview');
      throw err;
    }
  }, [loadHistory]);

  const deleteJob = useCallback(async (jobId) => {
    try {
      await deleteHistoryJob(jobId);
      await loadHistory(); // Refresh history
    } catch (err) {
      logError(err, 'useHistory - deleteJob');
      throw err;
    }
  }, [loadHistory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    historyData,
    historyStats,
    loading,
    error,
    loadHistory,
    updateReview,
    deleteJob
  };
};

