# OCBC SmartFollowSystem - Chatbot Interface

This is the OCBC SmartFollowSystem chatbot interface built with Next.js and integrated with Ollama for local AI model hosting.

## 🤖 AI Model Setup (Ollama)

This project uses **Ollama** for free, local AI model hosting. All data stays on your machine!

### Step 1: Install Ollama

1. Download Ollama from [https://ollama.com](https://ollama.com)
2. Install it on your machine
3. Ollama will run automatically in the background

### Step 2: Download a Model

Open your terminal and run one of these commands:

**Recommended for most users (smaller, faster):**
```bash
ollama pull llama3.2
```

**For better quality (larger, slower):**
```bash
ollama pull llama3.1
```

**Other good options:**
```bash
ollama pull mistral      # Fast and efficient
ollama pull phi3         # Very small, very fast
ollama pull gemma2       # Google's model
```

### Step 3: Set Up Neon Database

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
   Create a `.env.local` file in the `ocbc-sfs` directory:

```env
# Neon Database Connection (REQUIRED)
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require

# Ollama Configuration (Optional)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

The database schema will be automatically created on first run.

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Make sure Ollama is running:**
   - Ollama should start automatically after installation
   - You can verify by running: `ollama list` in your terminal

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Features

- ✅ Local AI model hosting (100% free, no API costs)
- ✅ Neon DB integration for persistent case storage
- ✅ Admin dashboard for case management
- ✅ Modern chat interface
- ✅ Dark mode support
- ✅ Responsive design

## 🔧 Troubleshooting

**Problem: "Cannot connect to Ollama"**
- Make sure Ollama is installed and running
- Check if Ollama is running: `ollama list`
- Restart Ollama if needed

**Problem: Model not found**
- Make sure you've pulled the model: `ollama pull llama3.2`
- Check available models: `ollama list`

**Problem: Slow responses**
- Try a smaller model like `llama3.2` or `phi3`
- Make sure you have enough RAM (models need 4-8GB+)

**Problem: "DATABASE_URL environment variable is not set"**
- Make sure you've created a `.env.local` file
- Add your Neon database connection string to the file
- Restart your development server after adding the environment variable

**Problem: Database connection errors**
- Verify your Neon connection string is correct
- Check that your Neon project is active
- Ensure SSL mode is set to `require` in the connection string

## 📚 Learn More

- [Ollama Documentation](https://ollama.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Available Ollama Models](https://ollama.com/library)
