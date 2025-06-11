import React, { useState } from 'react';

export default function CollapsibleGroup({ title, children }) {
  const [open, setOpen] = useState(true);

  return (
    <div
      style={{
        border: '1px solid #555',
        marginBottom: '1.5rem',
        borderRadius: '8px',
        background: '#1a1a1a',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
      }}
    >
      <div
        onClick={() => setOpen(!open)}
        style={{
          cursor: 'pointer',
          background: '#222',
          padding: '0.75rem 1rem',
          fontWeight: 'bold',
          fontSize: '1rem',
          color: '#eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #333',
          userSelect: 'none'
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: '1.2rem' }}>{open ? '▾' : '▸'}</span>
      </div>
      {open && (
        <div
          style={{
            padding: '1rem',
            background: '#111',
            color: '#ccc',
            fontSize: '0.95rem'
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
