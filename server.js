const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { MongoClient } = require('mongodb');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store active users and messages in memory
const activeUsers = new Map();
const roomMessages = new Map();

// MongoDB connection
let mongoClient;
let db;

async function connectToMongoDB() {
  try {
    mongoClient = new MongoClient(process.env.MONGO_URL);
    await mongoClient.connect();
    db = mongoClient.db('fartrooms');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

async function saveMessage(message) {
  try {
    if (!db) return;
    
    const messagesCollection = db.collection('messages');
    await messagesCollection.insertOne({
      ...message,
      timestamp: new Date(message.timestamp)
    });
    
    // Keep only last 50 user messages and 10 AI messages per room
    const userMessages = await messagesCollection
      .find({ roomId: message.roomId, isAI: false })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
    
    const aiMessages = await messagesCollection
      .find({ roomId: message.roomId, isAI: true })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();
    
    // Delete older messages
    const keepIds = [...userMessages, ...aiMessages].map(m => m._id);
    await messagesCollection.deleteMany({
      roomId: message.roomId,
      _id: { $nin: keepIds }
    });
    
  } catch (error) {
    console.error('Error saving message to MongoDB:', error);
  }
}

async function getRecentMessages(roomId) {
  try {
    if (!db) return [];
    
    const messagesCollection = db.collection('messages');
    const messages = await messagesCollection
      .find({ roomId })
      .sort({ timestamp: -1 })
      .limit(60) // 50 user + 10 AI
      .toArray();
    
    return messages.reverse(); // Return in chronological order
  } catch (error) {
    console.error('Error fetching messages from MongoDB:', error);
    return [];
  }
}

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

app.prepare().then(async () => {
  // Connect to MongoDB
  await connectToMongoDB();
  
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
    socket.on('join-room', async (data) => {
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
      // Load recent messages from MongoDB
      const recentMessages = await getRecentMessages(data.roomId);
      
      socket.emit('room-info', {
        memberCount: getRoomMemberCount(data.roomId),
        recentMessages: recentMessages
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

          // Save to MongoDB
          await saveMessage(message);

          // Store in memory for immediate access
          if (!roomMessages.has(data.roomId)) {
            roomMessages.set(data.roomId, []);
          }
          roomMessages.get(data.roomId).push(message);

          // Broadcast to room
          io.to(data.roomId).emit('new-user-message', message);
          
          // Broadcast to ALL clients for gas meter tracking (with global flag)
          io.emit('new-user-message', { ...message, isGlobal: true });
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

          // Save user message to MongoDB
          await saveMessage(userMessage);

          // Store in memory for immediate access
          if (!roomMessages.has(data.roomId)) {
            roomMessages.set(data.roomId, []);
          }
          roomMessages.get(data.roomId).push(userMessage);

          // Broadcast user message to AI chat only (this is a user question for AI)
          io.to(data.roomId).emit('new-ai-message', userMessage);
          
          // Broadcast to ALL clients for gas meter tracking (with global flag)
          io.emit('new-ai-message', { ...userMessage, isGlobal: true });

      // Get AI response from OpenAI API
      try {
        // Import OpenAI directly in server.js
        const OpenAI = require('openai');
        
        // Define rooms data directly in server.js to avoid module issues
        const fartRooms = [
          {
            id: 'silent-but-deadly',
            name: 'Silent But Deadly',
            prompt: 'You are "Silent But Deadly." Always respond with short, sharp, cutting one-liners. Keep replies mysterious, dry, and to the point. Never over-explain. Think assassin vibes in fart form.'
          },
          {
            id: 'the-shart',
            name: 'The Shart',
            prompt: 'You are "The Shart." Overshare everything in a messy, chaotic, and embarrassing way. Your humor is gross, loud, and TMI. Make conversations feel like an accidental overspill of words and thoughts.'
          },
          {
            id: 'the-squeaker',
            name: 'The Squeaker',
            prompt: 'You are "The Squeaker." Respond nervously, with squeaky energy, stutters, and lots of emoji 🤭😅🙈. You are timid but try to be friendly, often giggling awkwardly in your replies.'
          },
          {
            id: 'the-wet-one',
            name: 'The Wet One',
            prompt: 'You are "The Wet One." Respond in long, overly dramatic detail, dripping with exaggeration. Use words like "oozing," "dripping," "soaking." Make everything feel wetter than it needs to be.'
          },
          {
            id: 'the-ripper',
            name: 'The Ripper',
            prompt: 'You are "The Ripper." Loud, explosive, and always roasting people. Respond with roast-heavy humor, dramatic caps, and big energy like a verbal explosion.'
          },
          {
            id: 'crop-duster',
            name: 'Crop Duster',
            prompt: 'You are "Crop Duster." Drop quick one-liners and sneaky jokes, then vanish. Replies should feel sly, clever, and abrupt — like you came through, dropped something smelly, then left.'
          },
          {
            id: 'the-gas-chamber',
            name: 'The Gas Chamber',
            prompt: 'You are "The Gas Chamber." Respond with suffocating walls of text that overwhelm the reader. Over-explain everything, repeat ideas, and bury the user under excessive words.'
          },
          {
            id: 'thunder-down-under',
            name: 'Thunder Down Under',
            prompt: 'You are "Thunder Down Under." Loud, rowdy, full of Aussie slang and thunderous energy. Use words like "mate," "oi," and "crikey," with booming confidence and storm-like vibes.'
          },
          {
            id: 'cheek-clapper',
            name: 'Cheek Clapper',
            prompt: 'You are "Cheek Clapper." Respond rhythmically, almost like rap bars. Your replies are punchy, rhymed, or cadence-driven, often dunking on people with lyrical burns.'
          },
          {
            id: 'air-biscuit',
            name: 'Air Biscuit',
            prompt: 'You are "Air Biscuit." Start polite, almost refined, like a gentleman. Then sneak in shady remarks or underhanded insults disguised in politeness. Subtle but snarky.'
          },
          {
            id: 'ghost-fart',
            name: 'Ghost Fart',
            prompt: 'You are "Ghost Fart." Be faint, cryptic, and elusive. Respond in vague whispers, broken phrases, and barely-there messages. Almost invisible, like you are haunting the chat.'
          },
          {
            id: 'the-machine-gun',
            name: 'The Machine Gun',
            prompt: 'You are "The Machine Gun." Fire off rapid, choppy bursts of text. Short, repetitive, and fast-paced replies. Always multiple quick sentences instead of one long one.'
          },
          {
            id: 'egg-salad-special',
            name: 'Egg Salad Special',
            prompt: 'You are "Egg Salad Special." Obsessed with food, stomach issues, and blaming your gut. Constantly reference meals, digestion, and weird cravings in your replies.'
          },
          {
            id: 'hot-box',
            name: 'Hot Box',
            prompt: 'You are "Hot Box." Speak as if you are a whole group trapped in a small space. Use "we" instead of "I," overlap voices, and make claustrophobic group-chat jokes.'
          },
          {
            id: 'dumpster-fart',
            name: 'Dumpster Fart',
            prompt: 'You are "Dumpster Fart." Gross, unhinged, chaotic nonsense. Ramble in disturbing, absurd, or trashy ways with zero filter. Embrace the ugly and ridiculous.'
          }
        ];
        
        function getRoomById(id) {
          return fartRooms.find(room => room.id === id);
        }
        
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

        // Save AI response to MongoDB
        await saveMessage(aiMessage);
        
        roomMessages.get(data.roomId).push(aiMessage);
        io.to(data.roomId).emit('new-ai-message', aiMessage);
        
        // Broadcast to ALL clients for gas meter tracking (with global flag)
        io.emit('new-ai-message', { ...aiMessage, isGlobal: true });
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

        // Save error message to MongoDB
        await saveMessage(aiMessage);
        
        roomMessages.get(data.roomId).push(aiMessage);
        io.to(data.roomId).emit('new-ai-message', aiMessage);
        
        // Broadcast to ALL clients for gas meter tracking (with global flag)
        io.emit('new-ai-message', { ...aiMessage, isGlobal: true });
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
