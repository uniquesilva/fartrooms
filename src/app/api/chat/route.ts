import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getRoomById } from '@/lib/rooms';
import clientPromise from '@/lib/mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, roomId } = await request.json();

    if (!message || !roomId) {
      return NextResponse.json({ error: 'Message and roomId are required' }, { status: 400 });
    }

    const room = getRoomById(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using GPT-4o Mini as specified
      messages: [
        {
          role: "system",
          content: room.prompt
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 150,
      temperature: 0.8,
    });

    const aiResponse = completion.choices[0]?.message?.content || "Sorry, I'm having a gas problem right now...";

    // Log the interaction to database
    try {
      const client = await clientPromise;
      const db = client.db('fartrooms');
      await db.collection('messages').insertOne({
        roomId,
        userMessage: message,
        aiResponse,
        timestamp: new Date(),
        roomName: room.name
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Continue even if database fails
    }

    return NextResponse.json({ 
      response: aiResponse,
      roomName: room.name,
      roomEmoji: room.emoji
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong in the fart room...' }, 
      { status: 500 }
    );
  }
}
