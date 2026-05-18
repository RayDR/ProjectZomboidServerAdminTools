import React, { useState } from 'react';

export default function CollapsibleGroup({ title, children }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-border mb-6 rounded-lg bg-surfaceAlt overflow-hidden shadow-md">
      <div
        onClick={() => setOpen(!open)}
        className="cursor-pointer bg-surface px-4 py-3 font-bold text-base text-text flex items-center justify-between border-b border-border select-none"
      >
        <span>{title}</span>
        <span className="text-xl">{open ? '▾' : '▸'}</span>
      </div>
      {open && (
        <div className="p-4 bg-background text-muted text-[0.95rem]">
          {children}
        </div>
      )}
    </div>
  );
}
