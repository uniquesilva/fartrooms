'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  text: string;
  username: string;
  isAI: boolean;
  isAiChat?: boolean;
  isGlobal?: boolean; // Added for gas meter tracking
  timestamp: Date;
  roomId: string;
  replyTo?: string;
  replyToUsername?: string;
}

interface RoomInfo {
  memberCount: number;
  recentMessages: Message[];
}

export function useSocket(roomId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [userMessages, setUserMessages] = useState<Message[]>([]);
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
                     (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const newSocket = io(socketUrl);
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join-room', { roomId });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('room-info', (info: RoomInfo) => {
      // Separate messages by chat type
      const userMsgs = info.recentMessages.filter(msg => !msg.isAI && !msg.isAiChat);
      const aiMsgs = info.recentMessages.filter(msg => msg.isAI || msg.isAiChat);
      setUserMessages(userMsgs);
      setAiMessages(aiMsgs);
      setMemberCount(info.memberCount);
    });

        newSocket.on('new-user-message', (message: Message) => {
          // Only add to chat if it's not a global message for gas meter
          if (!message.isGlobal) {
            setUserMessages(prev => [...prev, message]);
          }
        });

        newSocket.on('new-ai-message', (message: Message) => {
          // Only add to AI messages if it's an AI chat message and not global
          if ((message.isAiChat || message.isAI) && !message.isGlobal) {
            setAiMessages(prev => [...prev, message]);
          }
        });

    newSocket.on('user-joined', (data: { username: string; memberCount: number }) => {
      setMemberCount(data.memberCount);
      // You could add a notification here
    });

    newSocket.on('user-left', (data: { username: string; memberCount: number }) => {
      setMemberCount(data.memberCount);
      // You could add a notification here
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [roomId]);

  const sendUserMessage = (text: string, replyTo?: string, replyToUsername?: string) => {
    if (socket && isConnected) {
      socket.emit('send-user-message', { text, roomId, replyTo, replyToUsername });
    }
  };

  const sendAiMessage = (text: string) => {
    if (socket && isConnected) {
      socket.emit('send-ai-message', { text, roomId });
    }
  };

  return {
    socket,
    userMessages,
    aiMessages,
    memberCount,
    isConnected,
    sendUserMessage,
    sendAiMessage
  };
}
