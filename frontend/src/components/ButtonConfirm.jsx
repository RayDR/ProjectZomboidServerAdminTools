import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { Button } from './ui';

export default function ButtonConfirm({
  onConfirm,
  children,
  variant = 'danger',
  confirmText = 'Are you sure?',
  disabled = false,
  className = ''
}) {
  const [open, setOpen] = React.useState(false);

  const handleConfirm = () => {
    setOpen(false);
    onConfirm();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`btn btn-${variant} ${className}`.trim()}
        disabled={disabled}
      >
        {children}
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-warning rounded-lg p-5 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-warning flex items-center mb-3">
              <FaExclamationTriangle className="mr-2" /> Confirm action
            </h3>
            <p className="text-onSurface mb-5">{confirmText}</p>
            <div className="flex justify-end gap-3">
              <Button variant="surface" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant={variant} onClick={handleConfirm}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
