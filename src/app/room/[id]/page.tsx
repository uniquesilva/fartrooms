'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getRoomById, fartRooms } from '@/lib/rooms';
import { ArrowLeft, Send, Shuffle, Volume2, VolumeX } from 'lucide-react';
import FartBubble from '@/components/FartBubble';
import BackgroundAudio from '@/components/BackgroundAudio';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showFartBubble, setShowFartBubble] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const room = getRoomById(params.id as string);

  useEffect(() => {
    if (!room) {
      router.push('/');
      return;
    }

    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      text: `Welcome to ${room.name}! ${room.emoji} ${room.description}`,
      isUser: false,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [room, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowFartBubble(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          roomId: room?.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having a gas problem right now... Try again!",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
            {room.emoji} {room.name}
          </h1>
          <p className="text-xl text-gray-200">{room.description}</p>
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
                className={`mb-4 ${message.isUser ? 'text-right' : 'text-left'}`}
              >
                <div
                  className={`inline-block max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${
                    message.isUser
                      ? 'bg-blue-500 text-white ml-auto'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-left"
            >
              <div className="inline-block bg-white/20 text-white px-4 py-2 rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </motion.div>
          )}
          
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
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white px-6 py-3 rounded-2xl transition-colors flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
