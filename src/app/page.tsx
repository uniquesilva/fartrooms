'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { fartRooms, getRandomRoom } from '@/lib/rooms';
import { Shuffle } from 'lucide-react';

export default function Home() {
  const [randomRoom, setRandomRoom] = useState(getRandomRoom());


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 p-4">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-4">
          🌬️ Fart Rooms
        </h1>
        <p className="text-xl md:text-2xl text-pink-200 mb-8">
          Enter the most ridiculous AI chatrooms on the internet
        </p>
        <div className="flex justify-center gap-4 mb-8">
          <a 
            href="https://x.com/FartRooms" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full transition-colors"
          >
            Follow on X
          </a>
          <a 
            href="https://t.me/fartrooms" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full transition-colors"
          >
            Join Telegram
          </a>
        </div>
      </motion.div>

      {/* Random Room Button */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-16"
      >
        <Link 
          href={`/room/${randomRoom.id}`}
          className="inline-block"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold py-4 px-8 rounded-full text-xl shadow-lg flex items-center gap-3 mx-auto"
          >
            <Shuffle className="w-6 h-6" />
            Send me to a random fart room!
          </motion.button>
        </Link>
        <p className="text-pink-200 mt-4">
          Currently featuring: <span className="font-bold">{randomRoom.name}</span>
        </p>
      </motion.div>

      {/* Room Grid */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Choose Your Fart Room
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {fartRooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href={`/room/${room.id}`}>
                <div className={`${room.color} p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-white/20`}>
                  <div className="text-center">
                    <div className="text-4xl mb-3">{room.emoji}</div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {room.name}
                    </h3>
                    <p className="text-gray-200 text-sm">
                      {room.description}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center mt-16 text-pink-200"
      >
        <p className="text-lg">
          No login • No wallet • No signup • Just pure fart chaos
        </p>
        <p className="text-sm mt-2">
          Powered by AI • Hosted on Railway • Domain by Namecheap
        </p>
      </motion.div>
    </div>
  );
}