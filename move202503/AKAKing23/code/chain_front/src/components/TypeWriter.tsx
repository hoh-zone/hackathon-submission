import React, { useState, useEffect } from 'react';

interface TypeWriterProps {
  text: string;
  delay?: number;
}

const TypeWriter: React.FC<TypeWriterProps> = ({ text, delay = 100 }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(currentIndex + 1);
      }, delay);
      
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text]);

  return <span>{displayText}</span>;
};

export default TypeWriter; 