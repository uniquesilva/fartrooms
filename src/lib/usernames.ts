const fartAdjectives = [
  'Silent', 'Loud', 'Wet', 'Dry', 'Stinky', 'Fresh', 'Hot', 'Cold',
  'Quick', 'Slow', 'Big', 'Small', 'Mysterious', 'Obvious', 'Sneaky',
  'Bold', 'Shy', 'Angry', 'Happy', 'Sad', 'Excited', 'Calm'
];

const fartNouns = [
  'Farter', 'Gasbag', 'Windmaker', 'Bubble', 'Puff', 'Blast', 'Rip',
  'Squeak', 'Thunder', 'Whisper', 'Roar', 'Sigh', 'Huff', 'Puff',
  'Breeze', 'Gust', 'Storm', 'Tornado', 'Hurricane', 'Cyclone'
];

const fartColors = [
  'Green', 'Brown', 'Yellow', 'Orange', 'Red', 'Purple', 'Blue',
  'Pink', 'Gray', 'Black', 'White', 'Silver', 'Gold'
];

export function generateRandomUsername(): string {
  const adjective = fartAdjectives[Math.floor(Math.random() * fartAdjectives.length)];
  const noun = fartNouns[Math.floor(Math.random() * fartNouns.length)];
  const color = fartColors[Math.floor(Math.random() * fartColors.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  
  return `${color}${adjective}${noun}${number}`;
}

export function generateRoomMemberCount(): number {
  // Simulate realistic room activity (1-8 people)
  return Math.floor(Math.random() * 8) + 1;
}
