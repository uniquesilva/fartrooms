import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';
import { generateRandomUsername } from './usernames';

interface User {
  id: string;
  username: string;
  roomId: string;
}

interface Message {
  id: string;
  text: string;
  username: string;
  isAI: boolean;
  timestamp: Date;
  roomId: string;
}

// Store active users and messages in memory (in production, use Redis)
const activeUsers = new Map<string, User>();
const roomMessages = new Map<string, Message[]>();

export function initializeSocket(io: SocketIOServer) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User joins a room
    socket.on('join-room', (data: { roomId: string }) => {
      const username = generateRandomUsername();
      const user: User = {
        id: socket.id,
        username,
        roomId: data.roomId
      };

      activeUsers.set(socket.id, user);
      socket.join(data.roomId);

      // Notify room about new user
      socket.to(data.roomId).emit('user-joined', {
        username,
        memberCount: getRoomMemberCount(data.roomId)
      });

      // Send current room members to the new user
      socket.emit('room-info', {
        memberCount: getRoomMemberCount(data.roomId),
        recentMessages: roomMessages.get(data.roomId) || []
      });

      console.log(`${username} joined room ${data.roomId}`);
    });

    // User sends a message
    socket.on('send-message', async (data: { text: string; roomId: string }) => {
      const user = activeUsers.get(socket.id);
      if (!user) return;

      const message: Message = {
        id: Date.now().toString(),
        text: data.text,
        username: user.username,
        isAI: false,
        timestamp: new Date(),
        roomId: data.roomId
      };

      // Store message
      if (!roomMessages.has(data.roomId)) {
        roomMessages.set(data.roomId, []);
      }
      roomMessages.get(data.roomId)!.push(message);

      // Broadcast to room
      io.to(data.roomId).emit('new-message', message);

      // Get AI response (you can implement this with your OpenAI API)
      try {
        const aiResponse = await getAIResponse(data.text, data.roomId);
        if (aiResponse) {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: aiResponse,
            username: 'AI',
            isAI: true,
            timestamp: new Date(),
            roomId: data.roomId
          };

          roomMessages.get(data.roomId)!.push(aiMessage);
          io.to(data.roomId).emit('new-message', aiMessage);
        }
      } catch (error) {
        console.error('AI response error:', error);
      }
    });

    // User leaves
    socket.on('disconnect', () => {
      const user = activeUsers.get(socket.id);
      if (user) {
        socket.to(user.roomId).emit('user-left', {
          username: user.username,
          memberCount: getRoomMemberCount(user.roomId) - 1
        });
        activeUsers.delete(socket.id);
        console.log(`${user.username} left room ${user.roomId}`);
      }
    });
  });
}

function getRoomMemberCount(roomId: string): number {
  return Array.from(activeUsers.values()).filter(user => user.roomId === roomId).length;
}

async function getAIResponse(message: string, roomId: string): Promise<string | null> {
  // This will be implemented with your OpenAI API
  // For now, return a placeholder
  return `AI response to: ${message}`;
}
