import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  padding = 'medium',
  background = 'default',
  ...props 
}) => {
  const paddingStyles = {
    small: '16px',
    medium: '24px',
    large: '32px',
  };

  const backgroundStyles = {
    default: 'rgba(255, 255, 255, 0.08)',
    glass: 'rgba(255, 255, 255, 0.1)',
    solid: 'white',
  };

  const baseStyles = {
    padding: paddingStyles[padding],
    borderRadius: '16px',
    background: backgroundStyles[background],
    backdropFilter: background !== 'solid' ? 'blur(20px)' : 'none',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: background === 'solid' 
      ? '0 4px 16px rgba(0, 0, 0, 0.1)' 
      : '0 8px 32px rgba(0, 0, 0, 0.1)',
  };

  return (
    <div
      className={className}
      style={baseStyles}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;