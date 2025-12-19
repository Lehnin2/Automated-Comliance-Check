import React from 'react';

/**
 * Reusable Badge component for status indicators
 */
const Badge = ({ children, variant = 'default', className = '', ...props }) => {
  const variantClasses = {
    default: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    danger: 'bg-red-500/20 text-red-400 border-red-500/30',
    warning: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded border ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;

