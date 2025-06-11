import React from 'react';

export default function ButtonConfirm({ onConfirm, children }) {
  const handleClick = () => {
    if (confirm('Are you sure?')) onConfirm();
  };

  return (
    <button
      onClick={handleClick}
      style={{
        background: '#222',
        color: '#fff',
        padding: '8px 16px',
        border: '1px solid #444',
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );
}
