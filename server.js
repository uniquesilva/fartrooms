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
    socket.on('send-message', async (data) => {
      const user = activeUsers.get(socket.id);
      if (!user) return;

      const message = {
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
      roomMessages.get(data.roomId).push(message);

      // Broadcast to room
      io.to(data.roomId).emit('new-message', message);

      // Simple AI response (you can enhance this with OpenAI API)
      setTimeout(() => {
        const aiResponse = `AI: ${data.text}... but with more fart energy! 💨`;
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          text: aiResponse,
          username: 'AI',
          isAI: true,
          timestamp: new Date(),
          roomId: data.roomId
        };

        roomMessages.get(data.roomId).push(aiMessage);
        io.to(data.roomId).emit('new-message', aiMessage);
      }, 1000);
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

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
