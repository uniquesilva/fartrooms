'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { fartRooms, getRandomRoom } from '@/lib/rooms';
import { Shuffle, Volume2, VolumeX, Users } from 'lucide-react';
import BackgroundAudio from '@/components/BackgroundAudio';
import { io } from 'socket.io-client';

export default function Home() {
  const [randomRoom, setRandomRoom] = useState(getRandomRoom());
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [roomsWithMembers, setRoomsWithMembers] = useState(fartRooms);

  useEffect(() => {
    // Connect to Socket.IO for real-time member counts
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
                     (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const socket = io(socketUrl);

    socket.on('room-counts-updated', (counts: Record<string, number>) => {
      setRoomsWithMembers(prevRooms => 
        prevRooms.map(room => ({
          ...room,
          memberCount: counts[room.id] || 0
        }))
      );
    });

    // Fetch initial counts
    const fetchInitialCounts = async () => {
      try {
        const response = await fetch('/api/room-counts');
        const counts = await response.json();
        setRoomsWithMembers(prevRooms => 
          prevRooms.map(room => ({
            ...room,
            memberCount: counts[room.id] || 0
          }))
        );
      } catch (error) {
        console.error('Failed to fetch room counts:', error);
      }
    };

    fetchInitialCounts();

    return () => {
      socket.disconnect();
    };
  }, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 p-4">
      <BackgroundAudio enabled={audioEnabled} />
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-4 mb-6">
          <Image
            src="/logo.png"
            alt="Fart Rooms Logo"
            width={120}
            height={120}
            className="rounded-full"
          />
          <h1 className="text-6xl md:text-8xl font-bold text-white">
            Fart Rooms
          </h1>
        </div>
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
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`${audioEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'} text-white px-6 py-3 rounded-full transition-colors flex items-center gap-2`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {audioEnabled ? 'Sound On' : 'Sound Off'}
          </button>
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
          {roomsWithMembers.map((room, index) => (
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
                    {room.customImage ? (
                      <div className="mb-3 flex justify-center">
                        <Image
                          src={room.customImage}
                          alt={`${room.name} door`}
                          width={80}
                          height={80}
                          className="rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="text-4xl mb-3">{room.emoji}</div>
                    )}
                    <h3 className="text-xl font-bold text-white mb-2">
                      {room.name}
                    </h3>
                    <p className="text-gray-200 text-sm mb-3">
                      {room.description}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{room.memberCount || 0} farting</span>
                    </div>
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