import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary', 
  size = 'medium',
  className = '',
  ...props 
}) => {
  const baseStyles = {
    padding: size === 'small' ? '8px 16px' : size === 'large' ? '16px 32px' : '12px 24px',
    borderRadius: '8px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: size === 'small' ? '14px' : size === 'large' ? '18px' : '16px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    opacity: disabled ? 0.6 : 1,
  };

  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #C41E3A 0%, #E63950 100%)',
      color: 'white',
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'white',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    },
    outline: {
      background: 'transparent',
      color: '#C41E3A',
      border: '2px solid #C41E3A',
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;