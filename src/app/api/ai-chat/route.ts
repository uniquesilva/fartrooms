import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getRoomById } from '@/lib/rooms';

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

    console.log('AI Chat API called:', { message, roomId, roomName: room.name, prompt: room.prompt });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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

    const aiResponse = completion.choices[0]?.message?.content || "I'm having trouble thinking right now...";

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json({ error: 'Failed to get AI response' }, { status: 500 });
  }
}
