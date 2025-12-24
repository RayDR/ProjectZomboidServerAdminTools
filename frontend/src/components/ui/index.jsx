import { motion } from 'framer-motion';
import clsx from 'clsx';

export const Button = ({ 
  children, 
  variant = 'primary', 
  className, 
  disabled,
  loading,
  onClick,
  ...props 
}) => {
  const variants = {
    primary: 'btn-primary',
    danger: 'btn-danger',
    secondary: 'btn-secondary',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.05 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
      className={clsx('btn', variants[variant], className)}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="spinner mr-2"></span>}
      {children}
    </motion.button>
  );
};

export const Badge = ({ children, variant = 'success', className }) => {
  const variants = {
    success: 'badge-success',
    error: 'badge-error',
    warning: 'badge-warning',
  };

  return (
    <span className={clsx('badge', variants[variant], className)}>
      {children}
    </span>
  );
};

export const Card = ({ children, className, hover = true, ...props }) => {
  const Component = hover ? motion.div : 'div';
  const motionProps = hover ? {
    whileHover: { scale: 1.02 },
    transition: { type: 'spring', stiffness: 300 }
  } : {};

  return (
    <Component
      className={clsx('zombie-card', className)}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export const Alert = ({ children, variant = 'error', className, onClose }) => {
  const variants = {
    error: 'alert-error',
    success: 'alert-success',
    warning: 'alert-warning',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={clsx('alert', variants[variant], className)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-xl hover:opacity-70 transition-opacity"
          >
            ×
          </button>
        )}
      </div>
    </motion.div>
  );
};

export const Modal = ({ isOpen, onClose, title, children, className }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={clsx(
          'bg-zombie-gray border-4 border-zombie-green rounded-lg shadow-zombie max-w-2xl w-full max-h-[90vh] overflow-auto',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="border-b-2 border-zombie-green p-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-terminal-text text-shadow-terminal">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-3xl text-terminal-text hover:text-zombie-blood transition-colors"
            >
              ×
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </motion.div>
    </motion.div>
  );
};

export const Input = ({ label, error, className, ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-terminal-text mb-2 font-bold uppercase text-sm">
          {label}
        </label>
      )}
      <input
        className={clsx('input', error && 'border-zombie-blood', className)}
        {...props}
      />
      {error && (
        <p className="text-zombie-error text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export const Spinner = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={clsx('spinner', sizes[size], className)}></div>
  );
};
