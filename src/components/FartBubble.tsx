'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface FartBubbleProps {
  onComplete?: () => void;
}

export default function FartBubble({ onComplete }: FartBubbleProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ 
        scale: 0, 
        opacity: 0,
        x: Math.random() * 200 - 100,
        y: 0
      }}
      animate={{ 
        scale: [0, 1, 1.2, 0.8],
        opacity: [0, 1, 1, 0],
        y: -200,
        x: Math.random() * 100 - 50
      }}
      transition={{ 
        duration: 3,
        ease: "easeOut"
      }}
      className="absolute pointer-events-none z-50"
      style={{
        left: '50%',
        top: '100%',
      }}
    >
      <div className="w-8 h-8 bg-green-400 rounded-full opacity-60 flex items-center justify-center">
        <span className="text-xs">💨</span>
      </div>
    </motion.div>
  );
}
