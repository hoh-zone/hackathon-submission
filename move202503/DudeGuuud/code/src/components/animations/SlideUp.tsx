import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SlideUpProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
}

export const SlideUp: React.FC<SlideUpProps> = ({ 
  children, 
  delay = 0, 
  duration = 0.5,
  distance = 50
}) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: distance }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: distance }}
        transition={{
          duration,
          delay,
          ease: 'easeOut',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}; 