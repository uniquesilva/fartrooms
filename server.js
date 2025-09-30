const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store active users and messages in memory
const activeUsers = new Map();
const roomMessages = new Map();

// Simple username generator
const fartAdjectives = ['Silent', 'Loud', 'Wet', 'Dry', 'Stinky', 'Fresh', 'Hot', 'Cold', 'Quick', 'Slow', 'Big', 'Small', 'Mysterious', 'Obvious', 'Sneaky', 'Bold', 'Shy', 'Angry', 'Happy', 'Sad', 'Excited', 'Calm'];
const fartNouns = ['Farter', 'Gasbag', 'Windmaker', 'Bubble', 'Puff', 'Blast', 'Rip', 'Squeak', 'Thunder', 'Whisper', 'Roar', 'Sigh', 'Huff', 'Puff', 'Breeze', 'Gust', 'Storm', 'Tornado', 'Hurricane', 'Cyclone'];
const fartColors = ['Green', 'Brown', 'Yellow', 'Orange', 'Red', 'Purple', 'Blue', 'Pink', 'Gray', 'Black', 'White', 'Silver', 'Gold'];

function generateRandomUsername() {
  const adjective = fartAdjectives[Math.floor(Math.random() * fartAdjectives.length)];
  const noun = fartNouns[Math.floor(Math.random() * fartNouns.length)];
  const color = fartColors[Math.floor(Math.random() * fartColors.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  return `${color}${adjective}${noun}${number}`;
}

function getRoomMemberCount(roomId) {
  return Array.from(activeUsers.values()).filter(user => user.roomId === roomId).length;
}

// Store room member counts for API access
const roomMemberCounts = new Map();

function updateRoomMemberCounts() {
  // Clear all counts
  roomMemberCounts.clear();
  
  // Count members in each room
  activeUsers.forEach(user => {
    const currentCount = roomMemberCounts.get(user.roomId) || 0;
    roomMemberCounts.set(user.roomId, currentCount + 1);
  });
}

app.prepare().then(() => {
  const server = createServer(handle);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO handling
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User joins a room
    socket.on('join-room', (data) => {
      const username = generateRandomUsername();
      const user = {
        id: socket.id,
        username,
        roomId: data.roomId
      };

      activeUsers.set(socket.id, user);
      socket.join(data.roomId);
      
      // Update member counts
      updateRoomMemberCounts();

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
      
      // Broadcast updated member counts to all clients
      const countsObject = Object.fromEntries(roomMemberCounts);
      io.emit('room-counts-updated', countsObject);
      
      // Update API endpoint (if available)
      try {
        const { updateRoomCounts } = require('./src/app/api/room-counts/route');
        updateRoomCounts(countsObject);
      } catch (error) {
        // API route not available in server context, that's okay
      }

      console.log(`${username} joined room ${data.roomId}`);
    });

    // User sends a message to other users
    socket.on('send-user-message', async (data) => {
      const user = activeUsers.get(socket.id);
      if (!user) return;

      const message = {
        id: Date.now().toString(),
        text: data.text,
        username: user.username,
        isAI: false,
        timestamp: new Date(),
        roomId: data.roomId,
        replyTo: data.replyTo,
        replyToUsername: data.replyToUsername
      };

      // Store message
      if (!roomMessages.has(data.roomId)) {
        roomMessages.set(data.roomId, []);
      }
      roomMessages.get(data.roomId).push(message);

      // Broadcast to room
      io.to(data.roomId).emit('new-user-message', message);
    });

    // User sends a message to AI
    socket.on('send-ai-message', async (data) => {
      const user = activeUsers.get(socket.id);
      if (!user) return;

      const userMessage = {
        id: Date.now().toString(),
        text: data.text,
        username: user.username,
        isAI: false,
        isAiChat: true,
        timestamp: new Date(),
        roomId: data.roomId
      };

      // Store user message
      if (!roomMessages.has(data.roomId)) {
        roomMessages.set(data.roomId, []);
      }
      roomMessages.get(data.roomId).push(userMessage);

      // Broadcast user message to AI chat only (this is a user question for AI)
      io.to(data.roomId).emit('new-ai-message', userMessage);

      // Get AI response from OpenAI API
      try {
        // Import OpenAI directly in server.js
        const OpenAI = require('openai');
        const { getRoomById } = require('./src/lib/rooms');
        
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const room = getRoomById(data.roomId);
        if (!room) {
          throw new Error('Room not found');
        }

        console.log('AI Chat API called:', { message: data.text, roomId: data.roomId, roomName: room.name });

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: room.prompt
            },
            {
              role: "user",
              content: data.text
            }
          ],
          max_tokens: 150,
          temperature: 0.8,
        });

        const responseText = completion.choices[0]?.message?.content || "I'm having trouble thinking right now...";

        const aiMessage = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          username: 'AI',
          isAI: true,
          timestamp: new Date(),
          roomId: data.roomId
        };

        roomMessages.get(data.roomId).push(aiMessage);
        io.to(data.roomId).emit('new-ai-message', aiMessage);
      } catch (error) {
        console.error('AI Chat error:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          roomId: data.roomId,
          hasApiKey: !!process.env.OPENAI_API_KEY
        });
        
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          text: `Error: ${error.message}`,
          username: 'AI',
          isAI: true,
          timestamp: new Date(),
          roomId: data.roomId
        };

        roomMessages.get(data.roomId).push(aiMessage);
        io.to(data.roomId).emit('new-ai-message', aiMessage);
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
        
        // Update member counts
        updateRoomMemberCounts();
        
        // Broadcast updated member counts to all clients
        const countsObject = Object.fromEntries(roomMemberCounts);
        io.emit('room-counts-updated', countsObject);
        
        // Update API endpoint (if available)
        try {
          const { updateRoomCounts } = require('./src/app/api/room-counts/route');
          updateRoomCounts(countsObject);
        } catch (error) {
          // API route not available in server context, that's okay
        }
        
        console.log(`${user.username} left room ${user.roomId}`);
      }
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
