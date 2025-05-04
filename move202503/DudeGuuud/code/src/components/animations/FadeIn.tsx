import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}

export const FadeIn: React.FC<FadeInProps> = ({ 
  children, 
  delay = 0, 
  duration = 0.5 
}) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
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