import React from 'react';
import { motion } from 'framer-motion';
import { SortAsc, SortDesc } from 'lucide-react';

const SortButton = ({ label, active, order, onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        padding: '6px 12px',
        background: active 
          ? 'rgba(59, 130, 246, 0.2)'
          : 'rgba(255, 255, 255, 0.1)',
        border: active 
          ? '1px solid rgba(59, 130, 246, 0.3)'
          : '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        color: active ? '#3B82F6' : 'white',
        fontSize: '0.75rem',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'all 0.3s ease',
      }}
    >
      {label}
      {active && order && (
        order === 'desc' ? <SortDesc size={12} /> : <SortAsc size={12} />
      )}
    </motion.button>
  );
};

export default SortButton;