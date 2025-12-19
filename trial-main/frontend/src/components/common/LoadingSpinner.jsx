import React from 'react';
import { Loader } from 'lucide-react';

/**
 * Loading spinner component
 */
const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-16 h-16'
  };

  return (
    <Loader
      className={`${sizeClasses[size]} text-emerald-400 animate-spin ${className}`}
    />
  );
};

export default LoadingSpinner;

