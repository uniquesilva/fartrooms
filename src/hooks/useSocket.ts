'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  text: string;
  username: string;
  isAI: boolean;
  timestamp: Date;
  roomId: string;
}

interface RoomInfo {
  memberCount: number;
  recentMessages: Message[];
}

export function useSocket(roomId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
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
      setMessages(info.recentMessages);
      setMemberCount(info.memberCount);
    });

    newSocket.on('new-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
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

  const sendMessage = (text: string) => {
    if (socket && isConnected) {
      socket.emit('send-message', { text, roomId });
    }
  };

  return {
    socket,
    messages,
    memberCount,
    isConnected,
    sendMessage
  };
}
