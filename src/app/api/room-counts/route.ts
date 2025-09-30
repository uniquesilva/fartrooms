import { NextRequest, NextResponse } from 'next/server';

// This will be populated by the server.js with real-time data
let roomCounts: Record<string, number> = {};

export function GET() {
  return NextResponse.json(roomCounts);
}

// Function to update counts (called from server.js)
export function updateRoomCounts(counts: Record<string, number>) {
  roomCounts = counts;
}
