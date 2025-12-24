import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Conditional motion component that respects theme animation settings
 * Falls back to a regular div when animations are disabled
 */
export const ConditionalMotion = ({ children, animate, initial, exit, transition, whileHover, whileTap, ...props }) => {
  const { settings } = useTheme();

  if (!settings.animations) {
    // Return a regular div when animations are disabled
    return <div {...props}>{children}</div>;
  }

  // Return motion.div when animations are enabled
  return (
    <motion.div
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
      whileHover={whileHover}
      whileTap={whileTap}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default ConditionalMotion;
