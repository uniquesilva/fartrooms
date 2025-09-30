'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GasMeterProps {
  totalMessages: number;
  onGasExplosion: () => void;
}

export default function GasMeter({ totalMessages, onGasExplosion }: GasMeterProps) {
  const [gasLevel, setGasLevel] = useState(0);
  const [showExplosion, setShowExplosion] = useState(false);
  
  // Gas meter fills up based on total messages (every 10 messages = 10% gas)
  const maxGas = 100;
  const messagesPerGas = 10;
  const currentGas = Math.min((totalMessages * 10) % maxGas, maxGas);
  
  useEffect(() => {
    setGasLevel(currentGas);
    
    // Trigger explosion when gas meter is full
    if (currentGas >= maxGas) {
      setShowExplosion(true);
      onGasExplosion();
      
      // Reset gas meter after explosion
      setTimeout(() => {
        setShowExplosion(false);
        setGasLevel(0);
      }, 3000);
    }
  }, [currentGas, onGasExplosion]);

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      {/* Gas Meter Container */}
      <div className="bg-gray-800 rounded-2xl p-6 border-2 border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🌬️ Gas Meter
          </h2>
          <div className="text-white/80 text-sm">
            {totalMessages} messages • {Math.round(gasLevel)}% full
          </div>
        </div>
        
        {/* Gas Meter Bar */}
        <div className="relative">
          <div className="w-full h-8 bg-gray-700 rounded-full overflow-hidden border-2 border-gray-600">
            <motion.div
              className={`h-full rounded-full transition-all duration-500 ${
                gasLevel < 30 ? 'bg-green-500' :
                gasLevel < 60 ? 'bg-yellow-500' :
                gasLevel < 90 ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              style={{ width: `${gasLevel}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${gasLevel}%` }}
            />
          </div>
          
          {/* Gas Level Indicators */}
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
        
        {/* Warning Messages */}
        {gasLevel >= 75 && gasLevel < 100 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center"
          >
            <p className="text-yellow-400 font-bold text-lg">
              ⚠️ WARNING: Gas levels critical! 💨
            </p>
          </motion.div>
        )}
        
        {gasLevel >= 90 && gasLevel < 100 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-center"
          >
            <p className="text-red-400 font-bold text-xl">
              🚨 IMMINENT EXPLOSION! 🚨
            </p>
          </motion.div>
        )}
      </div>
      
      {/* Giant Fart Cloud Animation */}
      <AnimatePresence>
        {showExplosion && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 0.8, 0.6, 0.4, 0],
              scale: [0, 1.2, 1.5, 2, 0],
              y: [0, -50, -100, -150, -200]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
          >
            <div className="text-9xl md:text-[12rem] font-bold text-white/90 drop-shadow-2xl">
              💨💨💨
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
