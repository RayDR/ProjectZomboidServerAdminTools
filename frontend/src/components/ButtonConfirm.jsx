import React from 'react';

export default function ButtonConfirm({ onConfirm, children }) {
  const handleClick = () => {
    if (confirm('Are you sure?')) onConfirm();
  };

  return <button onClick={handleClick}>{children}</button>;
}
