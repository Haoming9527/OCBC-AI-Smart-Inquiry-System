# OCBC AI Smart Inquiry System (OASIS) - Chatbot Interface

This is the OCBC AI Smart Inquiry System (OASIS) chatbot interface built with Next.js and integrated with Google Gemini AI.

## 🤖 AI Model Setup (Gemini)

This project uses **Google Gemini AI** for intelligent chatbot responses.

### Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key" to generate a new API key
4. Copy your API key (you'll need it for the next step)

### Step 2: Set Up Neon Database

This project uses **Neon DB** (serverless Postgres) for storing cases and messages.

1. **Create a Neon account:**
   - Go to [https://neon.tech](https://neon.tech)
   - Sign up for a free account
   - Create a new project

2. **Get your connection string:**
   - In the Neon dashboard, go to your project
   - Click on "Connection Details"
   - Copy the connection string (it looks like: `postgresql://username:password@hostname/database?sslmode=require`)

3. **Configure Environment:**
   Create a `.env` file in the `oasis` directory:

```env
# Neon Database Connection (REQUIRED)
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require

# Gemini API Key (REQUIRED)
GEMINI_API_KEY=your_gemini_api_key_here
```

The database schema will be automatically created on first run.

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Features

- ✅ Google Gemini AI integration for intelligent responses
- ✅ Neon DB integration for persistent case storage
- ✅ Admin dashboard for case management
- ✅ Modern chat interface
- ✅ Dark mode support
- ✅ Responsive design

## 🔧 Troubleshooting

**Problem: "GEMINI_API_KEY environment variable is not set"**
- Make sure you've created a `.env` file
- Add your Gemini API key to the file: `GEMINI_API_KEY=your_api_key_here`
- Restart your development server after adding the environment variable
- Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

**Problem: "Invalid GEMINI_API_KEY"**
- Verify your API key is correct in `.env`
- Make sure there are no extra spaces or quotes around the API key
- Check that your API key is active in Google AI Studio

**Problem: "Gemini API quota exceeded"**
- Check your API usage in Google AI Studio
- You may need to wait for quota reset or upgrade your plan

**Problem: "DATABASE_URL environment variable is not set"**
- Make sure you've created a `.env` file
- Add your Neon database connection string to the file
- Restart your development server after adding the environment variable

**Problem: Database connection errors**
- Verify your Neon connection string is correct
- Check that your Neon project is active
- Ensure SSL mode is set to `require` in the connection string

## 🚀 Deployment to Vercel

This project is ready to deploy to Vercel. Follow these steps:

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Set Environment Variables:**
   After deployment, add your environment variables in the Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add the following variables:
     - `DATABASE_URL` - Your Neon database connection string
     - `GEMINI_API_KEY` - Your Google Gemini API key
     - `NEXT_PUBLIC_BASE_URL` - Your production URL (e.g., `https://your-app.vercel.app`)

5. **Redeploy:**
   After adding environment variables, redeploy your application:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub Integration

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will automatically detect Next.js

3. **Configure Environment Variables:**
   - In the project settings, go to "Environment Variables"
   - Add the following:
     - `DATABASE_URL` - Your Neon database connection string
     - `GEMINI_API_KEY` - Your Google Gemini API key
     - `NEXT_PUBLIC_BASE_URL` - Your production URL (will be provided after first deployment)

4. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy your application
   - After deployment, update `NEXT_PUBLIC_BASE_URL` with your actual Vercel URL

### Required Environment Variables for Production

Make sure to set these in your Vercel project settings:

```env
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

**Note:** `NEXT_PUBLIC_BASE_URL` is used for generating QR codes. After your first deployment, Vercel will provide you with a URL like `https://your-app.vercel.app`. Update this variable with your actual deployment URL.

### Post-Deployment Checklist

- ✅ Verify all environment variables are set correctly
- ✅ Test the chat functionality
- ✅ Test database connections
- ✅ Verify QR code generation works (if using case escalation)
- ✅ Check that the admin dashboard is accessible

## 📚 Learn More

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Google AI Studio](https://makersuite.google.com/app/apikey)
