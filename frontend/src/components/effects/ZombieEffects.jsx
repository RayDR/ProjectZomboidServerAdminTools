import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

// Scanner line effect (como pantalla de terminal)
export const ScannerLine = () => {
  return <div className="scanner-line"></div>;
};

// Blood drip effect
export const BloodDrip = ({ delay = 0 }) => {
  return (
    <motion.div
      className="blood-drip"
      initial={{ y: -100, opacity: 0 }}
      animate={{
        y: ['-100%', '100vh'],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: 3,
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 5,
      }}
    />
  );
};

// Glitch text effect
export const GlitchText = ({ children, className }) => {
  const { settings } = useTheme();
  
  if (!settings.animations) {
    return <span className={className}>{children}</span>;
  }
  
  return (
    <motion.span
      className={`glitch ${className}`}
      animate={{
        x: [0, -2, 2, -2, 2, 0],
        textShadow: [
          '0 0 0px rgba(0,255,0,0)',
          '-2px 0 5px rgba(255,0,0,0.8)',
          '2px 0 5px rgba(0,255,0,0.8)',
          '0 0 0px rgba(0,255,0,0)',
        ],
      }}
      transition={{
        duration: 0.2,
        repeat: Infinity,
        repeatDelay: 5 + Math.random() * 10,
      }}
    >
      {children}
    </motion.span>
  );
};

// Terminal typing effect
export const TerminalText = ({ text, speed = 50, onComplete }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span className="font-mono text-terminal-text">
      {displayText}
      {currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="text-zombie-green"
        >
          _
        </motion.span>
      )}
    </span>
  );
};

// CRT Screen effect wrapper
export const CRTScreen = ({ children, className }) => {
  return (
    <div className={`terminal-screen relative overflow-hidden ${className}`}>
      <ScannerLine />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

// Zombie hand reaching effect
export const ZombieHand = () => {
  return (
    <motion.div
      className="fixed bottom-0 right-0 text-8xl pointer-events-none"
      initial={{ y: 100, rotate: -20 }}
      animate={{ 
        y: [100, 20, 100],
        rotate: [-20, -10, -20],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        repeatDelay: 10,
      }}
    >
      🧟
    </motion.div>
  );
};

// Floating particles effect
export const FloatingParticles = ({ count = 20 }) => {
  const { settings } = useTheme();
  
  if (!settings.animations) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-zombie-green opacity-30 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            y: [null, -100],
            x: [null, Math.random() * 100 - 50],
            opacity: [0.3, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}
    </div>
  );
};

// Status indicator (pulsing)
export const StatusIndicator = ({ status = 'online' }) => {
  const { settings } = useTheme();
  const colors = {
    online: 'bg-zombie-success',
    offline: 'bg-zombie-blood',
    warning: 'bg-zombie-warning',
  };

  if (!settings.animations) {
    return <div className={`w-3 h-3 rounded-full ${colors[status]}`} />;
  }

  return (
    <motion.div
      className={`w-3 h-3 rounded-full ${colors[status]}`}
      animate={{
        scale: [1, 1.3, 1],
        opacity: [1, 0.7, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
      }}
    />
  );
};

// Loading screen with zombie theme
export const LoadingScreen = ({ message = 'LOADING...' }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-zombie-gray-dark flex flex-col items-center justify-center z-50"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="text-8xl mb-8"
      >
        ☣️
      </motion.div>
      <GlitchText className="text-4xl font-bold text-terminal-text text-shadow-terminal">
        {message}
      </GlitchText>
      <div className="mt-8 flex space-x-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-4 h-4 bg-zombie-blood rounded-full"
            animate={{
              y: [0, -20, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

// Warning flash effect
export const WarningFlash = ({ active }) => {
  const { settings } = useTheme();
  
  if (!active || !settings.animations) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-zombie-blood pointer-events-none z-40"
      animate={{
        opacity: [0, 0.3, 0],
      }}
      transition={{
        duration: 0.5,
        repeat: Infinity,
      }}
    />
  );
};
