import { useState, useMemo } from 'react';
import { SEVERITY } from '../utils/constants';

/**
 * Hook to manage and filter violations
 */
export const useViolations = (violations = []) => {
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterModule, setFilterModule] = useState('all');

  // Get unique modules from violations
  const availableModules = useMemo(() => {
    return [...new Set(violations.map(v => v.module))].sort();
  }, [violations]);

  // Filter violations
  const filteredViolations = useMemo(() => {
    return violations.filter(v => {
      const severityMatch = filterSeverity === 'all' || v.severity === filterSeverity;
      const moduleMatch = filterModule === 'all' || v.module === filterModule;
      return severityMatch && moduleMatch;
    });
  }, [violations, filterSeverity, filterModule]);

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: violations.length,
      critical: violations.filter(v => v.severity === SEVERITY.CRITICAL).length,
      major: violations.filter(v => v.severity === SEVERITY.MAJOR).length,
      minor: violations.filter(v => v.severity === SEVERITY.MINOR).length,
    };
  }, [violations]);

  // Get violations for a specific slide
  const getViolationsForSlide = (slideNumber) => {
    return violations.filter(v => v.page_number === slideNumber);
  };

  // Get violations by module
  const getViolationsByModule = () => {
    const grouped = {};
    violations.forEach(v => {
      if (!grouped[v.module]) {
        grouped[v.module] = [];
      }
      grouped[v.module].push(v);
    });
    return grouped;
  };

  return {
    filteredViolations,
    stats,
    availableModules,
    filterSeverity,
    filterModule,
    setFilterSeverity,
    setFilterModule,
    getViolationsForSlide,
    getViolationsByModule
  };
};

