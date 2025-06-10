import React, { useState } from 'react';

export default function CollapsibleGroup({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ border: '1px solid #444', marginBottom: '1rem', borderRadius: 5 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ cursor: 'pointer', background: '#333', padding: '0.5rem', fontWeight: 'bold' }}
      >
        {open ? '▼' : '▶'} {title}
      </div>
      {open && <div style={{ padding: '1rem' }}>{children}</div>}
    </div>
  );
}
