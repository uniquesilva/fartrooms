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
  isAiChat?: boolean;
  timestamp: Date;
  roomId: string;
  replyTo?: string;
  replyToUsername?: string;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const room = getRoomById(params.id);
  return {
    title: room ? `${room.name} - Fart Rooms` : 'Fart Room - Fart Rooms',
    description: room ? `Chat with ${room.name} AI: ${room.description}` : 'Enter the most ridiculous AI chatrooms'
  };
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const [userInput, setUserInput] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showFartBubble, setShowFartBubble] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [userChatCooldown, setUserChatCooldown] = useState(0);
  const [aiChatCooldown, setAiChatCooldown] = useState(0);
  const [replyingTo, setReplyingTo] = useState<{username: string, messageId: string} | null>(null);
  const userMessagesEndRef = useRef<HTMLDivElement>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);

  const room = getRoomById(params.id as string);
  const { userMessages, aiMessages, memberCount, isConnected, sendUserMessage, sendAiMessage } = useSocket(params.id as string);

  useEffect(() => {
    if (!room) {
      router.push('/');
      return;
    }
  }, [room, router]);

  // Cooldown timers
  useEffect(() => {
    if (userChatCooldown > 0) {
      const timer = setTimeout(() => setUserChatCooldown(userChatCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [userChatCooldown]);

  useEffect(() => {
    if (aiChatCooldown > 0) {
      const timer = setTimeout(() => setAiChatCooldown(aiChatCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [aiChatCooldown]);

  useEffect(() => {
    userMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [userMessages]);

  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const handleSendUserMessage = () => {
    if (!userInput.trim() || !isConnected || userChatCooldown > 0) return;

    sendUserMessage(userInput, replyingTo?.messageId, replyingTo?.username);
    setUserInput('');
    setReplyingTo(null);
    setUserChatCooldown(5);
    setShowFartBubble(true);
  };

  const handleSendAiMessage = () => {
    if (!aiInput.trim() || !isConnected || aiChatCooldown > 0) return;

    // Add user question to AI chat immediately
    const userQuestion = {
      id: Date.now().toString(),
      text: aiInput,
      username: 'You',
      isAI: false,
      timestamp: new Date(),
      roomId: params.id as string
    };
    
    // This will be handled by the socket, but we add it locally for immediate display
    setAiInput('');
    setAiChatCooldown(5);
    setShowFartBubble(true);
    
    sendAiMessage(aiInput);
  };

  const handleUserKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendUserMessage();
    }
  };

  const handleAiKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendAiMessage();
    }
  };

  const handleReplyToUser = (username: string, messageId: string) => {
    setReplyingTo({ username, messageId });
    setUserInput(`@${username} `);
  };

  const getRandomRoom = () => {
    const randomRoom = fartRooms[Math.floor(Math.random() * fartRooms.length)];
    router.push(`/room/${randomRoom.id}`);
  };

  if (!room) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 p-4 relative">
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
              width={80}
              height={80}
              className="rounded-full"
            />
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              {room.name}
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

        {/* Dual Chat System */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* User Chat */}
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Chat
              {userChatCooldown > 0 && (
                <span className="text-sm text-red-400">({userChatCooldown}s cooldown)</span>
              )}
            </h3>
            <div className="max-h-80 overflow-y-auto mb-4">
              <AnimatePresence>
                {userMessages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mb-4 text-right"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleReplyToUser(message.username, message.id);
                    }}
                  >
                    <div className="inline-block max-w-xs md:max-w-md px-4 py-2 rounded-2xl bg-gray-700 text-white border border-gray-600 ml-auto cursor-pointer hover:bg-gray-600 transition-colors">
                      {message.replyToUsername && (
                        <p className="text-xs text-blue-300 mb-1">↳ Replying to {message.replyToUsername}</p>
                      )}
                      <p className="text-xs opacity-70 mb-1">{message.username}</p>
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={userMessagesEndRef} />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleUserKeyPress}
                placeholder={replyingTo ? `Reply to ${replyingTo.username}...` : "Chat with other users..."}
                className="flex-1 bg-gray-800 text-white placeholder-gray-400 px-4 py-3 rounded-2xl border border-gray-700 focus:outline-none focus:border-gray-500"
                disabled={!isConnected || userChatCooldown > 0}
              />
              <button
                onClick={handleSendUserMessage}
                disabled={!userInput.trim() || !isConnected || userChatCooldown > 0}
                className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white px-4 py-3 rounded-2xl transition-colors flex items-center gap-2 border border-gray-600"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {replyingTo && (
              <div className="mt-2 text-sm text-blue-300">
                Replying to {replyingTo.username}
                <button 
                  onClick={() => setReplyingTo(null)}
                  className="ml-2 text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* AI Chat */}
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">{room.emoji}</span>
              AI Chat
              {aiChatCooldown > 0 && (
                <span className="text-sm text-red-400">({aiChatCooldown}s cooldown)</span>
              )}
            </h3>
            <div className="max-h-80 overflow-y-auto mb-4">
              <AnimatePresence>
                {aiMessages.map((message, index) => {
                  // Group user questions with AI responses
                  const isUserMessage = !message.isAI;
                  const nextMessage = aiMessages[index + 1];
                  const isPairedWithAI = isUserMessage && nextMessage && nextMessage.isAI;
                  
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`mb-4 ${message.isAI ? 'text-left' : 'text-right'}`}
                    >
                      <div className={`inline-block max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${
                        message.isAI
                          ? 'bg-gray-800 text-white border border-gray-700'
                          : 'bg-blue-600 text-white border border-blue-500 ml-auto'
                      }`}>
                        <p className="text-xs opacity-70 mb-1">
                          {message.isAI ? 'AI' : message.username}
                        </p>
                        <p className="text-sm">{message.text}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={aiMessagesEndRef} />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyPress={handleAiKeyPress}
                placeholder={`Chat with ${room.name} AI...`}
                className="flex-1 bg-gray-800 text-white placeholder-gray-400 px-4 py-3 rounded-2xl border border-gray-700 focus:outline-none focus:border-gray-500"
                disabled={!isConnected || aiChatCooldown > 0}
              />
              <button
                onClick={handleSendAiMessage}
                disabled={!aiInput.trim() || !isConnected || aiChatCooldown > 0}
                className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white px-4 py-3 rounded-2xl transition-colors flex items-center gap-2 border border-gray-600"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
