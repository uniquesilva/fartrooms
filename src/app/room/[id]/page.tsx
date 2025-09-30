'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { getRoomById, fartRooms } from '@/lib/rooms';
import { ArrowLeft, Send, Shuffle, Volume2, VolumeX, Users } from 'lucide-react';
import FartBubble from '@/components/FartBubble';
import BackgroundAudio from '@/components/BackgroundAudio';
import { useSocket } from '@/hooks/useSocket';

interface Message {
  id: string;
  text: string;
  username: string;
  isAI: boolean;
  timestamp: Date;
  roomId: string;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const [input, setInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showFartBubble, setShowFartBubble] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const room = getRoomById(params.id as string);
  const { messages, memberCount, isConnected, sendMessage } = useSocket(params.id as string);

  useEffect(() => {
    if (!room) {
      router.push('/');
      return;
    }
  }, [room, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim() || !isConnected) return;

    sendMessage(input);
    setInput('');
    setShowFartBubble(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getRandomRoom = () => {
    const randomRoom = fartRooms[Math.floor(Math.random() * fartRooms.length)];
    router.push(`/room/${randomRoom.id}`);
  };

  if (!room) {
    return null;
  }

  return (
    <div className={`min-h-screen ${room.color} p-4 relative`}>
      <BackgroundAudio enabled={audioEnabled} />
      {showFartBubble && (
        <FartBubble onComplete={() => setShowFartBubble(false)} />
      )}
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Hallway
          </button>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`${audioEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'} text-white px-4 py-2 rounded-full transition-colors flex items-center gap-2`}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {audioEnabled ? 'Music On' : 'Music Off'}
            </button>
            <button
              onClick={getRandomRoom}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full transition-colors"
            >
              <Shuffle className="w-4 h-4" />
              Random Room
            </button>
          </div>
        </div>

        {/* Room Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/logo.png"
              alt="Fart Rooms Logo"
              width={50}
              height={50}
              className="rounded-full"
            />
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              {room.emoji} {room.name}
            </h1>
          </div>
          <p className="text-xl text-gray-200 mb-4">{room.description}</p>
          <div className="flex items-center justify-center gap-4 text-white/80">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>{memberCount} farting</span>
            </div>
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">{isConnected ? 'Connected' : 'Connecting...'}</span>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 mb-6 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mb-4 ${message.isAI ? 'text-left' : 'text-right'}`}
              >
                <div
                  className={`inline-block max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${
                    message.isAI
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-500 text-white ml-auto'
                  }`}
                >
                  <p className="text-xs opacity-70 mb-1">
                    {message.isAI ? 'AI' : message.username}
                  </p>
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Chat with ${room.name}...`}
            className="flex-1 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 px-4 py-3 rounded-2xl border border-white/20 focus:outline-none focus:border-white/40"
            disabled={!isConnected}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || !isConnected}
            className="bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white px-6 py-3 rounded-2xl transition-colors flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
