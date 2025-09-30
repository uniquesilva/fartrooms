# 🌬️ Fart Rooms

A meme-driven website where users can enter different fart-themed chatrooms, each powered by a unique AI persona. No login, no wallet, no signup — just click, chat, and laugh!

## Features

- **15 Unique AI Rooms**: Each with a distinct fart-themed personality
- **No Barriers**: Instant entry and chat without any signup
- **AI Personalities**: Powered by OpenAI GPT-4o Mini with custom prompts
- **Visual Humor**: Fart bubble animations and sound effects
- **Randomizer**: "Send me to a random fart room" button
- **Mobile-Friendly**: Responsive design for quick laughs

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **AI**: OpenAI GPT-4o Mini API
- **Database**: MongoDB (Railway)
- **Icons**: Lucide React

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   MONGO_URL=your_mongodb_connection_string_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Get API Keys**
   - **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
   - **MongoDB**: Use [Railway](https://railway.app) for free MongoDB hosting

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment

### Railway Deployment

1. **Connect to Railway**
   ```bash
   npm install -g @railway/cli
   railway login
   railway link
   ```

2. **Set Environment Variables**
   ```bash
   railway variables set OPENAI_API_KEY=your_key_here
   railway variables set MONGO_URL=your_mongodb_url_here
   railway variables set NEXT_PUBLIC_APP_URL=https://your-app.railway.app
   ```

3. **Deploy**
   ```bash
   railway up
   ```

### Domain Setup (Namecheap)

1. **Purchase Domain**: Get `fartrooms.xyz` from Namecheap
2. **Configure DNS**: Point to Railway deployment
3. **Update Environment**: Set `NEXT_PUBLIC_APP_URL` to your domain

## Room Personalities

1. **Silent But Deadly** 😶 - Short, cutting, mysterious replies
2. **The Shart** 💩 - Chaotic oversharer, messy humor
3. **The Squeaker** 😰 - Nervous, squeaky, emoji-heavy
4. **The Wet One** 💦 - Overly dramatic, dripping in detail
5. **The Ripper** 💥 - Loud, explosive, roast-heavy
6. **Crop Duster** 🌾 - Quick one-liners, sneaky exits
7. **The Gas Chamber** ☠️ - Suffocating walls of text
8. **Thunder Down Under** ⚡ - Loud Aussie slang + thunder vibes
9. **Cheek Clapper** 👏 - Rhythmic replies, rap-style burns
10. **Air Biscuit** 🍪 - Polite at first, then shady
11. **Ghost Fart** 👻 - Faint, cryptic, almost invisible
12. **The Machine Gun** 🔫 - Rapid-fire, choppy bursts
13. **Egg Salad Special** 🥚 - Obsessed with food & gut blame
14. **Hot Box** 📦 - Speaks as a group, claustrophobic jokes
15. **Dumpster Fart** 🗑️ - Gross, unhinged, chaotic nonsense

## Social Links

- **X (Twitter)**: [@FartRooms](https://x.com/FartRooms)
- **Telegram**: [t.me/fartrooms](https://t.me/fartrooms)

## Contributing

This is a meme project, but feel free to submit issues or pull requests for:
- New fart room personalities
- Bug fixes
- Performance improvements
- Additional animations

## License

MIT License - Feel free to use this code for your own fart-themed projects! 💨