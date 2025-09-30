# 🚀 Fart Rooms Deployment Guide

## Quick Start

1. **Get API Keys**
   - OpenAI API Key: https://platform.openai.com/api-keys
   - MongoDB: Use Railway (free tier available)

2. **Update Environment Variables**
   ```bash
   # Edit .env.local
   OPENAI_API_KEY=sk-your-key-here
   MONGO_URL=mongodb://your-connection-string
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Run Locally**
   ```bash
   npm run dev
   ```

## Railway Deployment

### Option 1: Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Option 2: Railway Dashboard
1. Go to https://railway.app
2. Connect your GitHub repository
3. Add environment variables in dashboard
4. Deploy automatically

## Environment Variables for Production

```env
OPENAI_API_KEY=sk-your-production-key
MONGO_URL=mongodb://your-production-connection-string
NEXT_PUBLIC_APP_URL=https://your-domain.railway.app
```

## Domain Setup (Namecheap)

1. **Purchase Domain**: fartrooms.xyz
2. **Configure DNS**:
   - A Record: @ → Railway IP
   - CNAME: www → your-app.railway.app
3. **Update Railway**: Add custom domain in Railway dashboard

## Social Media Setup

- **X (Twitter)**: Create @FartRooms account
- **Telegram**: Create t.me/fartrooms channel
- **Update Links**: Update social links in the app

## Monitoring

- **Railway Dashboard**: Monitor usage and logs
- **MongoDB Atlas**: Monitor database performance
- **OpenAI Usage**: Track API usage and costs

## Cost Estimation

- **Railway**: Free tier (500 hours/month)
- **MongoDB**: Free tier (512MB storage)
- **OpenAI**: Pay-per-use (~$0.01 per 1K tokens)
- **Domain**: ~$10/year

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Check OpenAI API key is valid
   - Ensure sufficient credits

2. **Database Connection Failed**
   - Verify MongoDB connection string
   - Check Railway environment variables

3. **Build Errors**
   - Run `npm run build` locally first
   - Check for TypeScript errors

### Support

- Check Railway logs for deployment issues
- Monitor OpenAI API usage
- Test locally before deploying

## Security Notes

- Never commit API keys to Git
- Use environment variables for all secrets
- Enable Railway's security features
- Monitor for unusual API usage

Happy farting! 💨
